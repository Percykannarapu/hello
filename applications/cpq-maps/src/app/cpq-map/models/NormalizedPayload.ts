import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { MediaPlanCommonMbu } from '../../val-modules/mediaexpress/models/MediaPlanCommonMbu';
import { MediaPlanLine } from '../../val-modules/mediaexpress/models/MediaPlanLine';
import { CbxReport } from '../../val-modules/mediaexpress/models/CbxReport';
import { ProductAllocation } from '../../val-modules/mediaexpress/models/ProductAllocation';
import { TargetAudiencePref } from '../../val-modules/mediaexpress/models/TargetAudiencePref';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { AdvertiserInfo } from '../../val-modules/mediaexpress/models/AdvertiserInfo';
import { Objective } from '../../val-modules/mediaexpress/models/Objective';
import { RfpUiEdit } from '../../val-modules/mediaexpress/models/RfpUiEdit';

export interface NormalizedPayload {
   mediaPlanGroup?: MediaPlanGroup;
   mediaPlans?: MediaPlan[];
   //targetingProfiles: 
   advertiserInfos?: AdvertiserInfo[];
   objectives?: Objective[];
   commonMbus?: MediaPlanCommonMbu[];
   lines?: MediaPlanLine[];
   reports?: CbxReport[];
   productAllocations?: ProductAllocation[];
   targetAudiencePrefs?: TargetAudiencePref[];
   rfpUiReviews?: RfpUiReview[];
   rfpUiEditDetails?: RfpUiEditDetail[];
   rfpUiEdits?: RfpUiEdit[];
 }