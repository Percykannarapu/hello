import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, createSelector, on } from '@ngrx/store';
import { audienceDefinitionSlice } from '../../../impower-datastore.selectors';
import { OnlineAudienceDefinition } from '../audience-definitions.model';
import * as PixelAudienceActions from './pixel-audience.actions';

export interface State extends EntityState<OnlineAudienceDefinition> {
  definitionsFetched: boolean;
}

const adapter: EntityAdapter<OnlineAudienceDefinition> = createEntityAdapter<OnlineAudienceDefinition>({
  selectId: model => model.digCategoryId
});

const initialState: State = adapter.getInitialState({
  definitionsFetched: false,
});

const pixelAudienceReducer = createReducer(
  initialState,
  on(PixelAudienceActions.loadAudienceDefinitions,
    (state, action) => adapter.setAll(action.definitions, { ...state, definitionsFetched: true })
  ),
  on(PixelAudienceActions.clearAudienceDefinitions,
     PixelAudienceActions.fetchAudienceDefinitions,
    state => adapter.removeAll({ ...state, definitionsFetched: false })
  ),
);

export function reducer(state: State | undefined, action: Action) {
  return pixelAudienceReducer(state, action);
}

const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();

const currentSlice = createSelector(audienceDefinitionSlice, state => state.pixel);
export const fetchComplete = createSelector(currentSlice, state => state.definitionsFetched);
export const allDefinitions = createSelector(currentSlice, selectAll);
