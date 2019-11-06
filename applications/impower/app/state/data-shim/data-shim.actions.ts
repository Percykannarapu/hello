import { Action } from '@ngrx/store';
import { ProjectFilterChanged } from '../../models/ui-enums';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { TradeAreaDefinition } from 'app/services/app-trade-area.service';

export enum DataShimActionTypes {
  ProjectSaveSuccess = '[Application Data Shim] Project Saved Successfully',
  ProjectSaveFailure = '[Application Data Shim] Project Save Failed',

  ProjectLoad = '[Application Data Shim] Load Project',
  ProjectLoadSuccess = '[Application Data Shim] Project Loaded Successfully',
  ProjectLoadFailure = '[Application Data Shim] Project Load Failed',

  ProjectCreateNew = '[Application Data Shim] Create New Project',
  ProjectCreateNewComplete = '[Application Data Shim] Create New Project Complete',

  ProjectSaveAndNew = '[Application Data Shim] Project Save and New',
  ProjectSaveAndLoad = '[Application Data Shim] Project Save and Load',
  ProjectSaveAndReload = '[Application Data Shim] Project Save and Reload',

  ExportGeofootprint = '[Application Data Shim] Export Geofootprint',
  ExportHGCIssuesLog = '[Application Data Shim] Export ExportHGCIssuesLog',
  ExportLocations = '[Application Data Shim] Export Locations',
  ExportApioNationalData = '[Application Data Shim] Export National Online Data',

  FiltersChanged = '[Application Data Shim] Project Filters Changed',

  CalculateMetrics = '[Application Data Shim] Calculate Color box metrics',

  ProjectLoadFinish = '[Application Data Shim] Project Load Finish',
  IsProjectReload = '[Application Data Shim] Project Reload',

  LayerSetupComplete = '[Application Data Shim] Layer Setup Complete',

  TradeAreaRollDownGeos = '[Application Data Shim] TradeArea RollDown Geos'
}

export class ProjectSaveAndNew implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndNew;
}

export class ProjectSaveAndReload implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndReload;
}

export class IsProjectReload implements Action {
  readonly type = DataShimActionTypes.IsProjectReload;
  constructor(public payload: { isReload: boolean }) {}
}

export class ProjectSaveAndLoad implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndLoad;
  constructor(public payload: { projectId: number }) {}
}

export class ProjectSaveSuccess implements Action {
  readonly type = DataShimActionTypes.ProjectSaveSuccess;
  constructor(public payload: { projectId: number }) {}
}

export class ProjectSaveFailure implements Action {
  readonly type = DataShimActionTypes.ProjectSaveFailure;
  constructor(public payload: { err: any, isReload: boolean }) {}
}

export class ProjectLoad implements Action {
  readonly type = DataShimActionTypes.ProjectLoad;
  constructor(public payload: { projectId: number, isReload: boolean }) {}
}

export class ProjectLoadSuccess implements Action {
  readonly type = DataShimActionTypes.ProjectLoadSuccess;
  constructor(public payload: { projectId: number, isReload: boolean }) {}
}

export class ProjectLoadFailure implements Action {
  readonly type = DataShimActionTypes.ProjectLoadFailure;
  constructor(public payload: { err: any, isReload: boolean }) {}
}

export class CreateNewProject implements Action {
  readonly type = DataShimActionTypes.ProjectCreateNew;
}

export class CreateNewProjectComplete implements Action {
  readonly type = DataShimActionTypes.ProjectCreateNewComplete;
  constructor(public payload: { projectId: number }) {}
}

export class ExportGeofootprint implements Action {
  readonly type = DataShimActionTypes.ExportGeofootprint;
  constructor(public payload: { selectedOnly: boolean }) {}
}

export class ExportHGCIssuesLog implements Action {
  readonly type = DataShimActionTypes.ExportHGCIssuesLog;
  constructor(public payload: { locationType: SuccessfulLocationTypeCodes }) {}
}

export class ExportLocations implements Action {
  readonly type = DataShimActionTypes.ExportLocations;
  constructor(public payload: { locationType: SuccessfulLocationTypeCodes, isDigitalExport: boolean }) {}
}

export class ExportApioNationalData implements Action {
  readonly type = DataShimActionTypes.ExportApioNationalData;
}

export class FiltersChanged implements Action {
  readonly type = DataShimActionTypes.FiltersChanged;
  constructor(public payload: { filterChanged?: ProjectFilterChanged, filterFlag?: boolean }) {}
}

export class CalculateMetrics implements Action {
  readonly type = DataShimActionTypes.CalculateMetrics;
}

export class ProjectLoadFinish implements Action {
  readonly type = DataShimActionTypes.ProjectLoadFinish;
}

export class LayerSetupComplete implements Action {
  readonly type = DataShimActionTypes.LayerSetupComplete;
}

export class TradeAreaRollDownGeos implements Action {
  readonly type = DataShimActionTypes.TradeAreaRollDownGeos;
  constructor(public payload: { geos: string[], queryResult:  Map<string, {latitude: number, longitude: number}>,
                                fileAnalysisLevel: string, matchedTradeAreas: TradeAreaDefinition[]
                              }) {}
}

export type DataShimActions =
  ProjectSaveAndNew |
  ProjectSaveAndLoad |
  ProjectSaveAndReload |
  ProjectSaveSuccess |
  ProjectSaveFailure |
  ProjectLoad |
  ProjectLoadSuccess |
  ProjectLoadFailure |
  CreateNewProject |
  CreateNewProjectComplete |
  ExportGeofootprint |
  ExportLocations |
  ExportApioNationalData |
  ExportHGCIssuesLog |
  FiltersChanged |
  CalculateMetrics|
  IsProjectReload|
  ProjectLoadFinish |
  LayerSetupComplete |
  TradeAreaRollDownGeos;
