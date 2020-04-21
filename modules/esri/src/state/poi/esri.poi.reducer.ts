import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { PoiConfiguration } from '../../models/poi-configuration';
import * as PoiActions from './esri.poi.actions';

export interface EsriPoiState extends EntityState<PoiConfiguration> {
  // additional entities state properties
}

export const adapter: EntityAdapter<PoiConfiguration> = createEntityAdapter<PoiConfiguration>();

export const initialState: EsriPoiState = adapter.getInitialState({
  // additional entity state properties
});

export const poiReducer = createReducer(
  initialState,
  on(PoiActions.addPoi,
    (state, action) => adapter.addOne(action.poi, state)
  ),
  on(PoiActions.upsertPoi,
    (state, action) => adapter.upsertOne(action.poi, state)
  ),
  on(PoiActions.addPois,
    (state, action) => adapter.addMany(action.pois, state)
  ),
  on(PoiActions.upsertPois,
    (state, action) => adapter.upsertMany(action.pois, state)
  ),
  on(PoiActions.updatePoi,
    (state, action) => adapter.updateOne(action.poi, state)
  ),
  on(PoiActions.updatePois,
    (state, action) => adapter.updateMany(action.pois, state)
  ),
  on(PoiActions.deletePoi,
    (state, action) => adapter.removeOne(action.id, state)
  ),
  on(PoiActions.deletePois,
    (state, action) => adapter.removeMany(action.ids, state)
  ),
  on(PoiActions.loadPois,
    (state, action) => adapter.addAll(action.pois, state)
  ),
  on(PoiActions.clearPois,
    state => adapter.removeAll(state)
  ),
);

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
