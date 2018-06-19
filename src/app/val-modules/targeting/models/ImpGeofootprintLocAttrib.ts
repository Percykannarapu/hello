/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS
 **
 ** Generated from VAL_BASE_GEN - v1.04
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintLocAttrib extends BaseModel
{
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

   // Convert JSON objects into Models
   public convertToModel()
   {
   }

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['locAttributeId',               'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['attributeCode',                'string'],
         ['attributeType',                'string'],
         ['attributeValue',               'string'],
         ['formatMask',                   'string'],
         ['isActive',                     'boolean']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getRelationships () : Map<string, string>
   {
      return new Map([
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['impGeofootprintLocation',      'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['impGeofootprintLocation',      'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}
