import { ElementRef, Injectable } from '@angular/core';
import { EsriModules } from './esri-modules.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { publish, publishReplay, refCount } from 'rxjs/operators';

@Injectable()
export class EsriMapService {
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public onReady$: Observable<boolean> = this.isReady.asObservable();
  public onBaseMapChange$: Observable<__esri.Basemap>;
  public onClick$: Observable<__esri.MapViewClickEvent>;
  public map: __esri.Map;
  public mapView: __esri.MapView;

  constructor(private modules: EsriModules) {}

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
}
