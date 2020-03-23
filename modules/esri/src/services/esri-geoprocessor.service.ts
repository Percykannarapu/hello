import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { EsriSort } from '../models/esri-sort';
import { ObservableGeoprocessor, ObservablePrintTask } from '../models/observable-processors';
import { LabelDuplicateRemoval, LabelMultiPartHandling, SimpleFillType } from '../models/web-map.enums';
import { Webmap } from '../models/web-map.interfaces';

@Injectable()
export class EsriGeoprocessorService {

  constructor() { }

  public processJob<T>(serviceUrl: string, servicePayload: any, resultType: string = 'out_features') : Observable<{ value: T }> {
    const processor = new ObservableGeoprocessor({ url: serviceUrl });
    return processor.submitJob(servicePayload).pipe(
      switchMap(result => processor.getResultData(result.jobId, resultType)),
    );
  }

  public processPrintJob(printServiceUrl: string, servicePayload: __esri.PrintParameters) : Observable<string> {
    const processor: ObservablePrintTask = new ObservablePrintTask({url: printServiceUrl});
    const proxy = (result: Webmap) => {
      result.operationalLayers.forEach(l => {
        // most of the actual layers do not have layerType set, so I'm fixing them up with this code
        if (l.layerType == null) {
          l.layerType = l.type as any || 'ArcGISFeatureLayer';
        }
        // All of the layers we care about changing are Feature Layers
        if (l.layerType === 'ArcGISFeatureLayer' && l.layerDefinition != null) {
          const info = l.layerDefinition.drawingInfo;
          if (l.showLabels) {
            const currentLabel = info.labelingInfo[0];
            currentLabel.removeDuplicates = LabelDuplicateRemoval.None;
            currentLabel.multiPart = LabelMultiPartHandling.Largest;
            // currentLabel.symbol.haloColor[3] = 127;
            if (l.title === 'ZIP Boundaries') {
              currentLabel.symbol.font.size = 9;
            }
            if (l.title === 'ATZ Boundaries' || l.title === 'Digital ATZ Boundaries' || l.title === 'PCR Boundaries') {
              currentLabel.symbol.font.size = 7;
              // currentLabel.symbol.haloColor[3] = 0;
              // currentLabel.symbol.color[3] = 200;
            }
          }
          if (info.renderer != null) {
            const currentRenderer = info.renderer;
            switch (currentRenderer.type) {
              case 'simple':
                if (l.title.startsWith('Selected') && currentRenderer.symbol.type === 'esriSFS' && currentRenderer.symbol.style !== SimpleFillType.Solid) {
                  l.opacity = 0.75;
                }
                break;
              case 'classBreaks':
                if (currentRenderer.classBreakInfos != null) {
                  currentRenderer.classBreakInfos.sort(EsriSort.classBreakByMaxValue);
                  currentRenderer.minValue = currentRenderer.classBreakInfos[0].classMinValue;
                }
                break;
            }
          }
        }
      });
      return result;
    };

    processor.attachProxyToPromise('_getPrintDefinition', proxy);

    return processor.execute(servicePayload).pipe(
      filter(result => result != null && result.url != null),
      map(result => result.url)
    );
  }
}
