import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { isArray } from '@val/common';
import { audienceDefinitionSlice } from '../../../impower-datastore.selectors';
import { OfflineResponse } from '../audience-definitions.model';
import * as TdaAudienceActions from './tda-audience.actions';

export interface State extends EntityState<OfflineResponse> {
  definitionsFetched: boolean;
}

const adapter: EntityAdapter<OfflineResponse> = createEntityAdapter<OfflineResponse>();

const initialState: State = adapter.getInitialState({
  definitionsFetched: false,
});

const TdaAudienceReducer = createReducer(
  initialState,
  on(TdaAudienceActions.loadAudienceCategories,
    (state, action) => adapter.addAll(action.categories, state)
  ),
  on(TdaAudienceActions.loadAudienceDefinitions,
    (state, action) => adapter.addMany(action.definitions, { ...state, definitionsFetched: true })
  ),
  on(TdaAudienceActions.clearAudienceDefinitions,
     TdaAudienceActions.fetchAudienceDefinitions,
    state => adapter.removeAll({ ...state, definitionsFetched: false })
  ),
);

export function reducer(state: State | undefined, action: Action) {
  return TdaAudienceReducer(state, action);
}

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();

const currentSlice = createSelector(audienceDefinitionSlice, state => state.tda);
export const fetchComplete = createSelector(currentSlice, state => state.definitionsFetched);
export const allDefinitions = createSelector(currentSlice, selectAll);
export const rawDefinitionByPk = createSelector(currentSlice, (state, props) => {
  if (isArray(props.pk)) {
    return props.pk.map(id => state.entities[id]);
  } else {
    return state.entities[props.pk];
  }
});
