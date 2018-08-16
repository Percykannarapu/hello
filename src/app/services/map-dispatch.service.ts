import { Injectable } from '@angular/core';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { Observable } from 'rxjs';
import { filter, map, take, mergeMap, share, tap } from 'rxjs/operators';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';

@Injectable()
export class MapDispatchService {

  constructor(private mapService: EsriMapService,
               private queryService: EsriQueryService) {}

  public getMapView() : __esri.MapView {
    return this.mapService.mapView;
  }

  public onBaseMapChange() : Observable<__esri.Basemap> {
    console.log('OnBaseMapChange subscribed');
    return this.mapService.createMapFieldHandler<__esri.Basemap>('basemap');
  }

  public onMapViewClick() : Observable<__esri.MapViewClickEvent> {
    console.log('onMapViewClick subscribed');
    return this.mapService.createMapViewEventHandler<__esri.MapViewClickEvent>('click');
  }

  public afterMapViewUpdate() : Observable<__esri.MapView> {
    console.log('afterMapViewUpdate subscribed');
    return this.mapService.createMapViewFieldHandler<boolean>('updating').pipe(
      filter(result => !result),
      map(() => this.mapService.mapView)
    );
  }

  public featuresInViewExtent(layerId: string, oneTime: boolean = false, includeGeometry: boolean = false) : Observable<__esri.Graphic[]> {
    console.log(`featuresInViewExtent subscribed with layerId "${layerId}"`);
    if (!oneTime) {
      return this.afterMapViewUpdate().pipe(
        mergeMap(mapView => this.queryService.queryLayerView(layerId, includeGeometry, mapView.extent))
      );
    } else {
      return this.queryService.queryLayerView(layerId, includeGeometry, this.mapService.mapView.extent);
    }
  }

  public geocodesInViewExtent(layerId: string, oneTime: boolean = false) : Observable<string[]> {
    return this.featuresInViewExtent(layerId, oneTime).pipe(
      tap(features => console.log('features in view extent', features)),
      map(features => features.map(feature => feature.attributes.geocode))
    );
  }
}
