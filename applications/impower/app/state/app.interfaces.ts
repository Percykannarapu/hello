import { RouterReducerState } from '@ngrx/router-store';
import { BatchMapState } from './batch-map/batch-map.reducer';
import { DataShimState } from './data-shim/data-shim.reducer';
import { MenuState } from './menu/menu.reducer';
import * as fromEsri from '@val/esri';
import { HomeGeoState } from './homeGeocode/homeGeo.reducer';
import * as fromDataStore from '../impower-datastore/state/impower-datastore.interfaces';
import * as fromMessaging from '@val/messaging';
import { RenderingState } from './rendering/rendering.reducer';
import { RouterStateUrl } from './shared/router.interfaces';

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
  siteIds: Array<string>;
}

export const getRenderingSlice = (state: LocalAppState) => state.rendering;

