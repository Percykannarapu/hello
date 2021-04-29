import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { audienceDefinitionSlice } from '../../../impower-datastore.selectors';
import { OnlineAudienceDefinition } from '../audience-definitions.model';
import * as InterestAudienceActions from './interest-audience.actions';

export interface State extends EntityState<OnlineAudienceDefinition> {
  definitionsFetched: boolean;
}

const adapter: EntityAdapter<OnlineAudienceDefinition> = createEntityAdapter<OnlineAudienceDefinition>({
  selectId: model => model.digCategoryId
});

const initialState: State = adapter.getInitialState({
  definitionsFetched: false,
});

const interestAudienceReducer = createReducer(
  initialState,
  on(InterestAudienceActions.loadAudienceDefinitions,
    (state, action) => adapter.setAll(action.definitions, { ...state, definitionsFetched: true })
  ),
  on(InterestAudienceActions.clearAudienceDefinitions,
     InterestAudienceActions.fetchAudienceDefinitions,
    state => adapter.removeAll({ ...state, definitionsFetched: false })
  ),
);

export function reducer(state: State | undefined, action: Action) {
  return interestAudienceReducer(state, action);
}

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();

const currentSlice = createSelector(audienceDefinitionSlice, state => state.interest);
export const fetchComplete = createSelector(currentSlice, state => state.definitionsFetched);
export const allDefinitions = createSelector(currentSlice, selectAll);
