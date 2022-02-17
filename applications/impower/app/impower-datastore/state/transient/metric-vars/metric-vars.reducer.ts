import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import * as fromTransientActions from '../transient.actions';
import { MetricVarActions, MetricVarActionTypes } from './metric-vars.action';

export interface State extends EntityState<DynamicVariable> {}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState();

const transientReducer = createReducer(initialState,
  on(fromTransientActions.clearTransientData, state => adapter.removeAll(state))
);

export function reducer(state = initialState, action: MetricVarActions) : State {
  switch (action.type) {
    case MetricVarActionTypes.FetchMetricVarsComplete: {
        return adapter.upsertMany(action.payload.metricVars, state);
    }

    case MetricVarActionTypes.FetchMetricVarsFailed:
    case MetricVarActionTypes.ClearMetricVars: {
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
