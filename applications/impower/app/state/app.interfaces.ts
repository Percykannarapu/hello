import { RouterReducerState } from '@ngrx/router-store';
import { RouterStateUrl } from './shared/utils';
import { DataShimState } from './data-shim/data-shim.reducer';
import { MenuState } from './menu/menu.reducer';
import * as fromEsri from '@val/esri';
import { HomeGeoState } from './homeGeocode/homeGeo.reducer';

export interface FullAppState extends LocalAppState, fromEsri.AppState {}

export interface LocalAppState {
  router: RouterReducerState<RouterStateUrl>;
  dataShim: DataShimState;
  menu: MenuState;
  homeGeo: HomeGeoState;
}
