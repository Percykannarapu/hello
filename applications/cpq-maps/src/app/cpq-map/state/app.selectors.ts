import { createSelector } from '@ngrx/store';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { LocalState } from './index';
import { SharedState } from './shared/shared.reducers';
import * as fromRfpUiEditDetail from './rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import * as fromMediaPlan from './mediaPlan/media-plan.reducer';
import * as fromRfpUiReview from './rfpUiReview/rfp-ui-review.reducer';

const cpqSlice = (state: LocalState) => state;

const getSharedState = createSelector(cpqSlice, state => state.shared);
const getRfpUiEditDetailState = createSelector(cpqSlice, state => state.rfpUiEditDetail);
const getMediaPlanState = createSelector(cpqSlice, state => state.mediaPlan);
const getRfpUiReviewState = createSelector(cpqSlice, state => state.rfpUiReview);

const getRfpUiEditDetailEntities = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectAll);
const getMediaPlanEntities = createSelector(getMediaPlanState, fromMediaPlan.selectAll);
const getRfpUiReviewEntities = createSelector(getRfpUiReviewState, fromRfpUiReview.selectAll);

const getAppReady = createSelector(getSharedState, state => state.appReady);
const getSelectedAnalysisLevel = createSelector(getSharedState, state => state.analysisLevel);

const headerProjector = (sharedState: SharedState, mediaPlans: MediaPlan[], rfpUiReviews: RfpUiReview[]) => {
  const mediaPlan = mediaPlans.filter(mp => mp.mediaPlanId === sharedState.activeMediaPlanId)[0];
  if (mediaPlan == null || rfpUiReviews.length === 0) return null;

  const targetingProfile = mediaPlan['targetingProfile'];
  const rfpNumber = targetingProfile == null ? null : targetingProfile['clientId'];
  const rfpName = targetingProfile == null ? null : targetingProfile['name'];
  const productName = rfpUiReviews[0].sfdcProductName;

  return {
    mediaPlanId: sharedState.activeMediaPlanId,
    rfpNumber,
    rfpName,
    productName
  };
};

const getHeaderInfo = createSelector(getSharedState, getMediaPlanEntities, getRfpUiReviewEntities, headerProjector);

export const localSelectors = {
  getAppReady,
  getHeaderInfo,
  getRfpUiEditDetailEntities
};
