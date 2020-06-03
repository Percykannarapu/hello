import { ElementRef, Inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { calculateStatistics, expandRange, Statistics, UniversalCoordinates } from '@val/common';
import Basemap from 'esri/Basemap';
import { Point, Polygon } from 'esri/geometry';
import Circle from 'esri/geometry/Circle';
import Graphic from 'esri/Graphic';
import EsriMap from 'esri/Map';
import MapView from 'esri/views/MapView';
import Expand from 'esri/widgets/Expand';
import { BehaviorSubject, combineLatest, from, Observable, of, throwError } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, tap } from 'rxjs/operators';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { EsriUtils, WatchResult } from '../core/esri-utils';
import { AppState } from '../state/esri.reducers';
import { selectors } from '../state/esri.selectors';
import { EsriDomainFactoryService } from './esri-domain-factory.service';
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

  public mapIsStationary$: Observable<boolean> = new BehaviorSubject<boolean>(false);
  public viewsCanBeQueried$: Observable<boolean> = new BehaviorSubject<boolean>(false);

  public mapView: __esri.MapView;
  public widgetMap: Map<string, __esri.Widget> = new Map<string, __esri.Widget>();

  constructor(private domainService: EsriDomainFactoryService,
              private logger: LoggingService,
              private store$: Store<AppState>,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettings) {}

  initializeMap(container: ElementRef, baseMapId: string) : Observable<void> {
    try {
      const newMapParams = Object.assign({}, this.config.defaultMapParams);
      newMapParams.basemap = Basemap.fromId(baseMapId);
      const mapInstance = new EsriMap(newMapParams);
      const newMapViewProps = Object.assign({}, this.config.defaultViewParams);
      newMapViewProps.container = container.nativeElement;
      newMapViewProps.map = mapInstance;
      newMapViewProps.resizeAlign = 'top-left';
      // newMapViewProps.navigation = {
      //   mouseWheelZoomEnabled: false
      // };
      const mapView = new MapView(newMapViewProps);
      return from(mapView.when()).pipe(
        tap(() => {
          this.mapView = mapView;
          this.setupMapSubscriptions();
        })
      );
    } catch (e) {
      this.logger.error.log('Map Initialization encountered an error', e);
      return throwError(e);
    }
  }

  private setupMapSubscriptions() : void {
    this.watchMapViewProperty('stationary').pipe(
      debounceTime(500),
      map(result => result.newValue)
    ).subscribe(this.mapIsStationary$ as BehaviorSubject<boolean>);

    const selectedLayerIsReady$ = this.store$.select(selectors.getEsriSelectedLayer).pipe(distinctUntilChanged());
    combineLatest([this.mapIsStationary$, selectedLayerIsReady$]).pipe(
      map(([ready, layerId]) => ready && (layerId != null))
    ).subscribe(this.viewsCanBeQueried$ as BehaviorSubject<boolean>);
  }

  zoomToPolys(polys: __esri.Graphic[], bufferPercent: number = 0.1) : Observable<void> {
    const xData = polys.reduce((p, c) => {
      if (EsriUtils.geometryIsPolygon(c.geometry)) {
        p.push(c.geometry.extent.xmax, c.geometry.extent.xmin);
      }
      return p;
    }, [] as number[]);
    const yData = polys.reduce((p, c) => {
      if (EsriUtils.geometryIsPolygon(c.geometry)) {
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
        const polyExtent = this.domainService.createExtent(xStats, yStats);
        target = Polygon.fromExtent(polyExtent);
      }
      return from(this.mapView.goTo(target, options));
    }
  }

  public zoomOut(){
    this.mapView.zoom =  this.mapView.zoom - 2 ;
  }

  clearGraphics() : void {
    this.mapView.graphics.removeAll();
  }

  watchMapViewProperty<T extends keyof __esri.MapView>(propertyName: T) : Observable<WatchResult<__esri.MapView, T>> {
    return EsriUtils.setupWatch(this.mapView, propertyName);
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
    // this.mapView.navigation.mouseWheelZoomEnabled = value;
  }
}
