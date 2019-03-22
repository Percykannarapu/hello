import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { mapArray } from '@val/common';
import { selectors } from '@val/esri';
import { of } from 'rxjs';
import { catchError, concatMap, map, switchMap, withLatestFrom } from 'rxjs/operators';
import { AppDataShimService } from '../../../services/app-data-shim.service';
import { FullAppState } from '../../../state/app.interfaces';
import { FiltersChanged } from '../../../state/data-shim/data-shim.actions';
import { FeatureLoaderService } from '../../services/feature-loader.service';
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

@Injectable({
  providedIn: 'root'
})
export class GeoAttributesEffects {

  @Effect()
  requestAttributes$ = this.actions$.pipe(
    ofType<RequestAttributes>(GeoAttributeActionTypes.RequestAttributes),
    map(action => action.payload.geocodes),
    withLatestFrom(this.store$.pipe(select(selectors.getEsriSelectedLayer))),
    switchMap(([newGeos, layerId]) => this.featureLoaderService.loadAttributesFromFeatures(layerId, newGeos, boundaryAttributes).pipe(
      concatMap(results => [new UpsertGeoAttributes({ geoAttributes: results }),
                                   new RequestAttributesComplete()]),
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

  constructor(private actions$: Actions<GeoAttributeActions>,
              private store$: Store<FullAppState>,
              private featureLoaderService: FeatureLoaderService) { }
}
