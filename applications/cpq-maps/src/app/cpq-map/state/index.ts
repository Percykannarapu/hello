import * as fromEsri from '@val/esri';
import * as fromMessaging from '@val/messaging';
import { AdvertiserInfoState } from './advertiserInfo/advertiser-info.reducer';
import { ShadingState } from './shading/shading.reducer';
import { CbxReportState } from './cbxReport/cbx-report.reducer';
import { CbxReportParamState } from './cbxReportParam/cbx-report-param.reducer';
import { CbxReportTypeState } from './cbxReportType/cbx-report-type.reducer';
import { GoalState } from './goal/goal.reducer';
import { MediaPlanState } from './mediaPlan/media-plan.reducer';
import { MediaPlanCommonMbuState } from './mediaPlanCommonMbu/media-plan-common-mbu.reducer';
import { MediaPlanGroupState } from './mediaPlanGroup/media-plan-group.reducer';
import { MediaPlanLineState } from './mediaPlanLine/media-plan-line.reducer';
import { MediaPlanLineDetailState } from './mediaPlanLineDetail/media-plan-line-detail.reducer';
import { MpCommonVersionState } from './mpCommonVersion/mp-common-version.reducer';
import { ObjectiveState } from './objective/objective.reducer';
import { PpToWrapPageState } from './ppToWrapPage/pp-to-wrap-page.reducer';
import { ProductAllocationState } from './productAllocation/product-allocation.reducer';
import { RfpUiEditState } from './rfpUiEdit/rfp-ui-edit.reducer';
import { RfpUiEditDetailState } from './rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import { RfpUiEditWrapState } from './rfpUiEditWrap/rfp-ui-edit-wrap.reducer';
import { RfpUiReviewState } from './rfpUiReview/rfp-ui-review.reducer';
import { SharedState } from './shared/shared.reducers';
import { TargetAudienceState } from './targetAudience/target-audience.reducer';
import { MediaPlanPrefState } from './mediaPlanPref/media-plan-pref.reducer';

export interface FullState extends LocalState, fromEsri.AppState, fromMessaging.AppState {}

export interface LocalState {
   shared: SharedState;
   advertiserInfo: AdvertiserInfoState;
   cbxReport: CbxReportState;
   cbxReportParam: CbxReportParamState;
   cbxReportType: CbxReportTypeState;
   goal: GoalState;
   mediaPlan: MediaPlanState;
   mediaPlanCommonMbu: MediaPlanCommonMbuState;
   mediaPlanGroup: MediaPlanGroupState;
   mediaPlanLine: MediaPlanLineState;
   mediaPlanLineDetail: MediaPlanLineDetailState;
   mpCommonVersion: MpCommonVersionState;
   objective: ObjectiveState;
   ppTtoWrapPage: PpToWrapPageState;
   productAllocation: ProductAllocationState;
   targetAudience: TargetAudienceState;
   rfpUiEditDetail: RfpUiEditDetailState;
   rfpUiReview: RfpUiReviewState;
   rfpUiEdit: RfpUiEditState;
   rfpUiEditWrap: RfpUiEditWrapState;
   shading: ShadingState;
   mediaPlanPref: MediaPlanPrefState;
}

