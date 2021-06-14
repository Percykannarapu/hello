/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, transient } from '../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintLocAttrib extends BaseModel
{
   public locAttributeId:  number;         /// Primary Key
   public createUser:      number;
   public createDate:      number;
   public modifyUser:      number;
   public modifyDate:      number;
   public cgmId:           number;         /// Foreign key to imp_geofootprint_master.cgm_id
   public glId:            number;         /// Foreign key to imp_geofootprint_locations.gl_id
   public projectId:       number;         /// Foreign key to imp_projects.project_id
   public attributeCode:   string;
   public attributeType:   string;
   public attributeValue:  string;
   public formatMask:      string;
   public isActive:        boolean;        /// Is Active
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintLocation:     ImpGeofootprintLocation;          /// Geofootprint Locations table

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintMaster:       ImpGeofootprintMaster;            /// Geofootprint master table for IMPower.

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                  ImpProject;                       /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintLocAttrib>) {
      super();
      Object.assign(this, data);
   }

   // Set tree property and push it down the hierarchy
   public setTreeProperty(propName: string, propValue: any)
   {
      if (!this.hasOwnProperty(propName)) {
         Object.defineProperty(this, propName, {
            enumerable: false,
            configurable: true,
            writable: true
         });
      }
      this[propName] = propValue;
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
   }

   // Convert JSON objects into Models
   public convertToModel()
   {

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }
}
