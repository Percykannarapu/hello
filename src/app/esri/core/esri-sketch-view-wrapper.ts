import { Observable, Subject } from 'rxjs';
import { EsriApi } from './esri-api.service';
import { EsriGraphicTypeCodes } from './esri.enums';

export class EsriSketchViewWrapper {
  private sketchViewModel: __esri.SketchViewModel;

  constructor(private mapView: __esri.MapView) {
    this.init();
  }

  private init() : void {
    this.sketchViewModel = new EsriApi.widgets.SketchViewModel({
      view: this.mapView,
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
        color: 'rgba(0,0,0, 0)',
        style: 'solid',
        outline: {
          color: 'red',
          width: 1
        }
      }
    } as any);

    // the sketchViewModel introduces an empty GraphicsLayer to the map,
    // even if you specify a local temp layer, so this code is to suppress
    // this "undefined" layer
    this.mapView.map.allLayers.forEach(l => {
      if (l.title == null) l.listMode = 'hide';
    });
  }

  public draw(graphicType: EsriGraphicTypeCodes) : Observable<__esri.Geometry> {
    this.reset();
    const result = new Subject<__esri.Geometry>();
    const drawingHandler = this.sketchViewModel.on('create-complete', e => {
      let symbol: __esri.Symbol;
      switch (e.geometry.type) {
        case 'point':
          symbol = this.sketchViewModel.pointSymbol;
          break;
        case 'polyline':
          symbol = this.sketchViewModel.polylineSymbol;
          break;
        default:
          symbol = this.sketchViewModel.polygonSymbol;
          break;
      }
      const sketchGraphic = new EsriApi.Graphic({
        geometry: e.geometry,
        symbol: symbol
      });
      this.mapView.graphics.add(sketchGraphic);
      result.next(e.geometry);
      result.complete();
      drawingHandler.remove();
    });
    this.sketchViewModel.create(graphicType);
    return result.asObservable();
  }

  public reset() : void {
    if (this.sketchViewModel != null) this.sketchViewModel.reset();
  }

}
