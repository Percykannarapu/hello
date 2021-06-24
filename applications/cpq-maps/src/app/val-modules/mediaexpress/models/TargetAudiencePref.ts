/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_TARGET_AUDIENCE_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';

export class TargetAudiencePref extends BaseModel
{
   public targetAudiencePrefId:  number;         /// Target Audience Pref Id
   public createUser:            number;         /// Fk Create User
   public createDate:            Date;           /// Create Date
   public modifyUser:            number;         /// Fk Modify User
   public modifyDate:            Date;           /// Modify Date
   public advertiserInfoId:      number;         /// Fk Advertiser Info Id
   public variableSortOrder:     string;         /// Variable Sort Order
   public filterOperationCode:   string;         /// Fk Filter Operation Cd
   public variableFilterValue:   string;         /// Variable Filter Value
   public isActive:              boolean;        /// Is Active
   public isTradeAreaLimited:    boolean;        /// Is Trade Area Limited
   public variableId:            number;         /// Fk Variable Id
   public variableName:          string;         /// Variable Name
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:         AdvertiserInfo;           /// Captures advertiser information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<TargetAudiencePref>) {
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

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['targetAudiencePrefId',    'number'],
         ['createUser',              'number'],
         ['createDate',              'Date'],
         ['modifyUser',              'number'],
         ['modifyDate',              'Date'],
         ['variableSortOrder',       'string'],
         ['variableFilterValue',     'string'],
         ['isActive',                'boolean'],
         ['isTradeAreaLimited',      'boolean'],
         ['variableId',              'number'],
         ['variableName',            'string']
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
         ['advertiserInfo',          'AdvertiserInfo'],
         ['filterOperation',         'FilterOperation'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',          'AdvertiserInfo'],
         ['filterOperation',         'FilterOperation'],
      ]);
   }
}
