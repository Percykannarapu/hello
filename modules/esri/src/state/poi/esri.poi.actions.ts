import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { PoiConfiguration } from '../../models/poi-configuration';

export const loadPois = createAction(
  '[Poi/API] Load Pois',
  props<{ pois: PoiConfiguration[] }>()
);

export const addPoi = createAction(
  '[Poi/API] Add Poi',
  props<{ poi: PoiConfiguration }>()
);

export const upsertPoi = createAction(
  '[Poi/API] Upsert Poi',
  props<{ poi: PoiConfiguration }>()
);

export const addPois = createAction(
  '[Poi/API] Add Pois',
  props<{ pois: PoiConfiguration[] }>()
);

export const upsertPois = createAction(
  '[Poi/API] Upsert Pois',
  props<{ pois: PoiConfiguration[] }>()
);

export const updatePoi = createAction(
  '[Poi/API] Update Poi',
  props<{ poi: Update<PoiConfiguration> }>()
);

export const updatePois = createAction(
  '[Poi/API] Update Pois',
  props<{ pois: Update<PoiConfiguration>[] }>()
);

export const deletePoi = createAction(
  '[Poi/API] Delete Poi',
  props<{ id: string }>()
);

export const deletePois = createAction(
  '[Poi/API] Delete Pois',
  props<{ ids: string[] }>()
);

export const clearPois = createAction(
  '[Poi/API] Clear Pois'
);

export const setPopupFields = createAction(
  '[Poi/API] Set Popup Fields',
  props<{ fieldNames: string[] }>()
);
