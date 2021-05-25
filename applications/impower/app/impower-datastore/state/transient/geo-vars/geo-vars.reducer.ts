import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { TypedAction } from '@ngrx/store/src/models';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import { clearTransientDataActionType } from '../transient.actions';
import { GeoVarActions, GeoVarActionTypes } from './geo-vars.actions';

export interface State extends EntityState<DynamicVariable> {}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: GeoVarActions | TypedAction<typeof clearTransientDataActionType>) : State {
  switch (action.type) {
    case GeoVarActionTypes.FetchGeoVarsComplete: {
      const mergedEntities = mergeVariables(state.entities, action.payload.geoVars);
      if (isEmpty(mergedEntities)) {
        return state;
      } else {
        return adapter.upsertMany(mergedEntities, state);
      }
    }

    case clearTransientDataActionType:
    case GeoVarActionTypes.FetchGeoVarsFailed:
    case GeoVarActionTypes.ClearGeoVars: {
      return adapter.removeAll(state);
    }

    default: {
      return state;
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
