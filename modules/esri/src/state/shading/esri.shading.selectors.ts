import { createFeatureSelector, createSelector } from '@ngrx/store';
import { isNil } from '@val/common';
import { ConfigurationTypes, ShadingDefinition } from '../../models/shading-configuration';
import { AppState, EsriState } from '../esri.reducers';
import * as fromShading from './esri.shading.reducer';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriShadingSlice = createSelector(getEsriState, state => state.shading);

const getEsriShadingFeatures = createSelector(getEsriShadingSlice, state => state.featuresOfInterest);
const getEsriShadingFeaturesCsv = createSelector(getEsriShadingFeatures, features => features.map(f => `'${f}'`).join(','));
const getEsriShadingDefs = createSelector(getEsriShadingSlice, fromShading.selectAll);
const getVisibleLayerDefs = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.visible));
const getVisibleFullMapDefs = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.filterByFeaturesOfInterest === false));
const getReadyLocalLayerDefs = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.useLocalGeometry === true && l.destinationLayerUniqueId == null));
const getVisibleLocalLayerDefs = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.useLocalGeometry === true && l.destinationLayerUniqueId != null));
const getEsriShadingDefsForCreate = createSelector(getEsriShadingDefs, layers => layers.filter(l => shadingDefinitionIsReady(l)));
const getEsriShadingDefsForUpdate = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.destinationLayerUniqueId != null));
const getEsriShadingLayerIds = createSelector(getEsriShadingDefsForUpdate, layers => layers.map(l => l.destinationLayerUniqueId));
const getEsriShadingDataKeys = createSelector(getVisibleLayerDefs, layers => layers.map(l => l.dataKey));
const getEsriShadingLayersForFetch = createSelector(getVisibleLayerDefs, layers => layers.filter(l => l.shaderNeedsDataFetched).map(l => l.dataKey));
const getEsriShadingLayersForNationalFetch = createSelector(getVisibleLocalLayerDefs, layers => layers.filter(l => l.sourcePortalId != null).map(l => l.dataKey));

function shadingDefinitionIsReady(def: ShadingDefinition) : boolean {
  return !isNil(def.shadingType) && !isNil(def.sourcePortalId) && isNil(def.destinationLayerUniqueId);
}

export const shadingSelectors = {
  features: getEsriShadingFeatures,
  featuresCsv: getEsriShadingFeaturesCsv,
  allLayerDefs: getEsriShadingDefs,
  visibleLayerDefs: getVisibleLayerDefs,
  visibleFullMapDefs: getVisibleFullMapDefs,
  visibleLocalLayerDefs: getVisibleLocalLayerDefs,
  readyLocalLayerDefs: getReadyLocalLayerDefs,
  layerDefsToCreate: getEsriShadingDefsForCreate,
  layerDefsForUpdate: getEsriShadingDefsForUpdate,
  layerUniqueIds: getEsriShadingLayerIds,
  layerDataKeys: getEsriShadingDataKeys,
  layerDefsForDataFetch: getEsriShadingLayersForFetch,
  layerDefsForNationalFetch: getEsriShadingLayersForNationalFetch
};
