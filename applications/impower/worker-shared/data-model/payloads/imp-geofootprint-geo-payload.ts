import { BaseModelPayload } from './base-model-payload';

export interface ImpGeofootprintGeoPayload extends BaseModelPayload {
  ggId:          number;         /// Primary key uniquely identifying a geofootprint row
  cgmId:         number;         /// Foreign key to imp_geofootprint_master.cgm_id
  glId:          number;         /// Foreign key to imp_geofootprint_locations.gl_id
  gtaId:         number;         /// Foreign key to imp_geofootprint_trade_areas.gta_id
  projectId:     number;         /// The IMPower Project ID
  geocode:       string;         /// The geography
  geoSortOrder:  number;         /// Geography sort order
  hhc:           number;         /// Household count
  xcoord:        number;         /// x_coord is longitude
  ycoord:        number;         /// y_coord is latitude
  distance:      number;         /// Geocodes distance to the location
  isActive:      boolean;

  isDeduped:     number;         /// TODO: figure out if this really belongs here
}
