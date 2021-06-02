import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import * as fromTransientActions from '../transient.actions';
import { MapVarActions, MapVarActionTypes } from './map-vars.actions';

export interface State extends EntityState<DynamicVariable> {}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState();

const transientReducer = createReducer(initialState,
  on(fromTransientActions.clearTransientData, state => adapter.removeAll(state))
);

export function reducer(state = initialState, action: MapVarActions) : State {
  switch (action.type) {
    case MapVarActionTypes.FetchMapVarsComplete: {
      const mergedEntities = mergeVariables(state.entities, action.payload.mapVars);
      if (isEmpty(mergedEntities)) {
        return state;
      } else {
        return adapter.upsertMany(mergedEntities, state);
      }
    }

    case MapVarActionTypes.FetchMapVarsFailed:
    case MapVarActionTypes.ClearMapVars: {
      return adapter.removeAll(state);
    }

    default: {
      return transientReducer(state, action);
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
