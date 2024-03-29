/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_PROJECT_PREFS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, transient } from '../../api/models/BaseModel';
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

   public getVal() : string {
     return this.val == null ? this.largeVal : this.val;
   }

   public setVal(value: string) : void {
     // if (value != null && value.length <= 4000) {
     //   this.val = value;
     //   this.largeVal = null;
     // } else {
       this.val = null;
       this.largeVal = value;
     // }
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
      if (this.val != null) {
        this.largeVal = this.val;
        this.val = null;
      }
      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }
}
