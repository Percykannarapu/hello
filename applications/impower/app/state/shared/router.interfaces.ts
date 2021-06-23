import { Params } from '@angular/router';
import { createSelector } from '@ngrx/store';
import { isConvertibleToInteger, isConvertibleToNumber, strToBool } from '@val/common';
import { LocalAppState } from '../app.interfaces';

export interface RouterStateUrl {
  url: string;
  params: Params;
  queryParams: Params;
}

export enum FitTo {
  GEOS = 'geos',
  TA = 'ta'
}

export interface BatchMapQueryParams {
  id: number;
  height: number;
  hideNeighboringSites: boolean;
  startingSite: string;
  singlePage: boolean;
  shadeNeighboringSites: boolean;
  groupByAttribute: string;
  fitTo: FitTo;
  duplicated: boolean;
  buffer: number;
  currentView: boolean;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  labels: boolean;
  symbols: boolean;
  tradeAreaBoundaries: boolean;
}

const defaultBatchQueryParams: BatchMapQueryParams = {
  id: null,
  height: 850,
  hideNeighboringSites: false,
  startingSite: null,
  singlePage: false,
  shadeNeighboringSites: false,
  groupByAttribute: null,
  fitTo: FitTo.GEOS,
  duplicated: false,
  buffer: 0,
  currentView: false,
  xmin: null,
  ymin: null,
  xmax: null,
  ymax: null,
  labels: true,
  symbols: true,
  tradeAreaBoundaries: true,
};

const getRouterSlice = (state: LocalAppState) => state.router;
export const getRouteUrl = createSelector(getRouterSlice, state => state.state.url);
export const getRouteParams = createSelector(getRouterSlice, state => state.state.params);
export const getRouteQueryParams = createSelector(getRouterSlice, state => state != null ? state.state.queryParams : null);
export const getTypedBatchQueryParams = createSelector(getRouteQueryParams, state => {
  const result: BatchMapQueryParams = {
    ...defaultBatchQueryParams,
    ...(state || {})
  };
  if (state != null) {
    if (isConvertibleToInteger(state.id)) result.id = Number(state.id);
    if (isConvertibleToInteger(state.height)) result.height = Number(state.height);
    if (state.hideNeighboringSites != null) result.hideNeighboringSites = strToBool(state.hideNeighboringSites);
    if (state.duplicated != null) result.duplicated = strToBool(state.duplicated);
    if (isConvertibleToNumber(state.buffer)) result.buffer = Number(state.buffer);
    if (state.labels != null) result.labels = strToBool(state.labels);
    if (state.symbols != null) result.symbols = strToBool(state.symbols);
    if (state.tradeAreaBoundaries != null) result.tradeAreaBoundaries = strToBool(state.tradeAreaBoundaries);
  }
  return result;
});
export const getRouteIdOrQueryId = createSelector(getRouteParams, getTypedBatchQueryParams, (params: Params, queryParams: BatchMapQueryParams) => {
  return params.id || queryParams.id;
});
