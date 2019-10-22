import { Observable } from 'rxjs';
import { EsriApi } from './esri-api.service';

export interface TokenResponse {
  token: string;
  expires: number;
  ssl: boolean;
}

export interface WatchResult<T extends __esri.Accessor, K extends keyof T> {
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

  public static layerIsGroup(l: __esri.Layer) : l is __esri.GroupLayer {
    return l != null && l.type === 'group';
  }

  public static layerIsFeature(l: __esri.Layer) : l is __esri.FeatureLayer {
    return l != null && l.type === 'feature';
  }

  public static layerIsGraphics(l: __esri.Layer) : l is __esri.GraphicsLayer {
    return l != null && l.type === 'graphics';
  }

  public static layerIsPortalFeature(l: __esri.Layer) : l is __esri.FeatureLayer {
    return this.layerIsFeature(l) && l.portalItem != null;
  }

  public static layerViewIsFeature(l: __esri.LayerView) : l is __esri.FeatureLayerView {
    return this.layerIsFeature(l.layer);
  }

  public static geometryIsPoint(g: __esri.Geometry) : g is __esri.Point {
    return g != null && g.type === 'point';
  }

  public static geometryIsPolyline(g: __esri.Geometry) : g is __esri.Polyline {
    return g != null && g.type === 'polyline';
  }

  public static geometryIsPolygon(g: __esri.Geometry) : g is __esri.Polygon {
    return g != null && g.type === 'polygon';
  }

  public static rendererIsSimple(r: __esri.Renderer) : r is __esri.SimpleRenderer {
    return r != null && r.type === 'simple';
  }

  public static rendererIsUnique(r: __esri.Renderer) : r is __esri.UniqueValueRenderer {
    return r != null && r.type === 'unique-value';
  }

  public static rendererIsClassBreaks(r: __esri.Renderer) : r is __esri.ClassBreaksRenderer {
    return r != null && r.type === 'class-breaks';
  }

  public static rendererIsDotDensity(r: __esri.Renderer) : r is __esri.DotDensityRenderer {
    return r != null && r.type === 'dot-density';
  }

  public static symbolIsSimpleFill(s: __esri.Symbol) : s is __esri.SimpleFillSymbol {
    return s != null && s.type === 'simple-fill';
  }

  public static symbolIsSimpleLine(s: __esri.Symbol) : s is __esri.SimpleLineSymbol {
    return s != null && s.type === 'simple-line';
  }

  public static itemIsPoint(p: any) : p is __esri.Point {
    return p != null && p.type === 'point';
  }

  public static getDistance(a: __esri.Point, b: __esri.Point) : number;
  public static getDistance(a: __esri.Point, x: number, y: number) : number;
  public static getDistance(x1: number, y1: number, x2: number, y2: number) : number;
  public static getDistance(param1: __esri.Point | number, param2: __esri.Point | number, param3?: number, param4?: number) : number {
    let xA: number;
    let yA: number;
    let xB: number;
    let yB: number;
    if (this.itemIsPoint(param1)) {
      xA = param1.x;
      yA = param1.y;
      if (this.itemIsPoint(param2)) {
        // was called via (a, b)
        xB = param2.x;
        yB = param2.y;
      } else {
        // was called via (a, x, y)
        xB = param2;
        yB = param3;
      }
    } else {
      // was called via (x1, y1, x2, y2)
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
    return new Observable<WatchResult<T, K>>(observer => {
      let handle;
      try {
        handle = instance.watch(prop as string, (newValue, oldValue, propName: any, target: T) => {
          observer.next({newValue, oldValue, propName, target});
        });
      } catch (err) {
        observer.error(err);
      }
      return () => {
        console.log('Handle removal for', prop);
        if (handle) handle.remove();
      };
    });
  }

  public static handleEvent<T>(instance: __esri.Evented, event: string) : Observable<T> {
    return new Observable<T>(observer => {
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
    return new Observable<mapViewEventResults>(observer => {
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

  //NOTE: DO NOT add a reference to the Q library for this IPromise interface, it will interfere with Esri's IPromise interface definition
  public static esriPromiseToEs6<T>(esriPromise: IPromise<T>) : Promise<T> {
    return new Promise<T>((resolve, reject) => esriPromise.then(resolve, reject));
  }

  public static esriCallbackToEs6<T>(esriPromiseReturner: (callback?: Function, errback?: Function) => IPromise<any>) : Promise<T> {
    return new Promise<T>((resolve, reject) => esriPromiseReturner(resolve, reject));
  }
}
