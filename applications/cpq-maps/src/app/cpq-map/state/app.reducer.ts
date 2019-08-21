import {
  Action,
  ActionReducer,
  ActionReducerMap,
  MetaReducer
} from '@ngrx/store';
import { environment } from '../../../environments/environment';
import { LocalState } from './';
import { shadingReducer } from './shading/shading.reducer';
import { sharedReducer } from './shared/shared.reducers';
import { advertiserInfoReducer } from './advertiserInfo/advertiser-info.reducer';
import { cbxReportReducer } from './cbxReport/cbx-report.reducer';
import { cbxReportParamReducer } from './cbxReportParam/cbx-report-param.reducer';
import { cbxReportTypeReducer } from './cbxReportType/cbx-report-type.reducer';
import { goalReducer } from './goal/goal.reducer';
import { mediaPlanReducer } from './mediaPlan/media-plan.reducer';
import { mediaPlanCommonMbuReducer } from './mediaPlanCommonMbu/media-plan-common-mbu.reducer';
import { mediaPlanGroupReducer } from './mediaPlanGroup/media-plan-group.reducer';
import { mediaPlanLineReducer } from './mediaPlanLine/media-plan-line.reducer';
import { mediaPlanLineDetailReducer } from './mediaPlanLineDetail/media-plan-line-detail.reducer';
import { mpCommonVersionReducer } from './mpCommonVersion/mp-common-version.reducer';
import { objectiveReducer } from './objective/objective.reducer';
import { ppToWrapPageReducer } from './ppToWrapPage/pp-to-wrap-page.reducer';
import { productAllocationReducer } from './productAllocation/product-allocation.reducer';
import { targetAudienceReducer } from './targetAudience/target-audience.reducer';
import { rfpUiEditDetailreducer } from './rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import { rfpUiReviewreducer } from './rfpUiReview/rfp-ui-review.reducer';
import { rfpUiEditreducer } from './rfpUiEdit/rfp-ui-edit.reducer';
import { rfpUiEditWrapReducer } from './rfpUiEditWrap/rfp-ui-edit-wrap.reducer';
import { mediaPlanPrefReducer } from './mediaPlanPref/media-plan-pref.reducer';

export const reducers: ActionReducerMap<LocalState> = {
  shared: sharedReducer,
  advertiserInfo: advertiserInfoReducer,
  cbxReport: cbxReportReducer,
  cbxReportParam: cbxReportParamReducer,
  cbxReportType: cbxReportTypeReducer,
  goal: goalReducer,
  mediaPlan: mediaPlanReducer,
  mediaPlanCommonMbu: mediaPlanCommonMbuReducer,
  mediaPlanGroup: mediaPlanGroupReducer,
  mediaPlanLine: mediaPlanLineReducer,
  mediaPlanLineDetail: mediaPlanLineDetailReducer,
  mpCommonVersion: mpCommonVersionReducer,
  objective: objectiveReducer,
  ppTtoWrapPage: ppToWrapPageReducer,
  productAllocation: productAllocationReducer,
  targetAudience: targetAudienceReducer,
  rfpUiEditDetail: rfpUiEditDetailreducer,
  rfpUiReview: rfpUiReviewreducer,
  rfpUiEdit: rfpUiEditreducer,
  rfpUiEditWrap: rfpUiEditWrapReducer,
  shading: shadingReducer,
  mediaPlanPref: mediaPlanPrefReducer
};

export function logger(reducer: ActionReducer<LocalState>) : ActionReducer<LocalState> {
  return function(state: LocalState, action: Action) : LocalState {
    console.groupCollapsed(action.type);
    const nextState = reducer(state, action);
    console.log('%c prev state', 'color: #9E9E9E', state);
    console.log('%c action', 'color: #03A9F4', action);
    console.log('%c next state', 'color: #4CAF50', nextState);
    console.groupEnd();
    return nextState;
  };
}

export const metaReducers: MetaReducer<LocalState>[] = !environment.production ? [logger] : [];
