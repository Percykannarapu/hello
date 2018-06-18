import { ElementRef, Inject, Injectable } from '@angular/core';
import { EsriModules } from './esri-modules.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { publishLast, refCount, share } from 'rxjs/operators';
import { EsriLoaderConfig, EsriLoaderToken } from '../configuration';

@Injectable()
export class EsriMapService {
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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

  public addWidget(item: __esri.Widget, position: string);
  public addWidget(item: ElementRef | __esri.Widget, position: string) {
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
}
