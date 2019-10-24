import { RouterReducerState } from '@ngrx/router-store';
import { createSelector } from '@ngrx/store';
import { BatchMapState } from './batch-map/batch-map.reducer';
import { RouterStateUrl } from './shared/utils';
import { DataShimState } from './data-shim/data-shim.reducer';
import { MenuState } from './menu/menu.reducer';
import * as fromEsri from '@val/esri';
import { HomeGeoState } from './homeGeocode/homeGeo.reducer';
import * as fromDataStore from '../impower-datastore/state/impower-datastore.interfaces';
import * as fromMessaging from '@val/messaging';
import { RenderingState } from './rendering/rendering.reducer';

export interface FullAppState extends LocalAppState, fromEsri.AppState, fromMessaging.AppState {}

export interface LocalAppState {
  router: RouterReducerState<RouterStateUrl>;
  dataShim: DataShimState;
  menu: MenuState;
  homeGeo: HomeGeoState;
  datastore: fromDataStore.ImpowerDatastoreState;
  rendering: RenderingState;
  batchMap: BatchMapState;
}

export interface BatchMapPayload {
  email: string;
  title: string;
  subTitle: string;
  subSubTitle: string;
  projectId: number;
  size: string;
  layout: string;
  numSites: number;
}

export const getRenderingSlice = (state: LocalAppState) => state.rendering;
export const getMenuSlice = (state: LocalAppState) => state.menu;
const getRouterSlice = (state: LocalAppState) => state.router;

// since we don't actually have router actions/reducer/effects, just stash the selectors here
export const getRouteUrl = createSelector(getRouterSlice, state => state.state.url);
export const getRouteParams = createSelector(getRouterSlice, state => state.state.params);
export const getRouteQueryParams = createSelector(getRouterSlice, state => state.state.queryParams);
