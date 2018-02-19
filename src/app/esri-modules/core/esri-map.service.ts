import {ElementRef, Injectable} from '@angular/core';
import {EsriModules} from './esri-modules.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class EsriMapService {
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private baseMap: BehaviorSubject<__esri.Basemap> = new BehaviorSubject<__esri.Basemap>(null);

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
    EsriModules.watchUtils.watch(this.map, 'basemap', () => {
      this.baseMap.next(this.map.basemap);
    });
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

  public onBaseMapChange() : Observable<__esri.Basemap> {
    return this.baseMap.asObservable();
  }

  public onReady(initializer: () => void) : void {
    this.isReady.subscribe(ready => {
      if (ready) {
        initializer();
      }
    });
  }
}
