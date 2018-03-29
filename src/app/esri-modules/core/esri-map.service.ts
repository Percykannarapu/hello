import { ElementRef, Injectable } from '@angular/core';
import { EsriModules } from './esri-modules.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { publish, publishReplay, refCount } from 'rxjs/operators';
import { Coordinates } from '../layers/esri-query.service';
import { AppConfig } from '../../app.config';

@Injectable()
export class EsriMapService {
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public onReady$: Observable<boolean> = this.isReady.asObservable();
  public onBaseMapChange$: Observable<__esri.Basemap>;
  public onClick$: Observable<__esri.MapViewClickEvent>;
  public map: __esri.Map;
  public mapView: __esri.MapView;

  constructor(private modules: EsriModules, private config: AppConfig) {}

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
    console.log('Creating map view with props:: ', newMapViewProps);
    this.mapView = new EsriModules.MapView(newMapViewProps);
    this.onBaseMapChange$ = this.createBaseMapChangeHandler();
    this.onClick$ = this.createClickHandler();
    this.isReady.next(true);
  }

  public addWidget(item: __esri.Widget, position: string);
  public addWidget(item: ElementRef | __esri.Widget, position: string) {
    if (item instanceof ElementRef) {
      this.mapView.ui.add(item.nativeElement, position);
    } else {
      this.mapView.ui.add(item, position);
    }
  }

  private createBaseMapChangeHandler() : Observable<__esri.Basemap> {
    return Observable.create(observer => {
      const esriHandle = this.map.watch('basemap', m => observer.next(m));
      return () => esriHandle.remove();
    }).pipe(publishReplay(1), refCount());
  }

  private createClickHandler() : Observable<__esri.MapViewClickEvent> {
    return Observable.create(observer => {
      const esriHandle = this.mapView.on('click', e => observer.next(e));
      return () => esriHandle.remove();
    }).pipe(publish(), refCount());
  }

  public zoomOnMap(coordinates: Coordinates[]){

    const pList: __esri.Point[] = [];
    const latList: number[] = [];
    const lonList: number[] = [];
    const graphicList1: __esri.Graphic[] = [];

    coordinates.forEach(function (current: Coordinates) {
      lonList.push(current.xcoord);   /// this is X
      latList.push(current.ycoord);   /// this is y
    });

    const minX = Math.min(...lonList);
    const minY = Math.min(...latList);
    const maxX = Math.max(...lonList);
    const maxY = Math.max(...latList);

    console.log('minX::' + minX + '::minY::' + minY + '::maxX::' + maxX + '::maxY::' + maxY);
    let extent: __esri.Extent;
    //new EsriModules
    extent = new EsriModules.Extent({
      xmin: minX,
      ymin: minY,
      xmax: maxX,
      ymax: maxY,
      spatialReference: {
          wkid: this.config.val_spatialReference
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

    if (coordinates.length === 1) {
      this.mapView.zoom = 12;
    }
  }
}
