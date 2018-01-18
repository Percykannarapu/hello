/** A TARGETING domain class representing the table: IMPOWER.IMP_PROJECT_PREFS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientPref } from '../../client/models/ImpClientPref';
import { ImpProject } from './ImpProject';

export class ImpProjectPref
{
   public projectPrefId:               number;                    /// Primary Key
   public createUser:                  number;
   public createDate:                  Date;
   public modifyUser:                  number;
   public modifyDate:                  Date;
   public clientIdentifierId:          number;
   public attributeCode:               string;
   public attributeType:               string;
   public attributeValue:              string;
   public isActive:                    number;

   // IMPOWER.IMP_PROJECT_PREFS - MANY TO ONE RELATIONSHIP MEMBERS
   // ------------------------------------------------------------
   public clientIdentifierTypeCode:    ClientIdentifierType;      /// Cbx Client Identifier Types
   public clientPrefId:                ImpClientPref;             /// Client Library Prefereneces
   public projectId:                   ImpProject;                /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpProjectPref | {} = {}) {
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
         ['projectPrefId',                'number'],
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
         ['clientIdentifierTypeCode',     'ClientIdentifierType'],
         ['clientPrefId',                 'ImpClientPref'],
         ['projectId',                    'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}