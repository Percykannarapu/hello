import { ElementRef, Inject, Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { EsriApi } from '../core/esri-api.service';
import { EsriUtils, WatchResult } from '../core/esri-utils';
import { EsriDomainFactoryService } from './esri-domain-factory.service';

@Injectable()
export class EsriMapService {
  public mapView: __esri.MapView;
  public widgetMap: Map<string, __esri.Widget> = new Map<string, __esri.Widget>();
  public measureWidget: any = null;

  constructor(private domainService: EsriDomainFactoryService,
              private zone: NgZone,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettings) {}

  initializeMap(container: ElementRef, baseMapId: string) : Observable<void> {
    return new Observable<any>(sub => {
      const newMapParams = Object.assign({}, this.config.defaultMapParams);
      newMapParams.basemap = EsriApi.BaseMap.fromId(baseMapId);
      const map = new EsriApi.Map(newMapParams);
      const newMapViewProps = Object.assign({}, this.config.defaultViewParams);
      newMapViewProps.container = container.nativeElement;
      newMapViewProps.map = map;
      const mapView = new EsriApi.MapView(newMapViewProps);
      mapView.when(() => {
        this.mapView = mapView;
        sub.next();
      }, err => sub.error(err));
    });
  }

  zoomOnMap(xStats: { min: number, max: number }, yStats: { min: number, max: number }, pointCount: number) : Observable<void> {
    return new Observable<void>(subscriber => {
      this.zone.runOutsideAngular(() => {
        if (pointCount === 0) {
          this.zone.run(() => {
            subscriber.next();
            subscriber.complete();
          });
        } else {
          const options = { animate: false };
          let target: __esri.Polygon | __esri.MapViewBaseGoToTarget;
          if (pointCount === 1) {
            target = {
              target: new EsriApi.Point({ x: xStats.min, y: yStats.min }),
              zoom: 11
            };
          } else {
            const polyExtent = this.domainService.createExtent(xStats, yStats);
            target = EsriApi.Polygon.fromExtent(polyExtent);
          }
          const result = EsriUtils.esriPromiseToEs6(this.mapView.goTo(target, options));
          this.zone.run(() => {
            result.catch(() => subscriber.error()).then(() => {
              subscriber.next();
              subscriber.complete();
            });
          });
        }
      });
    });
  }

  clearGraphics() : void {
    this.mapView.graphics.removeAll();
  }

  setWidget(type) {
    switch (type) {
      case 'measure':
        this.measureWidget = new EsriApi.widgets.DistanceMeasurement2D({
          view: this.mapView,
          unit: 'miles'
        });
        this.measureWidget.viewModel.mode = 'geodesic';
        this.measureWidget.view.surface.style.cursor = 'crosshair';
        this.measureWidget.viewModel.newMeasurement();
        break;
      case 'select':
        if (!this.measureWidget) {
          this.measureWidget = new EsriApi.widgets.DistanceMeasurement2D({
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
          this.measureWidget = new EsriApi.widgets.DistanceMeasurement2D({
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
          this.measureWidget = new EsriApi.widgets.DistanceMeasurement2D({
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
    const expander = new EsriApi.widgets.Expand(newExpanderProps);
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
}
