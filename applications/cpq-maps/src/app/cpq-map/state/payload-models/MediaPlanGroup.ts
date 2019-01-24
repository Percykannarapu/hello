/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLAN_GROUPS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { AdvertiserInfoPayload } from './AdvertiserInfo';
import { MediaPlanPayload } from './MediaPlan';

export interface MediaPlanGroupPayload extends BaseModelPayload
{
   mediaPlanGroupId:  number;         /// Media Plan Group Id
   createUser:        number;         /// Fk Create User
   createDate:        Date;           /// Create Date
   modifyUser:        number;         /// Fk Modify User
   modifyDate:        Date;           /// Modify Date
   groupName:         string;         /// Group Name
   sfdcRfpId:         string;         /// Sfdc Rfp Id
   isPerpetualCopy:   boolean;        /// Is Perpetual Copy
   isMultipleIhd:     boolean;        /// Is Multiple Ihds
   isSelected:        boolean;        /// Is Selected
   isActive:          boolean;        /// Is Active

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   advertiserInfos:      Array<AdvertiserInfoPayload>;
   mediaPlans:           Array<MediaPlanPayload>;
   // ----------------------------------------------------------------------------

}