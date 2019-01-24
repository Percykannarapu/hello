import { BaseModelPayload } from './base-model-payload';
import { ImpGeofootprintGeoPayload } from './imp-geofootprint-geo-payload';

export interface ImpGeofootprintTradeAreaPayload extends BaseModelPayload {
  gtaId:           number;         /// Primary key, uniquely identifying a trade areas row
  cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
  glId:            number;         /// Foreign key to imp_geofootprint_location.gl_id
  projectId:       number;
  taNumber:        number;         /// Trade area number
  taName:          string;         /// Trade area name
  taRadius:        number;         /// Trade area radius
  taMinHhc:        number;         /// Trade area minimum hhc
  taUseMinHhcInd:  number;         /// Use minimum hhc indicator
  taType:          string;         /// Trade area type (RADIUS, GEO_LIST, ...)
  taOverrideInd:   number;         /// Trade area override indicator
  isActive:        boolean;        /// Is Active

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
  impGeofootprintGeos:      Array<ImpGeofootprintGeoPayload>;
  // ----------------------------------------------------------------------------
}
