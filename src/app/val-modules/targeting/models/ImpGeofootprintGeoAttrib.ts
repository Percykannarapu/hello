/** A TARGETING domain class representing the attributes for a given ImpGeofootprintGeo
 **/
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { transient, BaseModel } from '../../api/models/BaseModel';

export class ImpGeofootprintGeoAttrib extends BaseModel
{
   public geoAttributeId:              number;                        /// Primary Key
   public createUser:                  number;
   public createDate:                  Date;
   public modifyUser:                  number;
   public modifyDate:                  Date;
   public attributeCode:               string;
   public attributeType:               string;
   public attributeValue:              string;
   public formatMask:                  string;
   public isActive:                    boolean;

   // IMPOWER.IMP_GEOFOOTPRINT_GEO_ATTRIBS - MANY TO ONE RELATIONSHIP MEMBERS (NOTE TABLE DOESNT EXIST)
   // -----------------------------------------------------------------------
   @transient public impGeofootprintGeo:          ImpGeofootprintGeo;            /// Geofootprint Locations table
   @transient public impGeofootprintMaster:       ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   @transient public impProject:                  ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintGeoAttrib | {} = {}) {
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
         ['geoAttributeId',               'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['attributeCode',                'string'],
         ['attributeType',                'string'],
         ['attributeValue',               'string'],
         ['formatMask',                   'string'],
         ['isActive',                     'number']
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
         ['impGeofootprintGeo',      'ImpGeofootprintGeo'],
         ['impGeofootprintMaster',   'ImpGeofootprintMaster'],
         ['impProject',              'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
