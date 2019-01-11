import { BaseModelState } from './base-model-state';
import { ImpGeofootprintLocAttribPayload } from '../../payload-models/imp-geofootprint-loc-attrib-payload';

export class ImpGeofootprintLocAttribState extends BaseModelState {
  public locAttributeId:  number;         /// Primary Key
  public createUser:      number;
  public createDate:      Date;
  public modifyUser:      number;
  public modifyDate:      Date;
  public cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
  public glId:            number;         /// Foreign key to imp_geofootprint_locations.gl_id
  public projectId:       number;         /// Foreign key to imp_projects.project_id
  public attributeCode:   string;
  public attributeType:   string;
  public attributeValue:  string;
  public formatMask:      string;
  public isActive:        boolean;        /// Is Active

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpGeofootprintLocAttribPayload>) {
    super(data);
  }
}
