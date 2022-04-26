import { createFeatureSelector, createSelector } from '@ngrx/store';
import { isNil } from '@val/common';
import { ShadingDefinition } from '../../models/shading-configuration';
import { AppState, EsriState } from '../esri.reducers';
import * as fromShading from './esri.shading.reducer';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriShadingSlice = createSelector(getEsriState, state => state.shading);

const getEsriShadingFeatures = createSelector(getEsriShadingSlice, state => state.featuresOfInterest);
const getEsriShadingFeaturesCsv = createSelector(getEsriShadingFeatures, features => features.map(f => `'${f}'`).join(','));
const getEsriShadingDefs = createSelector(getEsriShadingSlice, fromShading.selectAll);
const getEsriShadingLayerIds = createSelector(getEsriShadingDefs, layers => layers.map(l => l.destinationLayerUniqueId));
const getEsriNormalShadingDefs = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.useLocalGeometry !== true));
const getEsriNationalShadingDefs = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.useLocalGeometry === true));

const getVisibleLayerDefs = createSelector(getEsriNormalShadingDefs, layers => layers.filter(l => l.visible));
const getVisibleFullMapDefs = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.filterByFeaturesOfInterest === false));
const getEsriShadingDefsForCreate = createSelector(getEsriNormalShadingDefs, layers => layers.filter(l => shadingDefinitionIsReady(l)));
const getEsriShadingDefsForUpdate = createSelector(getEsriNormalShadingDefs, layers => layers.filter(l => l.destinationLayerUniqueId != null));
const getEsriShadingDataKeys = createSelector(getVisibleLayerDefs, layers => layers.map(l => l.dataKey));
const getEsriShadingLayersForFetch = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.shaderNeedsDataFetched).map(l => l.dataKey));

const getNationalShadingDefsForCreate = createSelector(getEsriNationalShadingDefs, layers => layers.filter(l => shadingDefinitionIsReady(l)));
const getNationalShadingDefsForUpdate = createSelector(getEsriNationalShadingDefs, layers => layers.filter(l => l.destinationLayerUniqueId != null));

function shadingDefinitionIsReady(def: ShadingDefinition) : boolean {
  return !isNil(def.shadingType) && !isNil(def.sourcePortalId) && isNil(def.destinationLayerUniqueId);
}

export const shadingSelectors = {
  features: getEsriShadingFeatures,
  featuresCsv: getEsriShadingFeaturesCsv,
  allLayerDefs: getEsriShadingDefs,
  layerUniqueIds: getEsriShadingLayerIds,

  visibleLayerDefs: getVisibleLayerDefs,
  visibleFullMapDefs: getVisibleFullMapDefs,
  layerDefsToCreate: getEsriShadingDefsForCreate,
  layerDefsForUpdate: getEsriShadingDefsForUpdate,
  layerDataKeys: getEsriShadingDataKeys,
  layerDefsForDataFetch: getEsriShadingLayersForFetch,

};

export const nationalShadingSelectors = {
  layerDefsToCreate: getNationalShadingDefsForCreate,
  layerDefsForUpdate: getNationalShadingDefsForUpdate,
};
