/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLANS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { AdvertiserInfoPayload } from './AdvertiserInfo';
import { AmProfilePayload } from './AmProfile';
import { MediaPlanCommonMbuPayload } from './MediaPlanCommonMbu';
import { MediaPlanLinePayload } from './MediaPlanLine';
import { CbxReportPayload } from './CbxReport';
import { GoalPayload } from './Goal';
import { ObjectivePayload } from './Objective';
import { ProductAllocationPayload } from './ProductAllocation';
import { TargetAudiencePrefPayload } from './TargetAudiencePref';

export interface MediaPlanPayload extends BaseModelPayload
{
   mediaPlanId:       number;            /// Primary key identifying a particular plan
   createUser:        number;            /// User to create the row
   createDate:        Date;              /// Date/Time row was created
   modifyUser:        number;            /// User to modify the row
   modifyDate:        Date;              /// Date/Time row was modified
   amProfile:         AmProfilePayload;         /// Profile ID
   description:       string;            /// Description of the media plan
   isActive:          boolean;           /// 1 = Active, 0 = InActive
   cgmId:             number;            /// Foreign key to cbx_geofootprint_master.cgm_id
   advertiserInfo:    AdvertiserInfoPayload;    /// Foreign key to cbx_advertiser_info.advertiser_info_id
   isCurrent:         boolean;           /// 1 = Current plan for the fk_advertiser_info_id, 0 = Not Current
   statusCode:        string;            /// Current status of the plan
   purgedFlag:        string;            /// Logical purge flag
   mediaPlanGroupId:  number;            /// Fk Media Plan Group Id
   isPrimary:         boolean;           /// Flag to indicate if the mediaPlan is Primary

   goal:              GoalPayload;              /// Many to one relationship with CbxGoal

   objective:         ObjectivePayload;         /// Many to one relationship with CbxObjective

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   commonMbus:               Array<MediaPlanCommonMbuPayload>;
   lines:                    Array<MediaPlanLinePayload>;
   reports:                  Array<CbxReportPayload>;
   // ----------------------------------------------------------------------------

   // ----------------------------------------------------------------------------
   // ADDITIONAL ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   productAllocations:       Array<ProductAllocationPayload>;
   targetAudiencePrefs:      Array<TargetAudiencePrefPayload>;
   // ----------------------------------------------------------------------------

   
}