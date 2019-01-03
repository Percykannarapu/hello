import { Action } from '@ngrx/store';
import { TransientVarDefinition } from '../models/transient-var-definition';

export enum TransientActionTypes {
  LoadTransients = '[Transient Entities] Load Transients',

  AddTransientDefinition = '[Transient Entities] Add Definition',
  DeleteTransientDefinitions = '[Transient Entities] Delete Definitions',
  ClearTransientDefinitions = '[Transient Entities] Clear Definitions',

  AddTransientGeoData = '[Transient Entities] Add Geo Data',
  DeleteTransientGeoData = '[Transient Entities] Delete Geo Data',
  ClearTransientGeoData = '[Transient Entities] Clear Geo Data',
}

export class LoadTransients implements Action {
  readonly type = TransientActionTypes.LoadTransients;
}

export class AddTransientDefinition implements Action {
  readonly type = TransientActionTypes.AddTransientDefinition;
  constructor(public payload: { definition: TransientVarDefinition }) {}
}

export class DeleteTransientDefinitions implements Action {
  readonly type = TransientActionTypes.DeleteTransientDefinitions;
  constructor(public payload: { definitionPks: number[] }) {}
}

export class ClearTransientDefinitions implements Action {
  readonly type = TransientActionTypes.ClearTransientDefinitions;
}

export class AddTransientGeoData<T extends string | number> implements Action {
  readonly type = TransientActionTypes.AddTransientGeoData;
  constructor(public payload: { definitionPk: number, data: { [geocode: string] : T } }) {}
}

export class DeleteTransientGeoData implements Action {
  readonly type = TransientActionTypes.DeleteTransientGeoData;
  constructor(public payload: { geocodes: string[] }) {}
}

export class ClearTransientGeoData implements Action {
  readonly type = TransientActionTypes.ClearTransientGeoData;
}

export type TransientActions =
  LoadTransients
  | AddTransientDefinition
  | DeleteTransientDefinitions
  | ClearTransientDefinitions
  | AddTransientGeoData<string>
  | AddTransientGeoData<number>
  | DeleteTransientGeoData
  | ClearTransientGeoData;
