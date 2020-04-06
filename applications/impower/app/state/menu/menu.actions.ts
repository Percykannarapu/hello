import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { CrossBowSitesPayload } from '../app.interfaces';

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
  ClientNmaeForValassisDigitalDialog = '[Application Menu] Set Client Name for valassis Digital Dialog',
  CloseclientNmaeForValassisDigitalDialog = '[Application Menu] close Client Name for valassis Digital Dialog',

  OpenExportCrossbowSitesDialog = '[Application Menu] Open Export Crossbow Sites Dialog',
  CloseExportCrossbowSitesDialog = '[Application Menu] Close Export Crossbow Sites Dialog',
  OpenPrintViewDialog = '[Application Menu] Open Print View Dialog',
  ClosePrintViewDialog = '[Application Menu] Close Print View Dialog',

}
export enum PrintActionTypes{
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

export class OpenExportCrossbowSitesDialog implements Action {
  readonly type = MenuActionTypes.OpenExportCrossbowSitesDialog;
}

export class CloseExportCrossbowSitesDialog implements Action {
  readonly type = MenuActionTypes.CloseExportCrossbowSitesDialog;
}

export class OpenPrintViewDialog implements Action {
  readonly type = MenuActionTypes.OpenPrintViewDialog;
}

export class ClosePrintViewDialog implements Action {
  readonly type = MenuActionTypes.ClosePrintViewDialog;
}


export class PrintMapSuccess implements Action {
  readonly type = PrintActionTypes.PrintMapSuccess;
  constructor(public payload: { url: string }) {}
}

export class ClientNmaeForValassisDigitalDialog implements Action{
  readonly type = MenuActionTypes.ClientNmaeForValassisDigitalDialog;
}

export class CloseclientNmaeForValassisDigitalDialog implements Action{
  readonly type = MenuActionTypes.CloseclientNmaeForValassisDigitalDialog;
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
  OpenExportCrossbowSitesDialog |
  CloseExportCrossbowSitesDialog |
  OpenPrintViewDialog |
  ClosePrintViewDialog|
  ClientNmaeForValassisDigitalDialog|
  CloseclientNmaeForValassisDigitalDialog;


export type PrintActions = PrintMapSuccess;



 