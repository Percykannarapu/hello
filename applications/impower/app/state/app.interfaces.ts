import { RouterReducerState } from '@ngrx/router-store';
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
}

export const getRenderingSlice = (state: LocalAppState) => state.rendering;
export const getMenuSlice = (state: LocalAppState) => state.menu;
