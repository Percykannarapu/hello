import { RouterReducerState } from '@ngrx/router-store';
import * as fromEsri from '@val/esri';
import * as fromMessaging from '@val/messaging';
import * as fromDataStore from '../impower-datastore/state/impower-datastore.interfaces';
import { BatchMapState } from './batch-map/batch-map.reducer';
import { DataShimState } from './data-shim/data-shim.reducer';
import { FormsState } from './forms/forms.interfaces';
import { HomeGeoState } from './homeGeocode/homeGeo.reducer';
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
  homeGeo: HomeGeoState;
  rendering: RenderingState;
  batchMap: BatchMapState;
  forms: FormsState;
}

export enum BatchMapSizes {
  letter = 'letter',
  legal = 'legal',
  tabloid = 'tabloid',
  large = 'large',
  jumbo = 'jumbo'
}

export enum FitToPageOptions {
  geos = 'geos',
  ta = 'ta'
}

export interface BatchMapPayload {
  calls: [{
    service: string
    function: string
    args: {
      'printJobConfiguration': {
        email: string;
        titles: Array<TitlePayload>;
        projectId: number;
        size: BatchMapSizes;
        pageSettings: string;
        layout: string;
        siteIds: Array<string>;
        hideNeighboringSites: boolean;
        shadeNeighboringSites: boolean;
        fitTo: FitToPageOptions;
        duplicated: boolean;
        buffer: number;
        groupByAttribute?: string;
        projectName: string;
        jobType: string;
        enableLabel?: boolean;
        enableSymbol?: boolean;
        enableTaBoundaries?: boolean;
      }
    }
  }];
}

export interface SinglePageBatchMapPayload {
  calls: [{
    service: string,
    function: string,
    args: {
      'singlePageConfiguration': {
        email: string;
        projectId: number;
        size: BatchMapSizes;
        layout: string;
        title: string;
        subTitle: string;
        subSubTitle: string;
        fitTo: FitToPageOptions;
        buffer: number;
        taName: string;
        projectName: string;
        jobType: string;
      }
    }
  }];
}

export interface CurrentPageBatchMapPayload {
  calls: [{
    service: string,
    function: string,
    args: {
      'currentPageConfiguration': {
        email: string;
        projectId: number;
        size: BatchMapSizes;
        layout: string;
        title: string;
        subTitle: string;
        subSubTitle: string;
        //fitTo: FitToPageOptions;
        //buffer: number;
        xmin: string;
        xmax: string;
        ymin: string;
        ymax: string;
        taName: string;
        projectName: string;
        jobType: string;
      }
    }
  }];
}

export interface NationalMapBatchMapPayload {
  calls: [{
    service: string,
    function: string,
    args: {
      'nationalMapConfiguration': {
        email: string;
        projectId: number;
        size: BatchMapSizes;
        layout: string;
        title: string;
        subTitle: string;
        subSubTitle: string;
        taName: string;
        projectName: string;
        jobType: string;
        nationalMaps: string;
        audience: string;
      }
    }
  }];
}

export interface TitlePayload {
  siteId: string;
  title: string;
  subTitle: string;
  subSubTitle: string;
  taName: string;
}

export interface ExtentPayload{
  spatialReference: SpatialReference;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface SpatialReference{
  wkid: number;
}

export interface MustCoverPref {
  fileName: string;
  fileContents: string;
  fileAnalysisLevel: string;
}
