import { RouterReducerState } from '@ngrx/router-store';
import * as fromEsri from '@val/esri';
import * as fromMessaging from '@val/messaging';
import * as fromDataStore from '../impower-datastore/state/impower-datastore.interfaces';
import { BatchMapState } from './batch-map/batch-map.reducer';
import { DataShimState } from './data-shim/data-shim.reducer';
import { FormsState } from './forms/forms.interfaces';
import { HomeGeoState } from './homeGeocode/homeGeo.reducer';
import { MenuState } from './menu/menu.reducer';
import { RenderingState } from './rendering/rendering.reducer';
import { RouterStateUrl } from './shared/router.interfaces';

export interface FullAppState
  extends LocalAppState, ImpowerAppState, fromDataStore.AppState, fromEsri.AppState, fromMessaging.AppState
{}

export interface LocalAppState {
  router: RouterReducerState<RouterStateUrl>;
}

interface ImpowerAppState {
  impower: ImpowerState;
}

export interface ImpowerState {
  dataShim: DataShimState;
  menu: MenuState;
  homeGeo: HomeGeoState;
  rendering: RenderingState;
  batchMap: BatchMapState;
  forms: FormsState;
}



export interface BatchMapPayload {
  calls: [{
    service: string
    function: string
    args: {
      'printJobConfiguration': {
        email: string;
        title: string;
        subTitle: string;
        subSubTitle: string;
        projectId: number;
        size: string;
        layout: string;
        siteIds: Array<string>;
      }
    }
  }]

}

export interface CrossBowSitesPayload {
  email: string;
  id: number;
  profileId?: number;
  groupId?: number;
}
