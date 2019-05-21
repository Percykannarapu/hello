import { Injectable } from '@angular/core';
import { EsriLayerService, EsriApi, EsriGeoprocessorService } from '@val/esri';
import { AppLayerService } from './app-layer-service';
import { Observable } from 'rxjs';
import { AppConfig } from 'src/app/app.config';
import { PrintModel, PrintPayload, FullPayload } from '../state/app.interfaces';



@Injectable({
  providedIn: 'root'
})
export class AppPrintingService {

  constructor (private esriLayerService: EsriLayerService,
    private appLayerService: AppLayerService,
    private esriGeoprocessorService: EsriGeoprocessorService,
    private config: AppConfig) {}
  
  public firstIHD;
  public lastIHD;

  public createFeatureSet<T>(payload: Partial<FullPayload>) : Observable<{ value: T }> {
    const shadingGraphics: __esri.Collection<__esri.Graphic> = this.esriLayerService.getGraphicsLayer('Selected Geos').graphics.clone();
    shadingGraphics.forEach(g => g.geometry = null);
    const definitionExpression = this.appLayerService.boundaryExpression;
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
      inHomeDate: this.firstIHD + '-' + this.lastIHD,
      reportName: payload.reportName + this.firstIHD,
      rfpNumber: payload.rfpNumber,
      mediaPlanId: payload.mediaPlanId,
      tradeArea: payload.tradeArea,
      userEmail: payload.userEmail,
      rootDirectory: this.config.printRootDirectory, 
    }; 
    console.log(JSON.stringify(servicePayload, null, 2));
    return this.esriGeoprocessorService.processJob(serviceUrl, servicePayload, 'Output_File');
  }
}