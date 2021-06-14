import { BaseModelPayload } from './base-model-payload';

export interface ImpGeofootprintLocAttribPayload extends BaseModelPayload {
   locAttributeId:  number;         /// Primary Key
   createUser:      number;
   createDate:      number;
   modifyUser:      number;
   modifyDate:      number;
   cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
   glId:            number;         /// Foreign key to imp_geofootprint_locations.gl_id
   projectId:       number;         /// Foreign key to imp_projects.project_id
   attributeCode:   string;
   attributeType:   string;
   attributeValue:  string;
   formatMask:      string;
   isActive:        boolean;        /// Is Active
}
