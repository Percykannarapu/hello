import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

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

  CalculateMetrics = '[Application Data Shim] Calculate Color box metrics'
}

export class ProjectSaveAndNew implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndNew;
}

export class ProjectSaveAndReload implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndReload;
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
}

export class CalculateMetrics implements Action {
  readonly type = DataShimActionTypes.CalculateMetrics;
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
  CalculateMetrics;
