import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { selectors } from '@val/esri';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { of } from 'rxjs';
import { catchError, concatMap, filter, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { FullAppState } from '../../../../state/app.interfaces';
import { FeatureLoaderService } from '../../../services/feature-loader.service';
import {
  GeoAttributeActions,
  GeoAttributeActionTypes,
  RehydrateAttributes,
  RehydrateAttributesComplete,
  RehydrateAttributesFailure,
  RequestAttributeFailure,
  RequestAttributes,
  RequestAttributesComplete,
  UpsertGeoAttributes
} from './geo-attributes.actions';

const boundaryAttributes = ['cl2i00', 'cl0c00', 'cl2prh', 'tap049', 'hhld_w', 'hhld_s', 'num_ip_addrs', 'geocode', 'pob', 'owner_group_primary', 'cov_frequency', 'dma_name', 'cov_desc', 'city_name'];

@Injectable()
export class GeoAttributesEffects {

  @Effect()
  requestAttributes$ = this.actions$.pipe(
    ofType<RequestAttributes>(GeoAttributeActionTypes.RequestAttributes),
    // map(action => action.payload.geocodes),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriSelectedLayer))),
    switchMap(([action, layerId]) => this.featureLoaderService.loadAttributesFromFeatures(layerId, action.payload.geocodes, boundaryAttributes).pipe(
      concatMap(results => [new UpsertGeoAttributes({ geoAttributes: results }),
                                   new RequestAttributesComplete({ flag: action.payload.flag })]),
      catchError(err => of(new RequestAttributeFailure({ err })))
    ))
  );

  @Effect()
  rehydrateAttributes$ = this.actions$.pipe(
    ofType<RehydrateAttributes>(GeoAttributeActionTypes.RehydrateAttributes),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriSelectedLayer))),
    switchMap(([action, layerId]) => this.featureLoaderService.loadAttributesFromFeatures(layerId, action.payload.geocodes, boundaryAttributes).pipe(
      concatMap(results => [new UpsertGeoAttributes({ geoAttributes: results }),
                                   new RehydrateAttributesComplete({ projectId: action.payload.projectId, isReload: action.payload.isReload })]),
      catchError(err => of(new RehydrateAttributesFailure({ err })))
    ))
  );

  @Effect()
  excessiveAttributeBusy$ = this.actions$.pipe(
    ofType<RequestAttributes | RehydrateAttributes>(GeoAttributeActionTypes.RequestAttributes, GeoAttributeActionTypes.RehydrateAttributes),
    map(action => action.payload.geocodes.size),
    filter(size => size > 2000),
    map(size => new StartBusyIndicator({ key: this.busyKey, message: `Retrieving Household Counts for ${size} geos`}))
  );

  @Effect()
  excessiveAttributeStop$ = this.actions$.pipe(
    ofType(GeoAttributeActionTypes.RequestAttributesComplete, GeoAttributeActionTypes.RequestAttributesFailure,
           GeoAttributeActionTypes.RehydrateAttributesComplete, GeoAttributeActionTypes.RehydrateAttributesFailure),
    map(() => new StopBusyIndicator({ key: this.busyKey }))
  );

  private busyKey = 'GeoAttributesBusyIndicator';

  constructor(private actions$: Actions<GeoAttributeActions>,
              private store$: Store<FullAppState>,
              private featureLoaderService: FeatureLoaderService) { }
}
