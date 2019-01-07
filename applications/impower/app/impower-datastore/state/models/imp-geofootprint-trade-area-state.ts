import { BaseModelState, parseStatus } from './base-model-state';
import { ImpGeofootprintTradeAreaPayload } from '../../payload-models/imp-geofootprint-trade-area-payload';

export class ImpGeofootprintTradeAreaState extends BaseModelState {
  public gtaId:           number;         /// Primary key, uniquely identifying a trade areas row
  public cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
  public glId:            number;         /// Foreign key to imp_geofootprint_location.gl_id
  public projectId:       number;
  public taNumber:        number;         /// Trade area number
  public taName:          string;         /// Trade area name
  public taRadius:        number;         /// Trade area radius
  public taMinHhc:        number;         /// Trade area minimum hhc
  public taUseMinHhcInd:  number;         /// Use minimum hhc indicator
  public taType:          string;         /// Trade area type (RADIUS, GEO_LIST, ...)
  public taOverrideInd:   number;         /// Trade area override indicator
  public isActive:        boolean;        /// Is Active

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
  public impGeofootprintGeos:      Array<number> = [];
  // ----------------------------------------------------------------------------

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpGeofootprintTradeAreaPayload>) {
    super();
    const baseStatus = { baseStatus: parseStatus(data.baseStatus) };
    const relationships = {
      impGeofootprintGeos: (data.impGeofootprintGeos || []).map(g => g.ggId),
    };
    Object.assign(this, data, baseStatus, relationships);
  }
}
