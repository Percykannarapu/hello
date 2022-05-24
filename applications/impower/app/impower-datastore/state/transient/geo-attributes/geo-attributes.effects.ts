import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { selectors } from '@val/esri';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { FullAppState } from '../../../../state/app.interfaces';
import { FeatureLoaderService } from '../../../services/feature-loader.service';
import {
  GeoAttributeActions,
  GeoAttributeActionTypes,
  GetLayerAttributes,
  GetLayerAttributesComplete,
  GetLayerAttributesFailure
} from './geo-attributes.actions';

const boundaryAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

@Injectable({ providedIn: 'root' })
export class GeoAttributesEffects {

  @Effect()
  requestAttributes$ = this.actions$.pipe(
    ofType<GetLayerAttributes>(GeoAttributeActionTypes.GetLayerAttributes),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriSelectedLayer))),
    switchMap(([action, layerUrl]) => this.featureLoaderService.loadAttributesFromFeatures(layerUrl, action.payload.geoLocations, boundaryAttributes).pipe(
      map(results => new GetLayerAttributesComplete({ geoAttributes: results })),
      catchError(err => of(new GetLayerAttributesFailure({ err })))
    ))
  );

  @Effect()
  excessiveAttributeBusy$ = this.actions$.pipe(
    ofType<GetLayerAttributes>(GeoAttributeActionTypes.GetLayerAttributes),
    map(action => action.payload.geoLocations.length),
    filter(size => size > 2000),
    map(size => new StartBusyIndicator({ key: this.busyKey, message: `Retrieving HH Counts for ${size.toLocaleString()} geos`}))
  );

  @Effect()
  excessiveAttributeStop$ = this.actions$.pipe(
    ofType(GeoAttributeActionTypes.GetLayerAttributesComplete, GeoAttributeActionTypes.GetLayerAttributesFailure),
    map(() => new StopBusyIndicator({ key: this.busyKey }))
  );

  private busyKey = 'GeoAttributesBusyIndicator';

  constructor(private actions$: Actions<GeoAttributeActions>,
              private store$: Store<FullAppState>,
              private featureLoaderService: FeatureLoaderService) { }
}
