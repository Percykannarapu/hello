import { createAction, props } from '@ngrx/store';

export enum GeoTransactionType {
  Geofootprint,
  Map
}

export const CacheGeos = createAction(
  '[Transient] Cache Geos',
  (geos: Set<string>, geoType: GeoTransactionType, showSpinner: boolean = false ) => ({ geos, geoType, showSpinner })
);

export const CacheGeosComplete = createAction(
  '[Transient] Cache Geos Complete',
  props<{ transactionId: number, geoType: GeoTransactionType }>()
);

export const CacheGeosFailure = createAction(
  '[Transient] Cache Geos Failure',
  props<{ err: any, geoType: GeoTransactionType }>()
);

export const RemoveGeoCache = createAction(
  '[Transient] Remove Geo Cache',
  props<{ geoType: GeoTransactionType }>()
);

export const RemoveGeoCacheComplete = createAction(
  '[Transient] Remove Geo Cache Complete',
  props<{ geoType: GeoTransactionType }>()
);

export const RemoveGeoCacheFailure = createAction(
  '[Transient] Remove Geo Cache Failure',
  props<{ err: any, geoType: GeoTransactionType }>()
);
