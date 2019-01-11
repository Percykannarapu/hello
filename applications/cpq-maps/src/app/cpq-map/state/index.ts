import * as fromEsri from '@val/esri';
import { SharedState } from './shared/shared.reducers';
import { AdvertiserInfoState } from './advertiserInfo/advertiser-info.reducer';
import { CbxReportState } from './cbxReport/cbx-report.reducer';
import { CbxReportTypeState } from './cbxReportType/cbx-report-type.reducer';
import { CbxReportParamState } from './cbxReportParam/cbx-report-param.reducer';
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
import { TargetAudienceState } from './targetAudience/target-audience.reducer';

export interface FullState extends LocalState, fromEsri.AppState {}

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
}