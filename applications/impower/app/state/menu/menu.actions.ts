import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

export enum MenuActionTypes {
  SaveAndReloadProject = '[Application Menu] Save and Reload Project',
  SaveAndCreateNew = '[Application Menu Confirmation] Save Project and Create New',
  DiscardAndCreateNew = '[Application Menu Confirmation] Discard Project and Create New',

  OpenExistingProjectDialog = '[Application Menu] Open Existing Project Dialog',
  CloseExistingProjectDialog = '[Application Menu] Close Existing Project Dialog',
  SaveThenLoadProject = '[Application Menu] Save Then Load Project',
  DiscardThenLoadProject = '[Application Menu] Discard Then Load Project',

  ExportGeofootprint = '[Application Menu] Export Geofootprint',
  ExportLocations = '[Application Menu] Export Locations',
  ExportApioNationalData = '[Application Menu] Export Online Audience National Data',
  ExportToValassisDigital = '[Application Menu] Export Sites to Valassis Digital',
  
  OpenPrintViewDialog = '[Application Menu] Open Print View Dialog',
  ClosePrintViewDialog = '[Application Menu] Close Print View Dialog',

}
export enum PrintActionTypes{
  PrintMapFailure = '[Print Map] Print Map Failed',
  PrintMapSuccess = '[Print Map] Print Map Succeeded',
}

export class SaveAndReloadProject implements Action {
  readonly type = MenuActionTypes.SaveAndReloadProject;
}

export class SaveAndCreateNew implements Action {
  readonly type = MenuActionTypes.SaveAndCreateNew;
}

export class DiscardAndCreateNew implements Action {
  readonly type = MenuActionTypes.DiscardAndCreateNew;
}

export class OpenExistingProjectDialog implements Action {
  readonly type = MenuActionTypes.OpenExistingProjectDialog;
}

export class CloseExistingProjectDialog implements Action {
  readonly type = MenuActionTypes.CloseExistingProjectDialog;
}

export class SaveThenLoadProject implements Action {
  readonly type = MenuActionTypes.SaveThenLoadProject;
  constructor(public payload: { projectToLoad: number }) {}
}

export class DiscardThenLoadProject implements Action {
  readonly type = MenuActionTypes.DiscardThenLoadProject;
  constructor(public payload: { projectToLoad: number }) {}
}

export class ExportGeofootprint implements Action {
  readonly type = MenuActionTypes.ExportGeofootprint;
  constructor(public payload: { selectedOnly: boolean }) {}
}

export class ExportLocations implements Action {
  readonly type = MenuActionTypes.ExportLocations;
  constructor(public payload: { locationType: SuccessfulLocationTypeCodes }) {}
}

export class ExportApioNationalData implements Action {
  readonly type = MenuActionTypes.ExportApioNationalData;
}

export class ExportToValassisDigital implements Action {
  readonly type = MenuActionTypes.ExportToValassisDigital;
}

export class OpenPrintViewDialog implements Action {
  readonly type = MenuActionTypes.OpenPrintViewDialog;
}

export class ClosePrintViewDialog implements Action {
  readonly type = MenuActionTypes.ClosePrintViewDialog;
}

export class PrintMapFailure implements Action {
  readonly type = PrintActionTypes.PrintMapFailure;
  constructor(public payload: { err: any }) {}
}

export class PrintMapSuccess implements Action {
  readonly type = PrintActionTypes.PrintMapSuccess;
  constructor(public payload: { url: string }) {}
}



export type MenuActions =
  SaveAndReloadProject |
  SaveAndCreateNew |
  DiscardAndCreateNew |
  OpenExistingProjectDialog |
  CloseExistingProjectDialog |
  SaveThenLoadProject |
  DiscardThenLoadProject |
  ExportGeofootprint |
  ExportLocations |
  ExportApioNationalData |
  ExportToValassisDigital |
  OpenPrintViewDialog |
  ClosePrintViewDialog;


export type PrintActions = PrintMapSuccess |
                           PrintMapFailure;



 