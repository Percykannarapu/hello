/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintLocAttrib
{
   public locAttributeId:              number;                        /// Primary Key
   public createUser:                  number;
   public createDate:                  Date;
   public modifyUser:                  number;
   public modifyDate:                  Date;
   public attributeCode:               string;
   public attributeType:               string;
   public attributeValue:              string;
   public formatMask:                  string;
   public isActive:                    number;                        /// Is Active

   // IMPOWER.IMP_GEOFOOTPRINT_LOC_ATTRIBS - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------------------
   public impGeofootprintLocation:     ImpGeofootprintLocation;       /// Geofootprint Locations table
   public impGeofootprintMaster:       ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public impProject:                  ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintLocAttrib | {} = {}) {
      Object.assign(this, data);
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
         ['impGeofootprintLocation',      'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}