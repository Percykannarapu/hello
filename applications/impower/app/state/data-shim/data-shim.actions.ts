import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';

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
  constructor(public payload: { err: any }) {}
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

// note: passing currentProject like this is an anti-pattern for ngrx, but we're doing it as a transitional stop-gap until it's in the Store
export class ExportGeofootprint implements Action {
  readonly type = DataShimActionTypes.ExportGeofootprint;
  constructor(public payload: { selectedOnly: boolean, currentProject: ImpProject }) {}
}

export class ExportHGCIssuesLog implements Action {
  readonly type = DataShimActionTypes.ExportHGCIssuesLog;
  constructor(public payload: {locationType: SuccessfulLocationTypeCodes}) {}
}

// note: passing currentProject like this is an anti-pattern for ngrx, but we're doing it as a transitional stop-gap until it's in the Store
export class ExportLocations implements Action {
  readonly type = DataShimActionTypes.ExportLocations;
  constructor(public payload: { locationType: SuccessfulLocationTypeCodes, currentProject: ImpProject, isDigitalExport: boolean }) {}
}

// note: passing currentProject like this is an anti-pattern for ngrx, but we're doing it as a transitional stop-gap until it's in the Store
export class ExportApioNationalData implements Action {
  readonly type = DataShimActionTypes.ExportApioNationalData;
  constructor(public payload: { currentProject: ImpProject }) {}
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
  ExportHGCIssuesLog ;
