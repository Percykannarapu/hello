import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, EsriState } from '../esri.reducers';
import * as fromPoi from './esri.poi.reducer';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriPoiSlice = createSelector(getEsriState, state => state.poi);

const getEsriPoiDefs = createSelector(getEsriPoiSlice, fromPoi.selectAll);
const getEsriShadingDefsForUpdate = createSelector(getEsriPoiDefs, layers => layers.filter(l => l.featureLayerId != null));

export const poiSelectors = {
  allPoiDefs: getEsriPoiDefs,
  poiDefsForUpdate: getEsriShadingDefsForUpdate
};
