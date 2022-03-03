import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import * as fromTransientActions from '../transient.actions';
import * as fromAction from './metric-vars.action';

export interface State extends EntityState<DynamicVariable> {}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState();

const transientReducer = createReducer(initialState,
  on(fromTransientActions.clearTransientData, state => adapter.removeAll(state))
);

export const reducer = createReducer(
  initialState,
    on(fromAction.FetchMetricVarsComplete,
      (state, action) => {
        return adapter.upsertMany(action.metricVars, state); }
      ),
    
    on(fromAction.ClearMetricVars,
       fromAction.FetchMetricVarsFailed,
       (state, action) => {
         return adapter.removeAll(state);
       })  
);

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
