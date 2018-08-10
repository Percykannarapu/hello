import { ElementRef, Inject, Injectable } from '@angular/core';
import { EsriModules } from './esri-modules.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { share } from 'rxjs/operators';
import { EsriLoaderConfig, EsriLoaderToken } from '../configuration';
import { EsriGraphicTypeCodes } from '../esri.enums';

export interface WidgetConstructor {
  new (properties?: any) : __esri.Widget;
}

@Injectable()
export class EsriMapService {
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private sketchViewModel: __esri.SketchViewModel;

  public onReady$: Observable<boolean> = this.isReady.asObservable();
  public map: __esri.Map;
  public mapView: __esri.MapView;

  constructor(private modules: EsriModules, @Inject(EsriLoaderToken) private config: EsriLoaderConfig) {}

  public loadMap(mapProperties: __esri.MapProperties, mapViewProperties: __esri.MapViewProperties, mapEl: ElementRef) : void {
    this.modules.onReady(() => {
      this.loadImpl(mapProperties, mapViewProperties, mapEl);
    });
  }

  private loadImpl(mapProperties: __esri.MapProperties, mapViewProperties: __esri.MapViewProperties, mapEl: ElementRef) {
    console.log('Initializing Esri Map Service');
    this.map = new EsriModules.Map(mapProperties);
    // prepare properties that should be set locally
    // create a new object so as to not modify the provided object
    const newMapViewProps = Object.assign({}, mapViewProperties);
    if (!newMapViewProps.container) newMapViewProps.container = mapEl.nativeElement;
    if (!newMapViewProps.map) newMapViewProps.map = this.map;
    // create the MapView
    //console.log('Creating map view with props:: ', newMapViewProps);
    this.mapView = new EsriModules.MapView(newMapViewProps);
    this.mapView.when(() => {
      this.isReady.next(true);
    });
  }

  private addWidget(item: __esri.Widget, position: string);
  private addWidget(item: ElementRef | __esri.Widget, position: string) {
    if (item instanceof ElementRef) {
      this.mapView.ui.add(item.nativeElement, position);
    } else {
      this.mapView.ui.add(item, position);
    }
  }

  public createMapFieldHandler<T>(fieldName: string) : Observable<T> {
    return this.createFieldHandler<T>(this.map, fieldName);
  }

  public createMapViewFieldHandler<T>(fieldName: string) : Observable<T> {
    return this.createFieldHandler<T>(this.mapView, fieldName);
  }

  public createMapViewEventHandler<T>(eventName: string) : Observable<T> {
    return Observable.create(observer => {
      const esriHandle = this.mapView.on(eventName, f => observer.next(f));
      return () => esriHandle.remove();
    }).pipe(share());
  }

  private createFieldHandler<T>(esriItem: __esri.Accessor, fieldName: string) : Observable<T> {
    return Observable.create(observer => {
      const esriHandle = esriItem.watch(fieldName, f => observer.next(f));
      return () => esriHandle.remove();
    }).pipe(share());
  }

  private setupSketchViewModel() : void {
    this.sketchViewModel = new EsriModules.widgets.SketchViewModel({
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
    this.map.allLayers.forEach(l => {
      if (l.title == null) l.listMode = 'hide';
    });
  }

  public zoomOnMap(xStats: { min: number, max: number }, yStats: { min: number, max: number }, pointCount: number) : void {
    if (pointCount === 0) return;
    let extent: __esri.Extent;
    //new EsriModules
    extent = new EsriModules.Extent({
      xmin: xStats.min,
      ymin: yStats.min,
      xmax: xStats.max,
      ymax: yStats.max,
      spatialReference: {
          wkid: this.config.esriConfig.defaultSpatialRef
      }
    });

    if (extent.width === 0) {
      extent.xmin = extent.xmin - 0.15;
      extent.xmax = extent.xmax + 0.15;
    }
    if (extent.height === 0) {
      extent.ymin = extent.ymin - 0.15;
      extent.ymax = extent.ymax + 0.15;
    }
    this.mapView.extent = extent;

    if (pointCount === 1) {
      this.mapView.zoom = 12;
    } else {
      this.mapView.zoom -= 1;
    }
  }

  public createBasicWidget(constructor: WidgetConstructor, properties?: any, position: string = 'top-left') : void {
    const newProperties = { view: this.mapView, ...properties };
    const result = new constructor(newProperties);
    this.addWidget(result, position);
  }

  public createHiddenWidget(constructor: WidgetConstructor, widgetProperties?: any, expanderProperties?: __esri.ExpandProperties, position: string = 'top-left') : void {
    const newWidgetProps = { view: this.mapView, container: document.createElement('div'), ...widgetProperties };
    const result = new constructor(newWidgetProps);
    const newExpanderProps = { view: this.mapView, ...expanderProperties, content: result.container };
    const expander = new EsriModules.widgets.Expand(newExpanderProps);
    this.addWidget(expander, position);
  }

  public startDrawing(graphicType: EsriGraphicTypeCodes) : Observable<__esri.Geometry> {
    if (this.sketchViewModel == null) {
      this.setupSketchViewModel();
    }
    this.resetDrawing();
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
      const sketchGraphic = new EsriModules.Graphic({
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

  public resetDrawing() : void {
    if (this.sketchViewModel != null) this.sketchViewModel.reset();
  }

  public measurePolyLine(polyline: __esri.Polyline, units: 'meters' | 'feet' | 'kilometers' | 'miles' | 'nautical-miles' | 'yards' = 'miles') {
    const length: number = EsriModules.geometryEngine.geodesicLength(polyline, units);
    const textSymbol = {
      type: 'text',
      color: 'black',
      text: `${length.toFixed(4)} ${units}`,
      xoffset: 50,
      yoffset: 3,
      font: { // auto casts as Font
        size: 10,
        weight: 'bold',
        family: 'sans-serif'
      }
    };
    const graphic = new EsriModules.Graphic({
      geometry: polyline.getPoint(0, 0),
      symbol: textSymbol
    });
    this.mapView.graphics.add(graphic);
  }
}
