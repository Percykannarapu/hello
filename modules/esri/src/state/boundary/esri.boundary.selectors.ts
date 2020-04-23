import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AppState, EsriState } from '../esri.reducers';
import * as fromBoundary from './esri.boundary.reducer';

const getEsriState = createFeatureSelector<AppState, EsriState>('esri');
const getEsriBoundarySlice = createSelector(getEsriState, state => state.boundary);

const getEsriBoundaryConfigs = createSelector(getEsriBoundarySlice, fromBoundary.selectAll);
const getVisibleLayerConfigs = createSelector(getEsriBoundaryConfigs, state => state.filter(s => s.visible));
const getHiddenLayerConfigs = createSelector(getEsriBoundaryConfigs, state => state.filter(s => !s.visible));
const getEsriBoundariesReadyToCreate = createSelector(getVisibleLayerConfigs, state => state.filter(s => s.destinationBoundaryId == null));
const getEsriBoundariesReadyForUpdate = createSelector(getVisibleLayerConfigs, state => state.filter(s => s.destinationBoundaryId != null));
const getEsriBoundariesReadyForDelete = createSelector(getHiddenLayerConfigs, state => state.filter(s => s.destinationBoundaryId != null));

export const boundarySelectors = {
  allBoundaryDefs: getEsriBoundaryConfigs,
  visibleBoundaryDefs: getVisibleLayerConfigs,
  boundariesReadyToCreate: getEsriBoundariesReadyToCreate,
  boundariesReadyToUpdate: getEsriBoundariesReadyForUpdate,
  boundariesReadyToDelete: getEsriBoundariesReadyForDelete
};
