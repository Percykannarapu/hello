import { createFeatureSelector, createSelector } from '@ngrx/store';
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
const getEsriShadingDefsForCreate = createSelector(getEsriShadingDefs, layers => layers.filter(l => shadingDefinitionIsReady(l)));
const getEsriShadingDefsForUpdate = createSelector(getEsriShadingDefs, layers => layers.filter(l => l.destinationLayerUniqueId != null));
const getEsriShadingLayerIds = createSelector(getEsriShadingDefsForUpdate, layers => layers.map(l => l.destinationLayerUniqueId));
const getEsriShadingDataKeys = createSelector(getVisibleLayerDefs, layers => layers.map(l => l.dataKey));

function shadingDefinitionIsReady(def: ShadingDefinition) : boolean {
  switch (def.shadingType) {
    case ConfigurationTypes.Simple:
      return def.sourcePortalId != null && def.destinationLayerUniqueId == null;
    case ConfigurationTypes.Unique:
    case ConfigurationTypes.Ramp:
    case ConfigurationTypes.ClassBreak:
      return def.sourcePortalId != null && def.destinationLayerUniqueId == null && (def.breakDefinitions || []).length > 0;
    case ConfigurationTypes.DotDensity:
      return def.sourcePortalId != null && def.destinationLayerUniqueId == null && (def.arcadeExpression || '').length > 0;
    default:
      return false;
  }
}

export const shadingSelectors = {
  features: getEsriShadingFeatures,
  featuresCsv: getEsriShadingFeaturesCsv,
  allLayerDefs: getEsriShadingDefs,
  visibleLayerDefs: getVisibleLayerDefs,
  visibleFullMapDefs: getVisibleFullMapDefs,
  layerDefsToCreate: getEsriShadingDefsForCreate,
  layerDefsForUpdate: getEsriShadingDefsForUpdate,
  layerUniqueIds: getEsriShadingLayerIds,
  layerDataKeys: getEsriShadingDataKeys
};
