import { Action } from '@ngrx/store';
import { SuccessfulLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { ValGeocodingRequest } from '../../common/models/val-geocoding-request.model';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';


export enum HomeGeoActionTypes {
   Geocode = '[Application Geocode] Geocoding Request to Fuse',
   HomeGeocode = '[Application Geocode] HomeGeocode and PIP',
   PersistLocations = '[Application Geocode] Persist Geos to Datastore',
   ApplyTradeAreaOnEdit = '[Application Geocode] Apply TradeArea after Edit',
   ZoomtoLocations = '[Application Geocode] Zoom to Locations',
//   DetermineDTZHomeGeos = '[Application Geocode] Determine Digital ATZ',
   ProcessHomeGeoAttributes = '[Application Geocode] Flag Homegeo Attributes',
   ReCalcHomeGeos = '[Application Geocode] Re Calculate Homegeos',
   UpdateLocations = '[Application Geocode] Update existing Locations',
   ValidateEditedHomeGeoAttributes = '[Application Geocode] Validate Edited HomeGeo Attributes',
   SaveOnValidationSuccess = '[Aplication Geocode] Save On Validation Success',
   ForceHomeGeos = '[Aplication Geocode] Force Home Geo selection'
}

export class Geocode implements Action {
   readonly type = HomeGeoActionTypes.Geocode;
   constructor(public payload: {sites: ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes,
                                reCalculateHomeGeos: boolean, isLocationEdit: boolean} ){}
}

export class HomeGeocode implements Action {
   readonly type = HomeGeoActionTypes.HomeGeocode;
   constructor(public payload: {locations: ImpGeofootprintLocation[], isLocationEdit: boolean, reCalculateHomeGeos: boolean}){}
}

export class PersistLocations implements Action {
   readonly type = HomeGeoActionTypes.PersistLocations;
   constructor(public payload: {locations: ImpGeofootprintLocation[], reCalculateHomeGeos: boolean, isLocationEdit: boolean}){}
}

export class ReCalcHomeGeos implements Action {
  readonly type = HomeGeoActionTypes.ReCalcHomeGeos;
  constructor(public payload: {locations: ImpGeofootprintLocation[],
                               siteType: SuccessfulLocationTypeCodes,
                               reCalculateHomeGeos: boolean,
                               isLocationEdit: boolean} ){}
}

export class ApplyTradeAreaOnEdit implements Action {
   readonly type = HomeGeoActionTypes.ApplyTradeAreaOnEdit;
   constructor(public payload: {isLocationEdit: boolean, reCalculateHomeGeos: boolean}){}
}

export class ZoomtoLocations implements Action {
   readonly type = HomeGeoActionTypes.ZoomtoLocations;
   constructor(public payload: {locations: ImpGeofootprintLocation[]}){}
}

// export class DetermineDTZHomeGeos implements Action{
//    readonly type = HomeGeoActionTypes.DetermineDTZHomeGeos;
//    constructor(public payload: {attributes: any ,
//                                 locationsMap: Map<string, ImpGeofootprintLocation[]>,
//                                 isLocationEdit: boolean,
//                                 reCalculateHomeGeos: boolean,
//                                 totalLocs: ImpGeofootprintLocation[]}){}
// }

export class ProcessHomeGeoAttributes implements Action{
  readonly type = HomeGeoActionTypes.ProcessHomeGeoAttributes;
  constructor(public payload: {attributes: any, totalLocs: ImpGeofootprintLocation[], isLocationEdit: boolean, reCalculateHomeGeos: boolean}){}
}

export class UpdateLocations implements Action {
  readonly type = HomeGeoActionTypes.UpdateLocations;
  constructor(public payload: {locations: ImpGeofootprintLocation[]}){}
}

export class ValidateEditedHomeGeoAttributes implements Action {
   readonly type = HomeGeoActionTypes.ValidateEditedHomeGeoAttributes;
   constructor(public payload: {oldData: any, siteOrSites: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, editedTags: string[], attributeList: any}){}
}

export class SaveOnValidationSuccess implements Action {
   readonly type = HomeGeoActionTypes.SaveOnValidationSuccess;
   constructor(public payload: {oldData: any, editedTags: string[], attributeList: any}){}
}

export class ForceHomeGeos implements Action {
   readonly type = HomeGeoActionTypes.ForceHomeGeos;
   constructor(public payload: {isForceHomeGeo: boolean}){}
}

export type HomeGeoActions = Geocode |
                             HomeGeocode |
                             PersistLocations |
                             ApplyTradeAreaOnEdit |
                            // DetermineDTZHomeGeos |
                             ProcessHomeGeoAttributes|
                             UpdateLocations |
                             ReCalcHomeGeos |
                             ZoomtoLocations |
                             ValidateEditedHomeGeoAttributes |
                             SaveOnValidationSuccess|
                             ForceHomeGeos;
