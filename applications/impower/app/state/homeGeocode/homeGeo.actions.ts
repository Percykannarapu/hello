import { Action } from '@ngrx/store';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';



export enum HomeGeoActionTypes {
   Geocode = '[Application Geocode] Geocoding Request to Fuse',
   HomeGeocode = '[Application Geocode] HomeGeocode and PIP',
   PersistLocations = '[Application Geocode] Persist Geos to Datastore',
   ZoomtoLocations = '[Application Geocode] Zoom to Locations',
   DetermineDTZHomeGeos = '[Application Geocode] Determine Digital ATZ',
   ProcessHomeGeoAttributes = '[Application Geocode] Flag Homegeo Attributes',
  // ReCalcHomeGeos = '[Application Geocode] Re Calculate Homegeos',
   UpdateLocations = '[Application Geocode] Update existing Locations', 
}

export class Geocode implements Action {
   readonly type = HomeGeoActionTypes.Geocode;
   constructor(public payload: {sites: ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, 
                                reCalculateHomeGeos: boolean, isLocationEdit: boolean} ){}
}

export class HomeGeocode implements Action {
   readonly type = HomeGeoActionTypes.HomeGeocode;
   constructor(public payload: {locations: ImpGeofootprintLocation[]}){}
}

export class PersistLocations implements Action {
   readonly type = HomeGeoActionTypes.PersistLocations;
   constructor(public payload: {locations: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){}
}

export class ZoomtoLocations implements Action {
   readonly type = HomeGeoActionTypes.ZoomtoLocations;
   constructor(public payload: {locations: ImpGeofootprintLocation[]}){}
}

export class DetermineDTZHomeGeos implements Action{
   readonly type = HomeGeoActionTypes.DetermineDTZHomeGeos;
   //, locationsMap: Map<string, ImpGeofootprintLocation[]>
   constructor(public payload: {attributes: any , locationsMap: Map<string, ImpGeofootprintLocation[]>}){}
}

export class ProcessHomeGeoAttributes implements Action{
  readonly type = HomeGeoActionTypes.ProcessHomeGeoAttributes;
  constructor(public payload: {attributes: any}){}
}

export class UpdateLocations implements Action {
  readonly type = HomeGeoActionTypes.UpdateLocations;
  constructor(public payload: {locations: ImpGeofootprintLocation[]}){}
}

export type HomeGeoActions = Geocode | 
                             HomeGeocode | 
                             PersistLocations |
                             DetermineDTZHomeGeos |
                             ProcessHomeGeoAttributes|
                             UpdateLocations |
                             ZoomtoLocations;