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
   public advertiserInfos:      Array<number> = new Array<number>();
   public mediaPlans:           Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlanGroup>) {
      super();
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