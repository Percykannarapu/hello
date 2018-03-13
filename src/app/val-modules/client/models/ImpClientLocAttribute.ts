/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_LOC_ATTRIBUTES
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpClientLocation } from './ImpClientLocation';

export class ImpClientLocAttribute
{
   public clientLocAttributeId:   number;                     /// Primary Key
   public createUser:             number;
   public createDate:             Date;
   public modifyUser:             number;
   public modifyDate:             Date;
   public attributeCode:          string;
   public attributeType:          string;
   public attributeValue:         string;
   public formatMask:             string;
   public isActive:               number;

   // IMPOWER.IMP_CLIENT_LOC_ATTRIBUTES - MANY TO ONE RELATIONSHIP MEMBERS
   // --------------------------------------------------------------------
   public impClientLocation:      ImpClientLocation;          /// Client Library Repository of Client Locations

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClientLocAttribute>) {
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
         ['clientLocAttributeId',    'number'],
         ['createUser',              'number'],
         ['createDate',              'Date'],
         ['modifyUser',              'number'],
         ['modifyDate',              'Date'],
         ['attributeCode',           'string'],
         ['attributeType',           'string'],
         ['attributeValue',          'string'],
         ['formatMask',              'string'],
         ['isActive',                'number']
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
         ['impClientLocation',       'ImpClientLocation']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}