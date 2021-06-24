/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLAN_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { MediaPlan } from './MediaPlan';

export class MediaPlanPref extends BaseModel
{
   public prefId:       number;         /// Primary Key
   public mediaPlanId:  number;         /// Foreign Key to CBX_MEDIA_PLANS
   public prefGroup:    string;         /// Identifier to load preferences as a group
   public prefType:     string;         /// The type of the preference, such as STRING, NUMBER
   public pref:         string;         /// The key code to identify the preference
   public val:          string;         /// The value of the preference. Must be less than 4kb
   public largeVal:     string;         /// For values larger than 4kb
   public isActive:     boolean;        /// 1 = Preference Active, 0 = Preference InActive
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlan:       MediaPlan;          /// Media plans for an advertiser info id / profile


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanPref>) {
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
         ['prefId',           'number'],
         ['prefGroup',        'string'],
         ['prefType',         'string'],
         ['pref',             'string'],
         ['val',              'string'],
         ['largeVal',         'string'],
         ['isActive',         'boolean']
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
         ['mediaPlan',        'MediaPlan'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['mediaPlan',        'MediaPlan'],
      ]);
   }
}
