import { Injectable } from '@angular/core';
import { EsriLayerService, EsriGeoprocessorService } from '@val/esri';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/app/app.config';
import { PrintModel, PrintPayload, FullPayload, ResultType } from '../state/app.interfaces';
import { AppShadingService } from './app-shading.service';
import { SharedState } from '../state/shared/shared.reducers';
import { ConfigService } from './config.service';
import { AppLayerService } from './app-layer-service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppPrintingService {

  constructor (private esriLayerService: EsriLayerService,
    private appShadingService: AppShadingService,
    private esriGeoprocessorService: EsriGeoprocessorService,
    private configService: ConfigService,
    private appLayerService: AppLayerService,
    private config: AppConfig) {}
  
  public firstIHD: string;
  public allDates: string;

  public createFeatureSet(payload: Partial<FullPayload>) : Observable<ResultType> {
    const shadingGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.clone();
    shadingGraphics.forEach(g => g.geometry = null);
    const definitionExpression = this.appShadingService.boundaryExpression;
    const siteGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getFeatureLayer('Project Sites').source;
    siteGraphics.forEach(g => delete g.attributes['OBJECTID']);

    const printFeatures: PrintModel = { 
      clientName: payload.clientName,
      layerSource: payload.layerSource, 
      siteFeatures: siteGraphics.toArray(), 
      shadingFeatures: shadingGraphics.toArray(), 
      boundaryDefinitionExpression: definitionExpression,
      zipsLabelingExpression: payload.zipsLabelingExpression,
      layerSourceLabelingExpression: payload.layerSourceLabelingExpression 
    };
    const serviceUrl = this.config.printServiceUrl;  
    const servicePayload: PrintPayload = {
      sites: printFeatures,
      radius: payload.radius,
      inHomeDate: this.allDates,
      reportName: payload.reportName + this.firstIHD.replace(/\//g, '-'),
      rfpNumber: payload.rfpNumber,
      mediaPlanId: payload.mediaPlanId,
      tradeArea: payload.tradeArea,
    }; 
    console.log(JSON.stringify(servicePayload, null, 2));
    return this.esriGeoprocessorService.processJob<ResultType>(serviceUrl, servicePayload, 'reportUrl').pipe(
      map(response => response.value)
    );
  }

  public setPrintParams(shared: SharedState, printParams: Partial<FullPayload>, fromDate: Date){
    this.firstIHD = fromDate.toLocaleDateString();
    if (shared.isWrap){
      printParams.layerSource = this.configService.layers['wrap'].serviceUrl;
      printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
      printParams.layerSourceLabelingExpression = this.configService.layers['wrap'].boundaries.labelExpression;
    }
    else{
     if (this.appLayerService.analysisLevel === 'zip') {
        printParams.layerSource = this.configService.layers['zip'].serviceUrl;
        printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
        printParams.layerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
     } else{
        printParams.layerSource = this.configService.layers['atz'].serviceUrl;
        printParams.zipsLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
        printParams.layerSourceLabelingExpression = this.configService.layers['atz'].boundaries.labelExpression;
     }
    }
  return this.createFeatureSet(printParams);
  }

  public downloadPDF(results?: ResultType){
    console.log('Download PDF');
    const url = results.value;
    const fileName = url.split(/[\s/]+/);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName[fileName.length - 1];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
}
