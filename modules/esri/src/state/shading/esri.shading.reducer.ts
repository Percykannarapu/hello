import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { ShadingDefinition } from '../../models/shading-configuration';
import { loadInitialState } from '../esri.actions';
import * as ShadingActions from './esri.shading.actions';

export interface EsriShadingState extends EntityState<ShadingDefinition> {
  featuresOfInterest: string[];
}

function sortComparer(a: ShadingDefinition, b: ShadingDefinition) : number {
  return a.sortOrder - b.sortOrder;
}

const adapter: EntityAdapter<ShadingDefinition> = createEntityAdapter<ShadingDefinition>({
  sortComparer
});

const initialState: EsriShadingState = adapter.getInitialState({
  featuresOfInterest: []
});

export const shadingReducer = createReducer(
  initialState,
  on(loadInitialState, (state, { shading }) => {
      return {
        ...state,
        ...initialState,
        ...shading
      };
  }),

  on(ShadingActions.setFeaturesOfInterest, (state, { features }) => ({ ...state, featuresOfInterest: [...features] })),
  on(ShadingActions.clearFeaturesOfInterest, (state) => ({ ...state, featuresOfInterest: initialState.featuresOfInterest })),

  on(ShadingActions.addShadingDefinition,
    (state, action) => adapter.addOne(action.shadingDefinition, state)
  ),
  on(ShadingActions.upsertShadingDefinition,
    (state, action) => adapter.upsertOne(action.shadingDefinition, state)
  ),
  on(ShadingActions.addShadingDefinitions,
    (state, action) => adapter.addMany(action.shadingDefinitions, state)
  ),
  on(ShadingActions.upsertShadingDefinitions,
    (state, action) => adapter.upsertMany(action.shadingDefinitions, state)
  ),
  on(ShadingActions.updateShadingDefinition,
    (state, action) => adapter.updateOne(action.shadingDefinition, state)
  ),
  on(ShadingActions.updateShadingDefinitions,
    (state, action) => adapter.updateMany(action.shadingDefinitions, state)
  ),
  on(ShadingActions.deleteShadingDefinition,
    (state, action) => adapter.removeOne(action.id, state)
  ),
  on(ShadingActions.deleteShadingDefinitions,
    (state, action) => adapter.removeMany(action.ids, state)
  ),
  on(ShadingActions.loadShadingDefinitions,
    (state, action) => adapter.setAll(action.shadingDefinitions, state)
  ),
  on(ShadingActions.clearShadingDefinitions,
    state => adapter.removeAll(state)
  ),
  on(ShadingActions.resetShading,
    () => ({ ...initialState })
  ),
  on(ShadingActions.firstTimeShaderDataLoadComplete,
    (state, action) => {
    const dataKeySet = new Set(action.dataKeys);
    const shadersToUpdate = (state.ids as string[]).map(id => state.entities[id]).filter(s => dataKeySet.has(s.dataKey) && s.shaderNeedsDataFetched);
    return adapter.updateMany(shadersToUpdate.map(sd => ({ id: sd.id, changes: { shaderNeedsDataFetched: false }})), state);
  }),
);

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
