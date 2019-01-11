/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLANS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlanGroup } from './MediaPlanGroup';
import { AmProfile } from '../../targeting/models/AmProfile';
import { MediaPlanCommonMbu } from './MediaPlanCommonMbu';
import { MediaPlanLineDetail } from './MediaPlanLineDetail';
import { MediaPlanLine } from './MediaPlanLine';
import { CbxReport } from './CbxReport';
import { Goal } from './Goal';
import { Objective } from './Objective';
import { ProductAllocation } from './ProductAllocation';
import { TargetAudiencePref } from './TargetAudiencePref';

export class MediaPlan extends BaseModel
{
   public mediaPlanId:       number;            /// Primary key identifying a particular plan
   public createUser:        number;            /// User to create the row
   public createDate:        Date;              /// Date/Time row was created
   public modifyUser:        number;            /// User to modify the row
   public modifyDate:        Date;              /// Date/Time row was modified
   public amProfile:         AmProfile;         /// Profile ID
   public description:       string;            /// Description of the media plan
   public isActive:          boolean;           /// 1 = Active, 0 = InActive
   public cgmId:             number;            /// Foreign key to cbx_geofootprint_master.cgm_id
   public advertiserInfo:    AdvertiserInfo;    /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public isCurrent:         boolean;           /// 1 = Current plan for the fk_advertiser_info_id, 0 = Not Current
   public statusCode:        string;            /// Current status of the plan
   public purgedFlag:        string;            /// Logical purge flag
   public mediaPlanGroupId:  number;            /// Fk Media Plan Group Id
   public isPrimary:         boolean;           /// Flag to indicate if the mediaPlan is Primary

   public goal:              Goal;              /// Many to one relationship with CbxGoal

   public objective:         Objective;         /// Many to one relationship with CbxObjective

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public commonMbus:               Array<number> = new Array<number>();
   public lines:                    Array<number> = new Array<number>();
   public reports:                  Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------

   // ----------------------------------------------------------------------------
   // ADDITIONAL ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public productAllocations:       Array<number> = new Array<number>();
   public targetAudiencePrefs:      Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlanGroup:         MediaPlanGroup;              /// Cbx Media Plan Groups

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlan>) {
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
         ['mediaPlanId',             'number'],
         ['createUser',              'number'],
         ['createDate',              'Date'],
         ['modifyUser',              'number'],
         ['modifyDate',              'Date'],
         ['description',             'string'],
         ['isActive',                'boolean'],
         ['cgmId',                   'number'],
         ['isCurrent',               'boolean'],
         ['purgedFlag',              'string'],
         ['isPrimary',               'boolean']
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
         ['mediaPlanGroup',          'MediaPlanGroup'],
         ['status',                  'Status'],
         ['amProfile',               'AmProfile'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['mediaPlanGroup',          'MediaPlanGroup'],
         ['status',                  'Status'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['logTbl',                  'Array<LogTbl>'],
         ['mpCommonMediaOption',     'Array<MpCommonMediaOption>'],
         ['mpInputsTmp',             'Array<MpInputsTmp>'],
         ['output',                  'Array<Output>'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}