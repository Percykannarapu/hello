/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLAN_GROUPS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlan } from './MediaPlan';

export class MediaPlanGroup extends BaseModel
{
   public mediaPlanGroupId:  number;         /// Media Plan Group Id
   public createUser:        number;         /// Fk Create User
   public createDate:        Date;           /// Create Date
   public modifyUser:        number;         /// Fk Modify User
   public modifyDate:        Date;           /// Modify Date
   public groupName:         string;         /// Group Name
   public sfdcRfpId:         string;         /// Sfdc Rfp Id
   public isPerpetualCopy:   boolean;        /// Is Perpetual Copy
   public isMultipleIhd:     boolean;        /// Is Multiple Ihds
   public isSelected:        boolean;        /// Is Selected
   public isActive:          boolean;        /// Is Active

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public advertiserInfos:      Array<AdvertiserInfo> = new Array<AdvertiserInfo>();
   public mediaPlans:           Array<MediaPlan> = new Array<MediaPlan>();
   // ----------------------------------------------------------------------------


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanGroup>) {
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
      // Ask the children to set the tree property
      this.advertiserInfos.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.mediaPlans.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.advertiserInfos.forEach(fe => fe.removeTreeProperty(propName   ));
      this.mediaPlans.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.advertiserInfos = (this.advertiserInfos||[]).map(ma => new AdvertiserInfo(ma));
      this.mediaPlans = (this.mediaPlans||[]).map(ma => new MediaPlan(ma));

      // Push this as transient parent to children
      this.advertiserInfos.forEach(fe => fe.mediaPlanGroup = this);
      this.mediaPlans.forEach(fe => fe.mediaPlanGroup = this);

      // Ask the children to convert into models
      this.advertiserInfos.forEach(fe => fe.convertToModel());
      this.mediaPlans.forEach(fe => fe.convertToModel());

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
         ['mediaPlanGroupId',    'number'],
         ['createUser',          'number'],
         ['createDate',          'Date'],
         ['modifyUser',          'number'],
         ['modifyDate',          'Date'],
         ['groupName',           'string'],
         ['sfdcRfpId',           'string'],
         ['isPerpetualCopy',     'boolean'],
         ['isMultipleIhd',       'boolean'],
         ['isSelected',          'boolean'],
         ['isActive',            'boolean']
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
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}