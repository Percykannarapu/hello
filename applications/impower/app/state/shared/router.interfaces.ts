import { Params } from '@angular/router';
import { createSelector } from '@ngrx/store';
import { strToBool } from '@val/common';
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
  height: number;
  hideNeighboringSites: boolean;
  startingSite: string;
  singlePage: boolean;
  shadeNeighboringSites: boolean;
  groupByAttribute: string;
  fitTo: FitTo;
  duplicated: boolean;
  buffer: number;
}

const defaultBatchQueryParams: BatchMapQueryParams = {
  height: 850,
  hideNeighboringSites: false,
  startingSite: null,
  singlePage: false,
  shadeNeighboringSites: false,
  groupByAttribute: null,
  fitTo: FitTo.GEOS,
  duplicated: false,
  buffer: 0
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
    if (state.height != null && !Number.isNaN(Number(state.height))) result.height = Number(state.height);
    if (state.hideNeighboringSites != null) result.hideNeighboringSites = strToBool(state.hideNeighboringSites);
    if (state.duplicated != null) result.duplicated = strToBool(state.duplicated);
    if (state.buffer != null && !Number.isNaN(Number(state.buffer))) result.buffer = Number(state.buffer);
  }
  return result;
});
