import { RouterReducerState } from '@ngrx/router-store';
import { RouterStateUrl } from './shared/utils';
import { DataShimState } from './data-shim/data-shim.reducer';
import { MenuState } from './menu/menu.reducer';

export interface AppState {
  router: RouterReducerState<RouterStateUrl>;
  dataShim: DataShimState;
  menu: MenuState;
}
