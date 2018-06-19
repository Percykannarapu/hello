/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_PROJECT_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.04
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientPref } from '../../client/models/ImpClientPref';
import { ImpProject } from './ImpProject';

export class ImpProjectPref extends BaseModel
{
   public projectPrefId:             number;         /// Primary Key
   public createUser:                number;
   public createDate:                Date;
   public modifyUser:                number;
   public modifyDate:                Date;
   public clientPrefId:              number;
   public projectId:                 number;
   public clientIdentifierTypeCode:  string;
   public clientIdentifierId:        number;
   public attributeCode:             string;
   public attributeType:             string;
   public attributeValue:            string;
   public isActive:                  boolean;
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public clientIdentifierType:        ClientIdentifierType;          /// Cbx Client Identifier Types

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impClientPref:               ImpClientPref;                 /// Client Library Preferences

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                  ImpProject;                    /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpProjectPref>) {
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
         ['projectPrefId',                'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['clientIdentifierId',           'number'],
         ['attributeCode',                'string'],
         ['attributeType',                'string'],
         ['attributeValue',               'string'],
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
         ['clientIdentifierType',         'ClientIdentifierType'],
         ['impClientPref',                'ImpClientPref'],
         ['impProject',                   'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['clientIdentifierType',         'ClientIdentifierType'],
         ['impClientPref',                'ImpClientPref'],
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
