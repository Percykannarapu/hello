import { Update } from '@ngrx/entity';
import { Action } from '@ngrx/store';
import { GeoAttribute } from './geo-attributes.model';

export enum GeoAttributeActionTypes {
  RequestAttributes = '[GeoAttribute] Request Attributes',
  RequestAttributesComplete = '[GeoAttribute] Request Complete',
  RequestAttributesFailure = '[GeoAttribute] Request Failed',

  RehydrateAttributes = '[GeoAttribute] Rehydrate Attributes',
  RehydrateAttributesComplete = '[GeoAttribute] Rehydrate Complete',
  RehydrateAttributesFailure = '[GeoAttribute] Rehydrate Failed',

  LoadGeoAttributes = '[GeoAttribute] Load GeoAttributes',
  AddGeoAttribute = '[GeoAttribute] Add GeoAttribute',
  UpsertGeoAttribute = '[GeoAttribute] Upsert GeoAttribute',
  AddGeoAttributes = '[GeoAttribute] Add GeoAttributes',
  UpsertGeoAttributes = '[GeoAttribute] Upsert GeoAttributes',
  UpdateGeoAttribute = '[GeoAttribute] Update GeoAttribute',
  UpdateGeoAttributes = '[GeoAttribute] Update GeoAttributes',
  DeleteGeoAttribute = '[GeoAttribute] Delete GeoAttribute',
  DeleteGeoAttributes = '[GeoAttribute] Delete GeoAttributes',
  ClearGeoAttributes = '[GeoAttribute] Clear GeoAttributes',

  ProcessGeoAttributes = '[GeoAttribute] Process Geo Attributes'
}

export class RequestAttributes implements Action {
  readonly type = GeoAttributeActionTypes.RequestAttributes;
  constructor(public payload: { geocodes: Set<string> }) {}
}

export class RequestAttributesComplete implements Action {
    readonly type = GeoAttributeActionTypes.RequestAttributesComplete;
}

export class RequestAttributeFailure implements Action {
  readonly type = GeoAttributeActionTypes.RequestAttributesFailure;
  constructor(public payload: { err: any }) {}
}

export class RehydrateAttributes implements Action {
  readonly type = GeoAttributeActionTypes.RehydrateAttributes;
  constructor(public payload: { projectId: number, geocodes: Set<string> }) {}
}

export class RehydrateAttributesComplete implements Action {
  readonly type = GeoAttributeActionTypes.RehydrateAttributesComplete;
  constructor(public payload: { projectId: number }) {}
}

export class RehydrateAttributesFailure implements Action {
  readonly type = GeoAttributeActionTypes.RehydrateAttributesFailure;
  constructor(public payload: { err: any }) {}
}

export class LoadGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.LoadGeoAttributes;

  constructor(public payload: { geoAttributes: GeoAttribute[] }) {}
}

export class AddGeoAttribute implements Action {
  readonly type = GeoAttributeActionTypes.AddGeoAttribute;

  constructor(public payload: { geoAttribute: GeoAttribute }) {}
}

export class UpsertGeoAttribute implements Action {
  readonly type = GeoAttributeActionTypes.UpsertGeoAttribute;

  constructor(public payload: { geoAttribute: GeoAttribute }) {}
}

export class AddGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.AddGeoAttributes;

  constructor(public payload: { geoAttributes: GeoAttribute[] }) {}
}

export class UpsertGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.UpsertGeoAttributes;

  constructor(public payload: { geoAttributes: GeoAttribute[] }) {}
}

export class UpdateGeoAttribute implements Action {
  readonly type = GeoAttributeActionTypes.UpdateGeoAttribute;

  constructor(public payload: { geoAttribute: Update<GeoAttribute> }) {}
}

export class UpdateGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.UpdateGeoAttributes;

  constructor(public payload: { geoAttributes: Update<GeoAttribute>[] }) {}
}

export class DeleteGeoAttribute implements Action {
  readonly type = GeoAttributeActionTypes.DeleteGeoAttribute;

  constructor(public payload: { id: string }) {}
}

export class DeleteGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.DeleteGeoAttributes;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.ClearGeoAttributes;
}

export class ProcessGeoAttributes implements Action {
  readonly type = GeoAttributeActionTypes.ProcessGeoAttributes;
  constructor(public payload: { prepGeos?: boolean, applyFilters?: boolean }) {}
}

export type GeoAttributeActions =
 LoadGeoAttributes
  | AddGeoAttribute
  | UpsertGeoAttribute
  | AddGeoAttributes
  | UpsertGeoAttributes
  | UpdateGeoAttribute
  | UpdateGeoAttributes
  | DeleteGeoAttribute
  | DeleteGeoAttributes
  | ClearGeoAttributes
  | RequestAttributes
  | RequestAttributesComplete
  | RequestAttributeFailure
  | RehydrateAttributes
  | RehydrateAttributesFailure
  | RehydrateAttributesComplete
  | ProcessGeoAttributes;
