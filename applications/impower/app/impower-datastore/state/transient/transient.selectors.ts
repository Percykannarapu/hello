import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';
import { isEmpty, transformEntity } from '@val/common';
import { shadingSelectors } from '@val/esri';
import * as fromAudienceSel from './audience/audience.selectors';
import * as fromCustomVars from './custom-vars/custom-vars.selectors';
import { DynamicVariable, mergeVariablesToEntity } from './dynamic-variable.model';
import * as fromGeoVarsSel from './geo-vars/geo-vars.selectors';

// Interfaces to support the geo grid
export interface MinMax {
  min: number;
  max: number;
  cnt: number;
}

export interface GridGeoVar {
  geoVars: Dictionary<DynamicVariable>;
}

/**
 * Selector to retrieve geo vars prepared for the geo grid.
 * Will return a GridGeoVar entity that contains not only the geoVars, but information about the
 * data set for filters and totals.
 */
export const selectGridGeoVars = createSelector(
  fromGeoVarsSel.allGeoVarEntities,
  fromCustomVars.allCustomVars,
  (geoVars, customVars) => {
    const result: GridGeoVar = { geoVars: null };
    if (Object.keys(geoVars).length > 0 || customVars.length > 0) {
      result.geoVars = mergeVariablesToEntity(geoVars, customVars);
    }
    return result;
  }
);

export const getAllMappedAudiences = createSelector(
  fromAudienceSel.allAudiences,
  shadingSelectors.layerDataKeys,
  (allAudiences, mappedIds) => {
    const idSet = new Set(mappedIds);
    return allAudiences.filter(a => idSet.has(a.audienceIdentifier));
  }
);

export const getFetchableMappedAudiences = createSelector(
  fromAudienceSel.fetchableAudiences,
  shadingSelectors.layerDataKeys,
  (allAudiences, mappedIds) => {
    const idSet = new Set(mappedIds);
    return allAudiences.filter(a => idSet.has(a.audienceIdentifier));
  }
);

export const getFirstTimeShadedAudiences = createSelector(
  fromAudienceSel.fetchableAudiences,
  shadingSelectors.layerDefsForDataFetch,
  (allAudiences, mappedIds) => {
    const idSet = new Set(mappedIds);
    return allAudiences.filter(a => idSet.has(a.audienceIdentifier));
  }
);

export const getFirstTimeCustomShadedAudiences = createSelector(
  fromAudienceSel.customAudiences,
  shadingSelectors.layerDefsForDataFetch,
  (allAudiences, mappedIds) => {
    const idSet = new Set(mappedIds);
    return allAudiences.filter(a => idSet.has(a.audienceIdentifier));
  }
);
