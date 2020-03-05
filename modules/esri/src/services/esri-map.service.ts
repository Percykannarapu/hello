import { ElementRef, Inject, Injectable, NgZone } from '@angular/core';
import { calculateStatistics, expandRange, Statistics, UniversalCoordinates } from '@val/common';
import Basemap from 'esri/Basemap';
import { Point, Polygon } from 'esri/geometry';
import EsriMap from 'esri/Map';
import MapView from 'esri/views/MapView';
import Circle from 'esri/geometry/Circle';
import Graphic from 'esri/Graphic';
import DistanceMeasurement2D from 'esri/widgets/DistanceMeasurement2D';
import Expand from 'esri/widgets/Expand';
import { Observable } from 'rxjs';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { EsriUtils, WatchResult } from '../core/esri-utils';
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
  public mapView: __esri.MapView;
  public widgetMap: Map<string, __esri.Widget> = new Map<string, __esri.Widget>();
  public measureWidget: any = null;

  constructor(private domainService: EsriDomainFactoryService,
              private logger: LoggingService,
              private zone: NgZone,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettings) {}

  initializeMap(container: ElementRef, baseMapId: string) : Observable<void> {
    return new Observable<any>(sub => {
      try {
        const newMapParams = Object.assign({}, this.config.defaultMapParams);
        newMapParams.basemap = Basemap.fromId(baseMapId);
        const map = new EsriMap(newMapParams);
        const newMapViewProps = Object.assign({}, this.config.defaultViewParams);
        newMapViewProps.container = container.nativeElement;
        newMapViewProps.map = map;
        const mapView = new MapView(newMapViewProps);
        mapView.when(() => {
          this.mapView = mapView;
          sub.next();
          sub.complete();
        }, err => sub.error(err));
      } catch (e) {
        this.logger.error.log('Map Initialization encountered an error', e);
        sub.error(e);
      }
    });
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
    return new Observable<void>(subscriber => {
      if (pointCount === 0 || xStats == null || yStats == null) {
        subscriber.next();
        subscriber.complete();
      } else {
        const options = { animate: false };
        let target: __esri.Polygon | __esri.MapViewBaseGoToTarget;
        if (pointCount === 1) {
          target = {
            target: new Point({ x: xStats.min, y: yStats.min }),
            zoom: 11
          };
        } else {
          const polyExtent = this.domainService.createExtent(xStats, yStats);
          target = Polygon.fromExtent(polyExtent);
        }
        EsriUtils.esriPromiseToEs6(this.mapView.goTo(target, options))
          .catch(err => subscriber.error(err))
          .then(() => {
            subscriber.next();
            subscriber.complete();
          });
      }
    });
  }

  public zoomOut(){
    this.mapView.zoom =  this.mapView.zoom - 2 ;
  }

  clearGraphics() : void {
    this.mapView.graphics.removeAll();
  }

  setWidget(type) {
    switch (type) {
      case 'measure':
        this.measureWidget = new DistanceMeasurement2D({
          view: this.mapView,
          unit: 'miles'
        });
        this.measureWidget.viewModel.mode = 'geodesic';
        this.measureWidget.view.surface.style.cursor = 'crosshair';
        this.measureWidget.viewModel.newMeasurement();
        break;
      case 'select':
        if (!this.measureWidget) {
          this.measureWidget = new DistanceMeasurement2D({
            view: this.mapView,
            unit: 'miles'
          });
        }
        this.measureWidget.viewModel.mode = 'geodesic';
        this.measureWidget.view.surface.style.cursor = 'crosshair';
        this.measureWidget.destroy();
        this.measureWidget = null;
        break;
      case 'copy':
        if (!this.measureWidget) {
          this.measureWidget = new DistanceMeasurement2D({
            view: this.mapView,
            unit: 'miles'
          });
        }
        this.measureWidget.viewModel.mode = 'geodesic';
        this.measureWidget.view.surface.style.cursor = 'copy';
        this.measureWidget.destroy();
        this.measureWidget = null;
        break;
      case 'default':
        if (!this.measureWidget) {
          this.measureWidget = new DistanceMeasurement2D({
            view: this.mapView,
            unit: 'miles'
          });
        }
        this.measureWidget.viewModel.mode = 'geodesic';
        this.measureWidget.view.surface.style.cursor = 'default';
        this.measureWidget.destroy();
        this.measureWidget = null;
        break;
      case null:
        if (this.measureWidget) {
          this.measureWidget.destroy();
          this.measureWidget = null;
        }
        break;
    }
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
}
