import { Dictionary } from '@ngrx/entity';
import { Action, ActionReducer, ActionReducerMap, combineReducers, createSelector } from '@ngrx/store';
import { groupEntityToArray, transformEntity } from '@val/common';
import { shadingSelectors } from '@val/esri';
import * as fromAudience from './audience/audience.reducer';
import * as fromAudienceSel from './audience/audience.selectors';
import * as fromGeoAttribute from './geo-attributes/geo-attributes.reducer';
import { GeoVar } from './geo-vars/geo-vars.model';
import * as fromGeoVars from './geo-vars/geo-vars.reducer';
import * as fromGeoVarsSel from './geo-vars/geo-vars.selectors';
import * as fromMapVars from './map-vars/map-vars.reducer';

export interface ImpowerTransientState {
  audiences: fromAudience.State;
  geoVars: fromGeoVars.State;
  mapVars: fromMapVars.State;
  geoAttributes: fromGeoAttribute.State;
}

const transientReducers: ActionReducerMap<ImpowerTransientState> = {
  audiences: fromAudience.reducer,
  geoVars: fromGeoVars.reducer,
  mapVars: fromMapVars.reducer,
  geoAttributes: fromGeoAttribute.reducer
};

const metaReducer: ActionReducer<ImpowerTransientState> = combineReducers(transientReducers);

export function reducer(state: ImpowerTransientState, action: Action) : ImpowerTransientState {
  return metaReducer(state, action);
}

// Selector to retrieve geo vars with audienceNames instead of ids
export const selectAudiencesAndVars = createSelector(
  fromAudienceSel.allAudienceEntities,
  fromGeoVarsSel.allGeoVars,
  (audiences, geoVars) => {
    return geoVars.map(gv => {
        const newGeoVar = { Geocode: gv.geocode };
        for (const [name, val] of Object.entries(gv)) {
          if (audiences[name] != null && audiences[name].showOnGrid)
             newGeoVar[audiences[name].audienceName] = val;
        }
        return newGeoVar;
      });
  }
);

// Interfaces to support the geo grid
export interface MinMax {
  min: number;
  max: number;
  cnt: number;
}

export interface GridGeoVar {
  geoVars: Dictionary<GeoVar>;
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
  (audiences, geoVars) => {
    const result: GridGeoVar = { geoVars: null, ranges: new Map<string, MinMax>(), lov: new Map<string, string[]>(), numVars: 0 };
    const transformedEntity = transformEntity(geoVars, (varName, val) => {
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



    const entityMap: Map<string, any> = groupEntityToArray(Object.keys(geoVars).map(key => geoVars[key]),
      (k) => {
        if (k === 'geocode')
          return null;
        else
          return k;
      },
      (v) => {
        return v;
      });

    result.geoVars = transformedEntity as Dictionary<GeoVar>;

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
