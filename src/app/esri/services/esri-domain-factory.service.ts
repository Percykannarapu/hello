import { Inject, Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriAppSettingsConfig, EsriAppSettingsToken } from '../configuration';

@Injectable({
  providedIn: 'root'
})
export class EsriDomainFactoryService {

  constructor(@Inject(EsriAppSettingsToken) private config: EsriAppSettingsConfig) { }

  public createExtent(xStats: { min: number, max: number }, yStats: { min: number, max: number }, minPadding?: number) : __esri.Extent {
    const result = new EsriApi.Extent({
      xmin: xStats.min,
      ymin: yStats.min,
      xmax: xStats.max,
      ymax: yStats.max,
      spatialReference: {
        wkid: this.config.esriAppSettings.defaultSpatialRef
      }
    });

    if (minPadding && result.width === 0) {
      result.xmin = result.xmin - minPadding;
      result.xmax = result.xmax + minPadding;
    }
    if (minPadding && result.height === 0) {
      result.ymin = result.ymin - minPadding;
      result.ymax = result.ymax + minPadding;
    }
    return result;
  }
}
