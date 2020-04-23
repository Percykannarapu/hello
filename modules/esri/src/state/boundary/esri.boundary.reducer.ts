import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { BoundaryConfiguration } from '../../models/boundary-configuration';
import * as BoundaryActions from './esri.boundary.actions';

export interface EsriBoundaryState extends EntityState<BoundaryConfiguration> {
  // additional entities state properties
}

function sortComparer(a: BoundaryConfiguration, b: BoundaryConfiguration) : number {
  return a.sortOrder - b.sortOrder;
}

export const adapter: EntityAdapter<BoundaryConfiguration> = createEntityAdapter<BoundaryConfiguration>({
  sortComparer
});

export const initialState: EsriBoundaryState = adapter.getInitialState({
  // additional entity state properties
});

const reducer = createReducer(
  initialState,
  on(BoundaryActions.addBoundary,
    (state, action) => adapter.addOne(action.boundary, state)
  ),
  on(BoundaryActions.upsertBoundary,
    (state, action) => adapter.upsertOne(action.boundary, state)
  ),
  on(BoundaryActions.addBoundaries,
    (state, action) => adapter.addMany(action.boundaries, state)
  ),
  on(BoundaryActions.upsertBoundaries,
    (state, action) => adapter.upsertMany(action.boundaries, state)
  ),
  on(BoundaryActions.updateBoundary,
    (state, action) => adapter.updateOne(action.boundary, state)
  ),
  on(BoundaryActions.updateBoundaries,
    (state, action) => adapter.updateMany(action.boundaries, state)
  ),
  on(BoundaryActions.deleteBoundary,
    (state, action) => adapter.removeOne(action.id, state)
  ),
  on(BoundaryActions.deleteBoundaries,
    (state, action) => adapter.removeMany(action.ids, state)
  ),
  on(BoundaryActions.loadBoundaries,
    (state, action) => adapter.addAll(action.boundaries, state)
  ),
  on(BoundaryActions.clearBoundaries,
    state => adapter.removeAll(state)
  ),
);

export function boundaryReducer(state: EsriBoundaryState | undefined, action: Action) {
  return reducer(state, action);
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
