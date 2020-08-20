import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { audienceDefinitionSlice } from '../../../impower-datastore.selectors';
import { OnlineAudienceDefinition } from '../audience-definitions.model';
import * as InMarketAudienceActions from './in-market-audience.actions';

export interface State extends EntityState<OnlineAudienceDefinition> {
  definitionsFetched: boolean;
}

const adapter: EntityAdapter<OnlineAudienceDefinition> = createEntityAdapter<OnlineAudienceDefinition>({
  selectId: model => model.digCategoryId
});

const initialState: State = adapter.getInitialState({
  definitionsFetched: false,
});

const inMarketAudienceReducer = createReducer(
  initialState,
  on(InMarketAudienceActions.loadAudienceDefinitions,
    (state, action) => adapter.addAll(action.definitions, { ...state, definitionsFetched: true })
  ),
  on(InMarketAudienceActions.clearAudienceDefinitions,
     InMarketAudienceActions.fetchAudienceDefinitions,
    state => adapter.removeAll({ ...state, definitionsFetched: false })
  ),
);

export function reducer(state: State | undefined, action: Action) {
  return inMarketAudienceReducer(state, action);
}

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();

const currentSlice = createSelector(audienceDefinitionSlice, state => state.inMarket);
export const fetchComplete = createSelector(currentSlice, state => state.definitionsFetched);
export const allDefinitions = createSelector(currentSlice, selectAll);
