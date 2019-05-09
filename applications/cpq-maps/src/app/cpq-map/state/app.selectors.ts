import { createSelector } from '@ngrx/store';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { LocalState } from './index';
import { SharedState } from './shared/shared.reducers';
import * as fromRfpUiEditDetail from './rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import * as fromMediaPlan from './mediaPlan/media-plan.reducer';
import * as fromRfpUiReview from './rfpUiReview/rfp-ui-review.reducer';
import * as fromMediaPlanGroup from './mediaPlanGroup/media-plan-group.reducer';
import * as fromRfpUiEdit from './rfpUiEdit/rfp-ui-edit.reducer';

const cpqSlice = (state: LocalState) => state;

const getSharedState = createSelector(cpqSlice, state => state.shared);
const getRfpUiEditDetailState = createSelector(cpqSlice, state => state.rfpUiEditDetail);
const getMediaPlanState = createSelector(cpqSlice, state => state.mediaPlan);
const getMediaPlanGroupState = createSelector(cpqSlice, state => state.mediaPlanGroup);
const getRfpUiReviewState = createSelector(cpqSlice, state => state.rfpUiReview);
const getRfpUiEditState = createSelector(cpqSlice, state => state.rfpUiEdit);
const getShadingData = createSelector(cpqSlice, state => state.shared.shadingData);
const getShadingType = createSelector(getSharedState, state => state.shadingType);
const getRfpUiEditEntities = createSelector(getRfpUiEditState, fromRfpUiEdit.selectAll);
const getRfpUiEditDetailEntities = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectAll);
const getRfpUiEditDetailEntity = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectEntities);
const getMediaPlanEntities = createSelector(getMediaPlanState, fromMediaPlan.selectAll);
const getMediaPlanGropuEntities = createSelector(getMediaPlanGroupState, fromMediaPlanGroup.selectAll);
const getRfpUiReviewEntities = createSelector(getRfpUiReviewState, fromRfpUiReview.selectAll);

const getAppReady = createSelector(getSharedState, state => state.appReady);
const getIsSaving = createSelector(getSharedState, state => state.isSaving);
const getUpdateIds = createSelector(getSharedState, state => state.editedLineItemIds);
const getAddIds = createSelector(getSharedState, state => state.newLineItemIds);
const getSelectedAnalysisLevel = createSelector(getSharedState, state => state.analysisLevel);

const headerProjector = (sharedState: SharedState, mediaPlans: MediaPlan[], rfpUiReviews: RfpUiReview[], mpGroups: MediaPlanGroup[]) => {
  const mediaPlan = mediaPlans.filter(mp => mp.mediaPlanId === sharedState.activeMediaPlanId)[0];
  if (mediaPlan == null || rfpUiReviews.length === 0 || mpGroups.length === 0) return null;

  const targetingProfile = mediaPlan['targetingProfile'];
  const rfpNumber = targetingProfile == null ? null : targetingProfile['clientId'];
  const rfpName = targetingProfile == null ? null : targetingProfile['name'];
  const productName = sharedState.isWrap ? 'SM Wrap' : rfpUiReviews[0].sfdcProductName;
  const rfpId = mpGroups[0].sfdcRfpId;

  return {
    mediaPlanId: sharedState.activeMediaPlanId,
    rfpNumber,
    rfpName,
    productName,
    mediaPlanGroup: mediaPlan.mediaPlanGroupId,
    rfpId,
    updateIds: sharedState.editedLineItemIds,
    addIds: sharedState.newLineItemIds
  };
};

const getHeaderInfo = createSelector(getSharedState, getMediaPlanEntities, getRfpUiReviewEntities, getMediaPlanGropuEntities, headerProjector);

export const localSelectors = {
  getAppReady,
  getIsSaving,
  getUpdateIds,
  getAddIds,
  getHeaderInfo,
  getRfpUiEditDetailEntities,
  getRfpUiEditDetailEntity,
  getSharedState,
  getRfpUiEditEntities,
  getShadingData,
  getShadingType
};
