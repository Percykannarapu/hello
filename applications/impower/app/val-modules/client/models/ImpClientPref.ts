/** A CLIENT domain class representing the table: IMPOWER.IMP_CLIENT_PREFS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';

export class ImpClientPref
{
   public clientPrefId:                number;                    /// Primary Key
   public createUser:                  number;
   public createDate:                  Date;
   public modifyUser:                  number;
   public modifyDate:                  Date;
   public clientIdentifierId:          number;
   public attributeCode:               string;
   public attributeType:               string;
   public attributeValue:              string;
   public isActive:                    number;

   // IMPOWER.IMP_CLIENT_PREFS - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------
   public clientIdentifierType:        ClientIdentifierType;      /// Cbx Client Identifier Types

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpClientPref>) {
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
         ['clientPrefId',                 'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['clientIdentifierId',           'number'],
         ['attributeCode',                'string'],
         ['attributeType',                'string'],
         ['attributeValue',               'string'],
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
         ['clientIdentifierType',         'ClientIdentifierType']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}
