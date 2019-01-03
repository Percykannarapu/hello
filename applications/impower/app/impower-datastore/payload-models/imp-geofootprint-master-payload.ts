import { BaseModelPayload } from './base-model-payload';
import { ImpGeofootprintLocationPayload } from './imp-geofootprint-location-payload';

export interface ImpGeofootprintMasterPayload extends BaseModelPayload {
   cgmId:                number;         /// Primary key identifying the current run for the profile.
   projectId:            number;         /// The IMPower Project ID
   summaryInd:           number;         /// 1 = Summary, 0 = Not summary
   allowDuplicate:       number;         /// Indicator for allowing duplicate geos
   createdDate:          Date;           /// Date/Time row was created
   status:               string;         /// Indicates success or failure of geofootprint creation
   methAnalysis:         string;         /// Method analysis level. ZIP or ATZ
   methSeason:           string;         /// Season
   activeLocationCount:  number;         /// Total number of active location
   totalLocationCount:   number;         /// Total number of location
   isMarketBased:        boolean;        /// 1 = Market based, 2 = Store based
   isActive:             boolean;        /// Is Active

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
   impGeofootprintLocations:      Array<ImpGeofootprintLocationPayload>;
  // ----------------------------------------------------------------------------
}
