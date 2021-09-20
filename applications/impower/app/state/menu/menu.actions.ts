import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';

export enum MenuActionTypes {
  SaveAndReloadProject = '[Application Menu] Save and Reload Project',
  SaveAndCreateNew = '[Application Menu Confirmation] Save Project and Create New',
  DiscardAndCreateNew = '[Application Menu Confirmation] Discard Project and Create New',

  SaveThenLoadProject = '[Application Menu] Save Then Load Project',
  DiscardThenLoadProject = '[Application Menu] Discard Then Load Project',

  ExportGeofootprint = '[Application Menu] Export Geofootprint',
  ExportLocations = '[Application Menu] Export Locations',
  ExportApioNationalData = '[Application Menu] Export Online Audience National Data',
  ExportToValassisDigital = '[Application Menu] Export Sites to Valassis Digital',
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

export type MenuActions =
  SaveAndReloadProject |
  SaveAndCreateNew |
  DiscardAndCreateNew |
  SaveThenLoadProject |
  DiscardThenLoadProject |
  ExportGeofootprint |
  ExportLocations |
  ExportApioNationalData |
  ExportToValassisDigital;




