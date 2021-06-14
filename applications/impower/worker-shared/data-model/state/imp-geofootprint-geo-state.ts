import { ImpGeofootprintGeoPayload } from '../payloads/imp-geofootprint-geo-payload';
import { BaseModelState } from './base-model-state';

export class ImpGeofootprintGeoState extends BaseModelState {
  public ggId:          number;         /// Primary key uniquely identifying a geofootprint row
  public cgmId:         number;         /// Foreign key to imp_geofootprint_master.cgm_id
  public glId:          number;         /// Foreign key to imp_geofootprint_locations.gl_id
  public gtaId:         number;         /// Foreign key to imp_geofootprint_trade_areas.gta_id
  public projectId:     number;         /// The IMPower Project ID
  public geocode:       string;         /// The geography
  public geoSortOrder:  number;         /// Geography sort order
  public hhc:           number;         /// Household count
  public xcoord:        number;         /// x_coord is longitude
  public ycoord:        number;         /// y_coord is latitude
  public distance:      number;         /// Geocodes distance to the location
  public isActive:      boolean;

  // ----------------------------------
  // TRANSITORY MEMBERS (NOT PERSISTED)
  // ----------------------------------
  public isDeduped:     number;         /// 1 = deduped, 0 = not deduped
  public rank:          number;         /// Rank used to calculate dupes

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpGeofootprintGeoPayload>) {
    super(data);
  }
}
