import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { TypedAction } from '@ngrx/store/src/models';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import { clearTransientDataActionType } from '../transient.actions';
import { MapVarActions, MapVarActionTypes } from './map-vars.actions';

export interface State extends EntityState<DynamicVariable> {}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState();

export function reducer(state = initialState, action: MapVarActions | TypedAction<typeof clearTransientDataActionType>) : State {
  switch (action.type) {
    case MapVarActionTypes.FetchMapVarsComplete: {
      const mergedEntities = mergeVariables(state.entities, action.payload.mapVars);
      if (isEmpty(mergedEntities)) {
        return state;
      } else {
        return adapter.upsertMany(mergedEntities, state);
      }
    }

    case clearTransientDataActionType:
    case MapVarActionTypes.FetchMapVarsFailed:
    case MapVarActionTypes.ClearMapVars: {
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
