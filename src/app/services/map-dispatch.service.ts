import { Injectable } from '@angular/core';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { Observable } from 'rxjs/Observable';
import { filter, map, take } from 'rxjs/operators';

@Injectable()
export class MapDispatchService {

  public onMapReady: Promise<any>;

  constructor(private mapService: EsriMapService) {
    this.init();
  }

  private init() : void {
    console.log('Dispatch Service Init called');
    this.onMapReady = this.mapService.onReady$.pipe(
      filter(result => result),
      take(1)
    ).toPromise();
  }

  public getMapView() : __esri.MapView {
    return this.mapService.mapView;
  }

  public onBaseMapChange() : Observable<__esri.Basemap> {
    console.log('OnBaseMapChange subscribed');
    return this.mapService.createMapFieldHandler<__esri.Basemap>('basemap');
  }

  public onMapViewClick() : Observable<__esri.Point> {
    console.log('onMapViewClick subscribed');
    return this.mapService.createMapViewEventHandler<__esri.MapViewClickEvent>('click').pipe(
      map(evt => evt.mapPoint)
    );
  }

  public afterMapViewUpdate() : Observable<boolean> {
    console.log('afterMapViewUpdate subscribed');
    return this.mapService.createMapViewFieldHandler<boolean>('updating').pipe(
      filter(result => !result)
    );
  }
}
