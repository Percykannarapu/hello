import { ElementRef, Inject, Injectable } from '@angular/core';
import Basemap from '@arcgis/core/Basemap';
import Circle from '@arcgis/core/geometry/Circle';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Multipoint from '@arcgis/core/geometry/Multipoint';
import Point from '@arcgis/core/geometry/Point';
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import EsriMap from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Expand from '@arcgis/core/widgets/Expand';
import { Store } from '@ngrx/store';
import { calculateStatistics, expandRange, isNil, isNotNil, Statistics, UniversalCoordinates } from '@val/common';
import { BehaviorSubject, combineLatest, from, Observable, of, Subject, Subscription, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { EsriAppSettings, EsriAppSettingsToken, esriZoomLocalStorageKey } from '../configuration';
import { EsriDomainFactory } from '../core/esri-domain.factory';
import { EsriUtils, WatchResult } from '../core/esri-utils';
import { isPolygon } from '../core/type-checks';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import { LoggingService } from './logging.service';

function calculateExpandedStats(xData: number[], yData: number[], expansionAmount: number) : [Statistics, Statistics] {
  let xStats = calculateStatistics(xData);
  let yStats = calculateStatistics(yData);
  if (xStats != null) xStats = expandRange(xStats, xStats.distance * expansionAmount);
  if (yStats != null) yStats = expandRange(yStats, yStats.distance * expansionAmount);
  return [xStats, yStats];
}

@Injectable()
export class EsriMapService {

  public contextLost$ = new BehaviorSubject<boolean>(false);
  public mapIsStationary$: Observable<boolean> = new BehaviorSubject<boolean>(false);
  public viewsCanBeQueried$: Observable<boolean> = new BehaviorSubject<boolean>(false);

  public map: __esri.Map;
  public mapView: __esri.MapView;
  public widgetMap: Map<string, __esri.Widget> = new Map<string, __esri.Widget>();

  private primaryContainer: ElementRef;
  private detachedViewLocation: __esri.Extent;
  private mapViewSubscriptions: Subscription;

  private forceDetachError$ = new Subject<void>();

  constructor(private logger: LoggingService,
              private store$: Store<AppState>,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettings) {}

  initializeMap(container: ElementRef, baseMapId: string) : Observable<void> {
    try {
      const newMapParams = Object.assign({}, this.config.defaultMapParams);
      newMapParams.basemap = Basemap.fromId(baseMapId);
      this.map = new EsriMap(newMapParams);
      this.primaryContainer = container;
      return this.attachMap(container);
    } catch (e) {
      this.logger.error.log('Map Initialization encountered an error', e);
      return throwError(e);
    }
  }

  attachMap(container?: ElementRef) : Observable<void> {
    const newMapViewProps = Object.assign({}, this.config.defaultViewParams);
    newMapViewProps.container = (container ?? this.primaryContainer).nativeElement ;
    newMapViewProps.map = this.map;
    newMapViewProps.resizeAlign = 'top-left';
    const useShiftZoom = JSON.parse(localStorage.getItem(esriZoomLocalStorageKey)) || false;
    newMapViewProps.navigation = {
      mouseWheelZoomEnabled: !useShiftZoom
    };
    if (isNotNil(this.detachedViewLocation)) {
      newMapViewProps.center = null;
      newMapViewProps.zoom = null;
      newMapViewProps.extent = this.detachedViewLocation.clone();
      this.detachedViewLocation = null;
    }
    const mapView = new MapView(newMapViewProps);
    return from(mapView.when()).pipe(
      tap(() => {
        this.mapView = mapView;
        this.contextLost$.next(false);
        this.setupMapSubscriptions();
      })
    );
  }

  detachMap() : void {
    if (isNotNil(this.mapView)) {
      this.mapView.when().then(() => {
        this.detachedViewLocation = this.mapView.extent.clone();
        this.mapView.map = null;
        this.mapView.destroy();
      });
    }
  }

  forceDetachError() : void {
    this.forceDetachError$.next();
  }

  private setupMapSubscriptions() : void {
    let errorCount = 0;
    if (this.mapViewSubscriptions) this.mapViewSubscriptions.unsubscribe();
    this.mapViewSubscriptions = this.watchMapViewProperty('stationary').pipe(
      debounceTime(500),
      map(result => result.newValue)
    ).subscribe(this.mapIsStationary$ as BehaviorSubject<boolean>);

    const selectedLayerIsReady$ = this.store$.select(selectors.getEsriSelectedLayer).pipe(distinctUntilChanged());
    this.mapViewSubscriptions.add(
      combineLatest([this.mapIsStationary$, selectedLayerIsReady$]).pipe(
        map(([ready, layerId]) => ready && (layerId != null))
      ).subscribe(this.viewsCanBeQueried$ as BehaviorSubject<boolean>)
    );

    this.mapViewSubscriptions.add(
      this.watchMapViewProperty('fatalError').pipe(
        debounceTime(500),
        tap(error => {
          if (error) errorCount++;
        })
      ).subscribe(error => {
        if (error) {
          if (errorCount < 3) {
            this.mapView.tryFatalErrorRecovery();
          } else {
            this.contextLost$.next(true);
            this.detachMap();
          }
        }
      })
    );
    this.mapViewSubscriptions.add(
      this.forceDetachError$.subscribe(() => {
        this.contextLost$.next(true);
        this.detachMap();
      })
    );
  }

  zoomToPolys(polys: __esri.Graphic[], bufferPercent: number = 0.1) : Observable<void> {
    const xData = polys.reduce((p, c) => {
      if (isPolygon(c.geometry)) {
        p.push(c.geometry.extent.xmax, c.geometry.extent.xmin);
      }
      return p;
    }, [] as number[]);
    const yData = polys.reduce((p, c) => {
      if (isPolygon(c.geometry)) {
        p.push(c.geometry.extent.ymax, c.geometry.extent.ymin);
      }
      return p;
    }, [] as number[]);
    const [xStats, yStats] = calculateExpandedStats(xData, yData, bufferPercent);
    const polyCount = polys.length > 0 ? polys.length + 1 : 0;
    return this.zoomOnMap(xStats, yStats, polyCount);
  }

  zoomToPoints(points: UniversalCoordinates[], bufferPercent: number = 0.1) : Observable<void> {
    const xData = points.map(c => c.x);
    const yData = points.map(c => c.y);
    const [xStats, yStats] = calculateExpandedStats(xData, yData, bufferPercent);
    return this.zoomOnMap(xStats, yStats, points.length);
  }

  moveToExtent(extent: __esri.Extent) : void {
    if (isNotNil(this.mapView)) {
      this.mapView.when().then(() => this.mapView.extent = extent);
    }
  }

  setBasemap(basemap: Basemap) : void {
    this.mapView.map.basemap = basemap;
  }

  private zoomOnMap(xStats: { min: number, max: number }, yStats: { min: number, max: number }, pointCount: number) : Observable<void> {
    if (pointCount === 0 || xStats == null || yStats == null) {
      return of();
    } else {
      const options = { animate: false };
      let target: __esri.Polygon | __esri.GoToTarget2D;
      if (pointCount === 1) {
        target = {
          target: new Point({ x: xStats.min, y: yStats.min }),
          zoom: 11
        };
      } else {
        const polyExtent = EsriDomainFactory.createExtent(xStats, yStats);
        target = Polygon.fromExtent(polyExtent);
      }
      return from(this.mapView.goTo(target, options));
    }
  }

  public zoomOut() : void {
    if (isNil(this.mapView)) return;
    this.mapView.zoom =  this.mapView.zoom - 1;
  }

  public zoomIn() : void {
    if (isNil(this.mapView)) return;
    this.mapView.zoom =  this.mapView.zoom + 1;
  }

  clearGraphics() : void {
    this.mapView.graphics.removeAll();
  }

  watchMapViewProperty<T extends keyof __esri.MapView>(propertyName: T, startWithInitialValue: boolean = false) : Observable<WatchResult<__esri.MapView, T>> {
    return EsriUtils.setupWatch(this.mapView, propertyName, startWithInitialValue);
  }

  createBasicWidget(constructor: __esri.WidgetConstructor, properties?: any, position: string = 'top-left') : void {
    const newProperties = { view: this.mapView, ...properties };
    const result = new constructor(newProperties);
    this.widgetMap.set(result.declaredClass, result);
    this.addWidget(result, position);
  }

  createHiddenWidget(constructor: __esri.WidgetConstructor, widgetProperties?: any, expanderProperties?: __esri.ExpandProperties, position: string = 'top-left') : void {
    const newWidgetProps = { view: this.mapView, container: document.createElement('div'), ...widgetProperties };
    const result = new constructor(newWidgetProps);
    this.widgetMap.set(result.declaredClass, result);
    const newExpanderProps = { view: this.mapView, ...expanderProperties, content: result.container };
    const expander = new Expand(newExpanderProps);
    this.addWidget(expander, position);
  }

  getWidgetInstance<T extends __esri.Widget>(declaredClassName: string) : T {
    return this.widgetMap.get(declaredClassName) as T;
  }

  removeWidget(instance: __esri.Widget) : void {
    this.widgetMap.delete(instance.declaredClass);
    instance.destroy();
    this.mapView.ui.remove(instance);
  }

  private addWidget(item: __esri.Widget, position: string);
  private addWidget(item: ElementRef | __esri.Widget, position: string) {
    if (item instanceof ElementRef) {
      this.mapView.ui.add(item.nativeElement, position);
    } else {
      this.mapView.ui.add(item, position);
    }
  }

  public createCircleGraphic(x: number, y: number, radius: number) : Graphic {
    const point: Point = new Point();
    point.x = x;
    point.y = y;
    const circle: Circle = new Circle({
      center: point,
      geodesic: true,
      radius: radius,
      radiusUnit: 'miles'
    });
    const graphic: Graphic = new Graphic();
    graphic.geometry = circle;
    return graphic;
  }

  public clear() : void {
    this.mapView.map.layers.removeAll();
  }

  setMousewheelNavigation(value: boolean) : void {
    this.mapView.navigation.mouseWheelZoomEnabled = value;
  }

  public graphicFromPolygon(poly: Polygon) : Graphic {
    const graphic: Graphic = new Graphic;
    graphic.geometry = poly;
    return graphic;
  }

  public multipointFromPoints(points: number[][]) : Multipoint {
    return new Multipoint({points: points});
  }

  public bufferExtent(extent: __esri.Extent, distance: number) : Polygon  {
    return <Polygon>geometryEngine.geodesicBuffer(extent, distance, 'miles');
  }

}
