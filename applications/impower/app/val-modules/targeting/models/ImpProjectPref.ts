/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_PROJECT_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ImpProject } from './ImpProject';

export class ImpProjectPref extends BaseModel
{
   public projectPrefId:  number;         /// Primary Key 
   public projectId:      number;         /// Foreign Key to IMP_PROJECTS
   public prefGroup:      string;         /// Identifier to load preferences as a group
   public prefType:       string;         /// The type of the preference, such as STRING, NUMBER
   public pref:           string;         /// The key code to identify the preference
   public val:            string;         /// The value of the preference. Must be less than 4kb
   public largeVal:       string;         /// For values larger than 4kb
   public isActive:       boolean;        /// 1 = Preference Active, 0 = Preference InActive
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:     ImpProject;          /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpProjectPref>) {
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
         ['projectPrefId',   'number'],
         ['prefGroup',       'string'],
         ['prefType',        'string'],
         ['pref',            'string'],
         ['val',             'string'],
         ['largeVal',        'string'],
         ['isActive',        'boolean']
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
         ['impProject',      'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['impProject',      'ImpProject'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}