import { Inject, Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';

@Injectable()
export class EsriDomainFactoryService {

  constructor(@Inject(EsriAppSettingsToken) private config: EsriAppSettings) { }

  createExtent(xStats: { min: number, max: number }, yStats: { min: number, max: number }, minPadding?: number) : __esri.Extent {
    const result = new EsriApi.Extent({
      xmin: xStats.min,
      ymin: yStats.min,
      xmax: xStats.max,
      ymax: yStats.max,
      spatialReference: {
        wkid: this.config.defaultSpatialRef
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

  createSketchViewModel(currentMapView: __esri.MapView) : __esri.SketchViewModel {
    if (currentMapView == null) throw new Error('The SketchViewModel factory requires a valid MapView instance.');
    const result = new EsriApi.widgets.SketchViewModel({
      view: currentMapView,
      layer: new EsriApi.GraphicsLayer({}),
      pointSymbol: {
        type: 'simple-marker',
        style: 'square',
        color: '#8A2BE2',
        size: '16px',
        outline: {
          color: [255, 255, 255],
          width: 3 // points
        }
      },
      polylineSymbol: {
        type: 'simple-line',
        style: 'short-dash',
        width: 1.25,
        color: [230, 0, 0, 1]
      },
      polygonSymbol: {
        type: 'simple-fill',
        color: 'rgba(0,0,0,0)',
        style: 'solid',
        outline: {
          color: 'red',
          width: 1
        }
      }
    } as any);

    // the sketchViewModel introduces an empty GraphicsLayer to the map,
    // even if you specify a local temp layer. This code is to suppress
    // this layer so it doesn't show in the layer list
    currentMapView.map.allLayers.forEach(l => {
      if (l.title == null) l.listMode = 'hide';
    });
    return result;
  }
}
