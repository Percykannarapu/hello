import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

export enum MenuActionTypes {
  SaveAndReloadProject = '[Application Menu] Save and Reload Project',
  SaveAndCreateNew = '[Application Menu Confirmation] Save Project and Create New',
  DiscardAndCreateNew = '[Application Menu Confirmation] Discard Project and Create New',

  OpenExistingProjectDialog = '[Application Menu] Open Existing Project Dialog',
  CloseExistingProjectDialog = '[Application Menu] Close Existing Project Dialog',

  ExportGeofootprint = '[Application Menu] Export Geofootprint',
  ExportLocations = '[Application Menu] Export Locations',
  ExportApioNationalData = '[Application Menu] Export Online Audience National Data',
  ExportToValassisDigital = '[Application Menu] Export Sites to Valassis Digital'
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

export type MenuActions =
  SaveAndReloadProject |
  SaveAndCreateNew |
  DiscardAndCreateNew |
  OpenExistingProjectDialog |
  CloseExistingProjectDialog |
  ExportGeofootprint |
  ExportLocations |
  ExportApioNationalData |
  ExportToValassisDigital;
