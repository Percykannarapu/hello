import { Observable } from 'rxjs';
import { EsriApi } from './esri-api.service';

export interface WatchResult<T, K extends keyof T> {
  newValue: T[K];
  oldValue: T[K];
  propName: K;
  target: T;
}

type mapViewEventNames = 'resize' | 'layerview-create' | 'layerview-destroy' | 'click' | 
                        'double-click' | 'immediate-click' | 'hold' | 'drag' | 'mouse-wheel' | 
                        'key-down' | 'key-up' | 'pointer-down' | 'pointer-move' | 'pointer-up' | 
                        'pointer-enter' | 'pointer-leave' | 'focus' | 'blur';

type mapViewEventResults =
  __esri.MapViewResizeEvent | __esri.MapViewLayerviewCreateEvent | __esri.MapViewLayerviewDestroyEvent | __esri.MapViewClickEvent |
  __esri.MapViewDoubleClickEvent | __esri.MapViewImmediateClickEvent | __esri.MapViewHoldEvent | __esri.MapViewDragEvent |
  __esri.MapViewMouseWheelEvent | __esri.MapViewKeyDownEvent | __esri.MapViewKeyUpEvent | __esri.MapViewPointerDownEvent |
  __esri.MapViewPointerMoveEvent | __esri.MapViewPointerUpEvent | __esri.MapViewPointerEnterEvent | __esri.MapViewPointerLeaveEvent |
  __esri.MapViewFocusEvent | __esri.MapViewBlurEvent;

export class EsriUtils {

  public static layerIsFeature(l: __esri.Layer) : l is __esri.FeatureLayer {
    return l != null && l.type === 'feature';
  }

  public static layerIsPortalFeature(l: __esri.Layer) : l is __esri.FeatureLayer {
    return this.layerIsFeature(l) && l.portalItem != null;
  }

  public static geometryIsPoint(g: __esri.Geometry) : g is __esri.Point {
    return g != null && g.type === 'point';
  }
  public static geometryIsPolygon(g: __esri.Geometry) : g is __esri.Polygon {
    return g != null && g.type === 'polygon';
  }

  public static rendererIsSimple(r: __esri.Renderer) : r is __esri.SimpleRenderer {
    return r != null && r.hasOwnProperty('type') && r['type'] === 'simple';
  }

  public static symbolIsSimpleFill(s: __esri.Symbol) : s is __esri.SimpleFillSymbol {
    return s != null && s.type === 'simple-fill';
  }

  public static getDistance(a: __esri.Point, b: __esri.Point) : number;
  public static getDistance(a: __esri.Point, x: number, y: number) : number;
  public static getDistance(x1: number, y1: number, x2: number, y2: number) : number;
  public static getDistance(param1: __esri.Point | number, param2: __esri.Point | number, param3?: number, param4?: number) : number {
    let xA: number;
    let yA: number;
    let xB: number;
    let yB: number;
    if (typeof param1 !== 'number') {
      xA = param1.x;
      yA = param1.y;
      if (typeof param2 !== 'number') {
        xB = param2.x;
        yB = param2.y;
      } else {
        xB = param2;
        yB = param3;
      }
    } else {
      xA = param1;
      yA = param2 as number;
      xB = param3;
      yB = param4;
    }
    const line = new EsriApi.PolyLine({ paths: [[[xA, yA], [xB, yB]]] });
    return EsriApi.geometryEngine.geodesicLength(line, 'miles');
  }

  public static clone<T>(original: T) : T {
    return EsriApi.lang.clone(original);
  }

  public static setupWatch<T extends __esri.Accessor, K extends keyof T>(instance: T, prop: K) : Observable<WatchResult<T, K>> {
    return Observable.create(observer => {
      let handle;
      try {
        handle = instance.watch(prop, (newValue, oldValue, propName, target) => {
          observer.next({ newValue, oldValue, propName, target });
        });
      } catch (err) {
        observer.error(err);
      }
      return () => {
        if (handle) handle.remove();
      };
    });
  }

  public static handleEvent<T>(instance: __esri.Evented, event: string) : Observable<T> {
    return Observable.create(observer => {
      let handle;
      try {
        handle = instance.on(event, e => observer.next(e));
      } catch (err) {
        observer.error(err);
      }
      return () => {
        if (handle) handle.remove();
      };
    });
  }

  public static handleMapViewEvent(mapView: __esri.MapView, event: 'resize') : Observable<__esri.MapViewResizeEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'layerview-create') : Observable<__esri.MapViewLayerviewCreateEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'layerview-destroy') : Observable<__esri.MapViewLayerviewDestroyEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'click') : Observable<__esri.MapViewClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'double-click') : Observable<__esri.MapViewDoubleClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'immediate-click') : Observable<__esri.MapViewImmediateClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'hold') : Observable<__esri.MapViewHoldEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'drag') : Observable<__esri.MapViewDragEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'mouse-wheel') : Observable<__esri.MapViewMouseWheelEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'key-down') : Observable<__esri.MapViewKeyDownEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'key-up') : Observable<__esri.MapViewKeyUpEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-down') : Observable<__esri.MapViewPointerDownEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-move') : Observable<__esri.MapViewPointerMoveEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-up') : Observable<__esri.MapViewPointerUpEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-enter') : Observable<__esri.MapViewPointerEnterEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-leave') : Observable<__esri.MapViewPointerLeaveEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'focus') : Observable<__esri.MapViewFocusEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'blur') : Observable<__esri.MapViewBlurEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: mapViewEventNames) : Observable<mapViewEventResults> {
    return Observable.create(observer => {
      let handle;
      try {
        handle = mapView.on(event, e => observer.next(e));
      } catch (err) {
        observer.error(err);
      }
      return () => {
        if (handle) handle.remove();
      };
    });
  }
}