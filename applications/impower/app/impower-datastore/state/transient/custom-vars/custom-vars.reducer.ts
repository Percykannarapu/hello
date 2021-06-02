import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { isEmpty } from '@val/common';
import { DynamicVariable, mergeVariables } from '../dynamic-variable.model';
import * as fromTransientActions from '../transient.actions';
import * as CustomVarActions from './custom-vars.actions';

export interface State extends EntityState<DynamicVariable> {
  // additional entities state properties
}

export const adapter: EntityAdapter<DynamicVariable> = createEntityAdapter<DynamicVariable>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export const reducer = createReducer(
  initialState,
  on(CustomVarActions.mergeCustomVars,
    (state, action) => {
      const mergedEntities = mergeVariables(state.entities, action.customVars);
      if (isEmpty(mergedEntities)) {
        return state;
      } else {
        return adapter.upsertMany(mergedEntities, state);
      }
    }
  ),
  on(CustomVarActions.loadCustomVars,
    (state, action) => adapter.setAll(action.customVars, state)
  ),
  on(CustomVarActions.clearCustomVars,
    state => adapter.removeAll(state)
  ),
  on(fromTransientActions.clearTransientData, (state, action) => {
    if (action.fullEntityWipe) adapter.removeAll(state);
    return state;
  })
);

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
