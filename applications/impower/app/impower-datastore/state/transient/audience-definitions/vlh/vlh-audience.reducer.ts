import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { audienceDefinitionSlice } from '../../../impower-datastore.selectors';
import { OnlineAudienceDefinition } from '../audience-definitions.model';
import * as VlhAudienceActions from './vlh-audience.actions';

export interface State extends EntityState<OnlineAudienceDefinition> {
  definitionsFetched: boolean;
}

const adapter: EntityAdapter<OnlineAudienceDefinition> = createEntityAdapter<OnlineAudienceDefinition>({
  selectId: model => model.digCategoryId
});

const initialState: State = adapter.getInitialState({
  definitionsFetched: false,
});

const vlhAudienceReducer = createReducer(
  initialState,
  on(VlhAudienceActions.loadAudienceDefinitions,
    (state, { definitions }) => adapter.setAll(definitions, { ...state, definitionsFetched: true })
  ),
  on(VlhAudienceActions.clearAudienceDefinitions,
     VlhAudienceActions.fetchAudienceDefinitions,
    state => adapter.removeAll({ ...state, definitionsFetched: false })
  ),
);

export function reducer(state: State | undefined, action: Action) {
  return vlhAudienceReducer(state, action);
}

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();

const currentVlhSlice = createSelector(audienceDefinitionSlice, state => state.vlh);
export const fetchComplete = createSelector(currentVlhSlice, state => state.definitionsFetched);
export const allDefinitions = createSelector(currentVlhSlice, selectAll);
