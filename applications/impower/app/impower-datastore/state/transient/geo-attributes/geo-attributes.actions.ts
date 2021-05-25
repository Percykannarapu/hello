import { Update } from '@ngrx/entity';
import { Action } from '@ngrx/store';
import { GeoAttribute } from './geo-attributes.model';

export enum GeoAttributeActionTypes {
  GetLayerAttributes = '[GeoAttribute] Get Attributes',
  GetLayerAttributesComplete = '[GeoAttribute] Get Attribute Complete',
  GetLayerAttributesFailure = '[GeoAttribute] Get Attribute Failed',

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

export class GetLayerAttributes implements Action {
  readonly type = GeoAttributeActionTypes.GetLayerAttributes;
  constructor(public payload: { geocodes: Set<string> }) {}
}

export class GetLayerAttributesComplete implements Action {
  readonly type = GeoAttributeActionTypes.GetLayerAttributesComplete;
  constructor(public payload: { geoAttributes: GeoAttribute[] }) {}
}

export class GetLayerAttributesFailure implements Action {
  readonly type = GeoAttributeActionTypes.GetLayerAttributesFailure;
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
  | GetLayerAttributes
  | GetLayerAttributesComplete
  | GetLayerAttributesFailure
  | ProcessGeoAttributes;
