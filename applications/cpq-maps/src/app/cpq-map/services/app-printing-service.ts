import { Injectable } from '@angular/core';
import { EsriLayerService, EsriGeoprocessorService } from '@val/esri';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/app/app.config';
import { PrintModel, PrintPayload, FullPayload, ResultType } from '../state/app.interfaces';
import { SharedState } from '../state/shared/shared.reducers';
import { ConfigService } from './config.service';
import { AppLayerService } from './app-layer-service';

@Injectable({
  providedIn: 'root'
})
export class AppPrintingService {

  constructor (private esriLayerService: EsriLayerService,
    private esriGeoprocessorService: EsriGeoprocessorService,
    private configService: ConfigService,
    private appLayerService: AppLayerService,
    private config: AppConfig) {}
  
  public firstIHD: string;
  public allDates: string;

  public createFeatureSet(payload: Partial<FullPayload>) : Observable<ResultType> {
    const shadingGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.clone();
    shadingGraphics.forEach(g => g.geometry = null);
    const geocodes = shadingGraphics.map(g => `'${g.getAttribute('geocode')}'`);
    const definitionExpression = `geocode in (${geocodes.join(',')})`;
    const siteGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getFeatureLayer('Project Sites').source;
    siteGraphics.forEach(g => {
      if (g.attributes['siteName'] != null && g.attributes['siteName'].length > 0){
        g.attributes['siteName'] = g.attributes['siteName'].replace(/[\/\\]/g, '-');
        if (g.attributes['siteName'].length > 50)
            g.attributes['siteName'] = g.attributes['siteName'].slice(0, 49);
      }
       delete g.attributes['OBJECTID'];
    });
    const printFeatures: PrintModel = { 
      clientName: payload.clientName,
      layerSource: payload.layerSource, 
      siteFeatures: siteGraphics.toArray(), 
      shadingFeatures: shadingGraphics.filter(g => g.visible).toArray(),
      boundaryDefinitionExpression: definitionExpression,
      secondaryLayerSourceLabelingExpression: payload.secondaryLayerSourceLabelingExpression,
      layerSourceLabelingExpression: payload.layerSourceLabelingExpression,
      secondaryLayerSource: payload.secondaryLayerSource 
    };
    const serviceUrl = this.config.printServiceUrl;  
    const servicePayload: PrintPayload = {
      sites: JSON.stringify(printFeatures),
      radius: payload.radius,
      inHomeDate: this.allDates,
      reportName: payload.reportName + this.firstIHD.replace(/\//g, '-'),
      rfpNumber: payload.rfpNumber,
      mediaPlanId: payload.mediaPlanId,
      tradeArea: payload.tradeArea,
    }; 
    console.log('Generating map for', servicePayload.rfpNumber, 'and MP-' + servicePayload.mediaPlanId);
    // console.log(JSON.stringify(servicePayload, null, 2));
    return this.esriGeoprocessorService.processJob(serviceUrl, servicePayload, 'reportUrl');
  }

  public setPrintParams(shared: SharedState, printParams: Partial<FullPayload>, fromDate: Date){
    const formatDate = new Date(fromDate.toLocaleDateString());
    const day = formatDate.getDate() > 0 && formatDate.getDate() < 10 ? '0' + formatDate.getDate() : formatDate.getDate();
    const month = formatDate.getMonth() >= 0 && formatDate.getMonth() < 9 ? '0' + (formatDate.getMonth() + 1) : (formatDate.getMonth() + 1);
    this.firstIHD = (month.toString()).slice(-2) + '-' + (day.toString()).slice(-2) + '-' + formatDate.getFullYear();

    if (shared.isWrap) {
      printParams.layerSource = this.configService.layers['zip'].serviceUrl;
      printParams.secondaryLayerSourceLabelingExpression = this.configService.layers['wrap'].boundaries.labelExpression;
      printParams.layerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
      printParams.secondaryLayerSource = this.configService.layers['wrap'].serviceUrl;
    } else if (shared.analysisLevel === 'zip') {
      printParams.layerSource = this.configService.layers['zip'].serviceUrl;
      printParams.secondaryLayerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
      printParams.layerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
      printParams.secondaryLayerSource = this.configService.layers['zip'].serviceUrl;
    } else {
      printParams.layerSource = this.configService.layers['atz'].serviceUrl;
      printParams.secondaryLayerSourceLabelingExpression = this.configService.layers['zip'].boundaries.labelExpression;
      printParams.layerSourceLabelingExpression = this.configService.layers['atz'].boundaries.labelExpression;
      printParams.secondaryLayerSource = this.configService.layers['zip'].serviceUrl;
    }
    return this.createFeatureSet(printParams);
  }

  public openPDF(result: string){
    console.log('Opening PDF from', result);
    const url = result;
    const fileName = url.split(/[\s/]+/);
    const link = document.createElement('a');
    link.target = '_blank';
    link.href = url;
    link.download = fileName[fileName.length - 1]; // doesn't download PDF, it instead opens PDF in new tab
    link.dispatchEvent(new MouseEvent('click'));
  }
  
}
