import { Dictionary } from '@ngrx/entity';
import { createSelector } from '@ngrx/store';
import { groupEntityToArray, transformEntity } from '@val/common';
import { shadingSelectors } from '@val/esri';
import * as fromAudienceSel from './audience/audience.selectors';
import { DynamicVariable, mergeVariablesToEntity } from './dynamic-variable.model';
import * as fromGeoVarsSel from './geo-vars/geo-vars.selectors';
import * as fromCustomVars from './custom-vars/custom-vars.selectors';

// Interfaces to support the geo grid
export interface MinMax {
  min: number;
  max: number;
  cnt: number;
}

export interface GridGeoVar {
  geoVars: Dictionary<DynamicVariable>;
  ranges: Map<string, MinMax>;
  lov: Map<string, string[]>;
  numVars: number;
}

/**
 * Selector to retrieve geo vars prepared for the geo grid.
 * Will return a GridGeoVar entity that contains not only the geoVars, but information about the
 * data set for filters and totals.
 */
export const selectGridGeoVars = createSelector(
  fromAudienceSel.allAudienceEntities,
  fromGeoVarsSel.allGeoVarEntities,
  fromCustomVars.allCustomVars,
  (audiences, geoVars, customVars) => {
    const result: GridGeoVar = { geoVars: null, ranges: new Map<string, MinMax>(), lov: new Map<string, string[]>(), numVars: 0 };
    const mergedVars = mergeVariablesToEntity(geoVars, customVars);
    console.log('Inside selector.', mergedVars);
    const transformedEntity = transformEntity(mergedVars, (varName, val) => {
        if ((audiences.hasOwnProperty(varName) && audiences[varName].showOnGrid))
          result.numVars++;

        switch (audiences.hasOwnProperty(varName) ? audiences[varName].fieldconte : 'unknown') {
          case 'COUNT':
          case 'MEDIAN':
          case 'INDEX':
            return (val != null) ? Math.round(val as number) : null;

          case 'PERCENT':
          case 'RATIO':
            return (val != null) ? Number(val).toFixed(2) : null;

          case 'CHAR':
            return val as string;

          default:
            return val;
        }
      },
      (varName) => {
        if ((audiences.hasOwnProperty(varName) && audiences[varName].showOnGrid === false))
          return null;
        else
          return varName;
      });



    const entityMap: Map<string, any> = groupEntityToArray(Object.keys(mergedVars).map(key => mergedVars[key]),
      (k) => {
        if (k === 'geocode')
          return null;
        else
          return k;
      },
      (v) => {
        return v;
      });

    result.geoVars = transformedEntity as Dictionary<DynamicVariable>;

    // Track the distinct list of values for CHAR and min/max for numerics
    entityMap.forEach((value, varPk) => {
      const n = varPk.indexOf(':');
      const key = varPk.substr(n + 1);
      const fieldConte = audiences.hasOwnProperty(key) ? audiences[key].fieldconte : 'unknown';
      if (fieldConte === 'CHAR')
        result.lov.set(key, Array.from(new Set(value as string)).sort());
      else {
        const minVal = value.reduce((min: number, p: number) => p < min ? p : min, value[0]);
        const maxVal = value.reduce((max: number, p: number) => p > max ? p : max, minVal);
        result.ranges.set(key, { min: minVal, max: maxVal, cnt: value.length });
      }
    });
    entityMap.clear();

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
