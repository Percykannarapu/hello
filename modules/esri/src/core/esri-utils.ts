import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Polyline from '@arcgis/core/geometry/Polyline';
import { isValidNumber, toUniversalCoordinates } from '@val/common';
import { Observable } from 'rxjs';
import {
  MapViewBlurEvent,
  MapViewClickEvent,
  MapViewDoubleClickEvent,
  MapViewDragEvent,
  MapViewFocusEvent,
  MapViewHoldEvent,
  MapViewImmediateClickEvent,
  MapViewImmediateDoubleClickEvent,
  MapViewKeyDownEvent,
  MapViewKeyUpEvent,
  MapViewLayerViewCreateErrorEvent,
  MapViewLayerViewCreateEvent,
  MapViewLayerViewDestroyEvent,
  MapViewMouseWheelEvent,
  MapViewPointerDownEvent,
  MapViewPointerEnterEvent,
  MapViewPointerLeaveEvent,
  MapViewPointerMoveEvent,
  MapViewPointerUpEvent,
  MapViewResizeEvent
} from './esri-event-shims';

export interface TokenResponse {
  token: string;
  expires: number;
  ssl: boolean;
  server: string;
}

export interface WatchResult<T extends __esri.Accessor, K extends keyof T> {
  newValue: T[K];
  oldValue: T[K];
  propName: K;
  target: T;
}

type mapViewEventNames = 'blur' |
  'click' |
  'double-click' |
  'drag' |
  'focus' |
  'hold' |
  'immediate-click' |
  'immediate-double-click' |
  'key-down' |
  'key-up' |
  'layerview-create' |
  'layerview-create-error' |
  'layerview-destroy' |
  'mouse-wheel' |
  'pointer-down' |
  'pointer-enter' |
  'pointer-leave' |
  'pointer-move' |
  'pointer-up' |
  'resize';

type mapViewEventResults =
  MapViewResizeEvent | MapViewLayerViewCreateEvent | MapViewLayerViewDestroyEvent | MapViewClickEvent |
  MapViewDoubleClickEvent | MapViewImmediateClickEvent | MapViewHoldEvent | MapViewDragEvent |
  MapViewMouseWheelEvent | MapViewKeyDownEvent | MapViewKeyUpEvent | MapViewPointerDownEvent |
  MapViewPointerMoveEvent | MapViewPointerUpEvent | MapViewPointerEnterEvent | MapViewPointerLeaveEvent |
  MapViewFocusEvent | MapViewBlurEvent | MapViewImmediateDoubleClickEvent | MapViewLayerViewCreateErrorEvent;

interface PointLike {
  x: number;
  y: number;
}

type NonArray<T> = T extends (infer R)[] ? R : T;

export class EsriUtils {

  public static getClosestItem<T extends NonArray<Parameters<typeof toUniversalCoordinates>[0]>, U extends NonArray<Parameters<typeof toUniversalCoordinates>[0]>>(a: T, b: U[]) : U {
    const rootPoint = toUniversalCoordinates(a);
    let closestItem = b[0];
    b.forEach(i => {
      const currentPoint = toUniversalCoordinates(i);
      const currentClosestPoint = toUniversalCoordinates(closestItem);
      if (this.getDistance(rootPoint, currentPoint) < this.getDistance(rootPoint, currentClosestPoint)) closestItem = i;
    });
    return closestItem;
  }

  public static getDistance(a: PointLike, b: PointLike) : number;
  public static getDistance(a: PointLike, x: number, y: number) : number;
  public static getDistance(x1: number, y1: number, x2: number, y2: number) : number;
  public static getDistance(param1: PointLike | number, param2: PointLike | number, param3?: number, param4?: number) : number {
    let xA: number;
    let yA: number;
    let xB: number;
    let yB: number;
    if (isValidNumber(param1)) {
      // was called via (x1, y1, x2, y2)
      xA = param1;
      yA = param2 as number;
      xB = param3;
      yB = param4;
    } else {
      xA = param1.x;
      yA = param1.y;
      if (isValidNumber(param2)) {
        // was called via (a, x, y)
        xB = param2;
        yB = param3;
      } else {
        // was called via (a, b)
        xB = param2.x;
        yB = param2.y;
      }
    }
    const line = new Polyline({ paths: [[[xA, yA], [xB, yB]]] });
    return geometryEngine.geodesicLength(line, 'miles');
  }

  public static setupWatch<T extends __esri.Accessor, K extends keyof T>(instance: T, prop: K, startWithInitialValue: boolean = false) : Observable<WatchResult<T, K>> {
    return new Observable<WatchResult<T, K>>(observer => {
      let handle;
      try {
        if (startWithInitialValue) {
          observer.next({ newValue: instance[prop], oldValue: undefined, propName: prop, target: instance });
        }
        handle = instance.watch(prop as string, (newValue, oldValue, propName: any, target: T) => {
          observer.next({newValue, oldValue, propName, target});
        });
      } catch (err) {
        observer.error(err);
      }
      return () => {
        if (handle) handle.remove();
      };
    });
  }

  public static handleMapViewEvent(mapView: __esri.MapView, event: 'blur') : Observable<MapViewBlurEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'click') : Observable<MapViewClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'double-click') : Observable<MapViewDoubleClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'drag') : Observable<MapViewDragEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'focus') : Observable<MapViewFocusEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'hold') : Observable<MapViewHoldEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'immediate-click') : Observable<MapViewImmediateClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'immediate-double-click') : Observable<MapViewImmediateDoubleClickEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'key-down') : Observable<MapViewKeyDownEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'key-up') : Observable<MapViewKeyUpEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'layerview-create') : Observable<MapViewLayerViewCreateEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'layerview-create-error') : Observable<MapViewLayerViewCreateErrorEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'layerview-destroy') : Observable<MapViewLayerViewDestroyEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'mouse-wheel') : Observable<MapViewMouseWheelEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-down') : Observable<MapViewPointerDownEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-enter') : Observable<MapViewPointerEnterEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-leave') : Observable<MapViewPointerLeaveEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-move') : Observable<MapViewPointerMoveEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'pointer-up') : Observable<MapViewPointerUpEvent>;
  public static handleMapViewEvent(mapView: __esri.MapView, event: 'resize') : Observable<MapViewResizeEvent>;
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
}
