import { Action } from '@ngrx/store';
import { TradeAreaDefinition } from 'app/services/app-trade-area.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { ProjectFilterChanged } from '../../common/models/ui-enums';

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
  ProjectSave = '[Application Data Shim] Project Save',

  ExportGeofootprint = '[Application Data Shim] Export Geofootprint',
  ExportHGCIssuesLog = '[Application Data Shim] Export ExportHGCIssuesLog',
  ExportLocations = '[Application Data Shim] Export Locations',
  ExportApioNationalData = '[Application Data Shim] Export National Online Data',

  FiltersChanged = '[Application Data Shim] Project Filters Changed',

  CalculateMetrics = '[Application Data Shim] Calculate Color box metrics',

  ProjectLoadFinish = '[Application Data Shim] Project Load Finish',

  LayerSetupComplete = '[Application Data Shim] Layer Setup Complete',

  TradeAreaRollDownGeos = '[Application Data Shim] TradeArea RollDown Geos',
  MustCoverRollDownGeos = '[Application Data Shim] MustCover RollDown Geos',
  RollDownGeosComplete = '[Application Data Shim] RollDown Geos Complete',

  ExportCustomTAIssuesLog = '[Application Data Shim] TA RollDown IssuesLog',
  ExportMCIssuesLog = '[Application Data Shim] MC RollDown IssuesLog',

  DeleteCustomTAGeos= '[Application Data Shim] Delete Custom Trade Areas Geos',
  DeleteMustCoverGeos= '[Application Data Shim] Delete Must Cover Geos',
  DeleteCustomData= '[Application Data Shim] Delete Custom Data Geos',
  DeleteCustomTAMustCoverGeosReset= '[Application Data Shim] Delete Custom Ta or Must Cover Geos flagreset',

}

export class ProjectSaveAndNew implements Action {
  readonly type = DataShimActionTypes.ProjectSaveAndNew;
}

export class ProjectSave implements Action {
  readonly type = DataShimActionTypes.ProjectSave;
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
  constructor(public payload: { projectId: number, isBatchMode?: boolean }) {
    payload.isBatchMode = payload.isBatchMode || false;
  }
}

export class ProjectLoadSuccess implements Action {
  readonly type = DataShimActionTypes.ProjectLoadSuccess;
  constructor(public payload: { projectId: number }) {}
}

export class ProjectLoadFailure implements Action {
  readonly type = DataShimActionTypes.ProjectLoadFailure;
  constructor(public payload: { err: any }) {}
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
                                fileAnalysisLevel: string, matchedTradeAreas: TradeAreaDefinition[], isResubmit: boolean,
                                siteType: SuccessfulLocationTypeCodes
                              }) {}
}

export class MustCoverRollDownGeos implements Action {
  readonly type = DataShimActionTypes.MustCoverRollDownGeos;
  constructor(public payload: { geos: string[], queryResult:  Map<string, {latitude: number, longitude: number}>,
              fileAnalysisLevel: string, fileName: string, uploadedGeos: any[], isResubmit: boolean}) {}
}

export class RollDownGeosComplete implements Action {
  readonly type = DataShimActionTypes.RollDownGeosComplete;
  constructor(public payload: {failedGeos: string[], isResubmit: boolean, rollDownType: string}){}
}

export class ExportCustomTAIssuesLog implements Action{
  readonly type = DataShimActionTypes.ExportCustomTAIssuesLog;
  constructor(public payload: {uploadFailures: TradeAreaDefinition[]}){}
}

export class ExportMCIssuesLog implements Action{
  readonly type = DataShimActionTypes.ExportMCIssuesLog;
  constructor(public payload: {uploadFailures: string[]}){}

}

export class DeleteCustomTAGeos implements Action{
  readonly type = DataShimActionTypes.DeleteCustomTAGeos;
  constructor(public payload: {deleteCustomTa: boolean}){}
}

export class DeleteMustCoverGeos implements Action{
  readonly type = DataShimActionTypes.DeleteMustCoverGeos;
  constructor(public payload: {deleteMustCover: boolean}){}
}

export class DeleteCustomData implements Action{
  readonly type = DataShimActionTypes.DeleteCustomData;
  constructor(public payload: {deleteCustomData: boolean}){}
}

export class DeleteCustomTAMustCoverGeosReset implements Action{
  readonly type = DataShimActionTypes.DeleteCustomTAMustCoverGeosReset;
  constructor(public payload: {resetFlag: boolean}){}

}

export type DataShimActions =
  ProjectSaveAndNew |
  ProjectSaveAndLoad |
  ProjectSave |
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
  ProjectLoadFinish |
  LayerSetupComplete |
  TradeAreaRollDownGeos|
  MustCoverRollDownGeos|
  RollDownGeosComplete|
  ExportCustomTAIssuesLog|
  ExportMCIssuesLog|
  DeleteCustomTAGeos| DeleteMustCoverGeos | DeleteCustomData |
  DeleteCustomTAMustCoverGeosReset;
