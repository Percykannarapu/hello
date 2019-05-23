import { createSelector } from '@ngrx/store';
import { MediaPlan } from '../../val-modules/mediaexpress/models/MediaPlan';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';
import { LocalState } from './index';
import { SharedState } from './shared/shared.reducers';
import * as fromRfpUiEditDetail from './rfpUiEditDetail/rfp-ui-edit-detail.reducer';
import * as fromRfpUiEditWrap from './rfpUiEditWrap/rfp-ui-edit-wrap.reducer';
import * as fromMediaPlan from './mediaPlan/media-plan.reducer';
import * as fromRfpUiReview from './rfpUiReview/rfp-ui-review.reducer';
import * as fromMediaPlanGroup from './mediaPlanGroup/media-plan-group.reducer';
import * as fromRfpUiEdit from './rfpUiEdit/rfp-ui-edit.reducer';
import * as fromAdvertiserInfo from './advertiserInfo/advertiser-info.reducer';
import { RfpUiEditDetail } from 'src/app/val-modules/mediaexpress/models/RfpUiEditDetail';
import { FullPayload } from './app.interfaces';
import { AdvertiserInfo } from 'src/app/val-modules/mediaexpress/models/AdvertiserInfo';

const cpqSlice = (state: LocalState) => state;

const getSharedState = createSelector(cpqSlice, state => state.shared);
const getRfpUiEditDetailState = createSelector(cpqSlice, state => state.rfpUiEditDetail);
const getMediaPlanState = createSelector(cpqSlice, state => state.mediaPlan);
const getMediaPlanGroupState = createSelector(cpqSlice, state => state.mediaPlanGroup);
const getRfpUiReviewState = createSelector(cpqSlice, state => state.rfpUiReview);
const getRfpUiEditState = createSelector(cpqSlice, state => state.rfpUiEdit);
const getAdvertiserInfoState = createSelector(cpqSlice, state => state.advertiserInfo);
const getRfpUiEditWrapState = createSelector(cpqSlice, state => state.rfpUiEditWrap);
const getShadingData = createSelector(cpqSlice, state => state.shared.shadingData);
const getShadingType = createSelector(getSharedState, state => state.shadingType);
const getRfpUiEditEntities = createSelector(getRfpUiEditState, fromRfpUiEdit.selectAll);
const getRfpUiEditDetailEntities = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectAll);
const getRfpUiEditDetailEntity = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectEntities);
const getRfpUiEditDetailIds = createSelector(getRfpUiEditDetailState, fromRfpUiEditDetail.selectIds);
const getRfpUiEditWrapEntities = createSelector(getRfpUiEditWrapState, fromRfpUiEditWrap.selectAll);
const getMediaPlanEntities = createSelector(getMediaPlanState, fromMediaPlan.selectAll);
const getMediaPlanGroupEntities = createSelector(getMediaPlanGroupState, fromMediaPlanGroup.selectAll);
const getRfpUiReviewEntities = createSelector(getRfpUiReviewState, fromRfpUiReview.selectAll);
const getAdvertiserInfoEntities = createSelector(getAdvertiserInfoState, fromAdvertiserInfo.selectAll);

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
const getHeaderInfo = createSelector(getSharedState, getMediaPlanEntities, getRfpUiReviewEntities, getMediaPlanGroupEntities, headerProjector);


const buildParams = (shared: SharedState, rfpUiEditDetail: RfpUiEditDetail[], mediaPlans: MediaPlan[], advertiserInfo: AdvertiserInfo[]) : Partial<FullPayload> => {
  const mediaPlan = mediaPlans.filter(mp => mp.mediaPlanId === shared.activeMediaPlanId)[0];
  if (mediaPlan == null || rfpUiEditDetail.length === 0 || advertiserInfo == null) return null;

  const targetingProfile = mediaPlan['targetingProfile'];
  const rfpNumber = targetingProfile == null ? null : targetingProfile['clientId'];
  const productName = shared.isWrap ? 'Wrap' : 'SMI';
  const mpId = shared.activeMediaPlanId;
  const mpGroupId = mediaPlan['mediaPlanGroupId'];
  let tradeArea: string;
  const clientName = advertiserInfo[0].clientIdentifierName;
  const fileName = productName + '_Map_' + rfpNumber + '_MP-' + mpId + '_G-' + mpGroupId + '_';
  
  tradeArea = (shared.radius !== 0 ? (Number(shared.threshold) !== 0 ? 'Radius Miles: ' + shared.radius + ' or Threshold (per site): ' + Number(shared.threshold).toLocaleString() : 'Radius Miles: ' + shared.radius) 
                      : (Number(shared.threshold) !== 0 ? 'Threshold (per site): ' + Number(shared.threshold).toLocaleString() : 'Custom')); 

  return{
      clientName: clientName,
      radius: shared.radius,
      mediaPlanId: mpId, 
      rfpNumber: rfpNumber,
      reportName: fileName,
      tradeArea: tradeArea,
  };

};

const getPrintParams = createSelector(getSharedState, getRfpUiEditDetailEntities, getMediaPlanEntities, getAdvertiserInfoEntities, buildParams);

const availabilityProjector = (shared: SharedState, rfpUiEditDetails: RfpUiEditDetail[], rfpUiReview: RfpUiReview[]) => {
  const allInHomeDates = rfpUiEditDetails.reduce((p, c) => {
    if (c.ihDate != null) p.push(c.ihDate.valueOf());
    return p;
  }, []);
  const fromDate = new Date(Math.min(...allInHomeDates));
  const toDate = new Date(Math.max(...allInHomeDates));
  const fromWeek = shared.promoDateFrom;
  const toWeek = shared.promoDateTo;
  const productCode = rfpUiReview != null && rfpUiReview.length > 0 ? rfpUiReview[0].productCd : '';
  return {
    productCode,
    fromDate,
    toDate,
    fromWeek,
    toWeek
  };
};

const getAvailabilityParams = createSelector(getSharedState, getRfpUiEditDetailEntities, getRfpUiReviewEntities, availabilityProjector);

export const localSelectors = {
  getAppReady,
  getIsSaving,
  getUpdateIds,
  getAddIds,
  getHeaderInfo,
  getRfpUiEditDetailEntities,
  getRfpUiEditDetailEntity,
  getRfpUiEditDetailIds,
  getSharedState,
  getRfpUiEditEntities,
  getRfpUiEditWrapEntities,
  getRfpUiReviewEntities,
  getShadingData,
  getShadingType,
  getPrintParams,
  getAvailabilityParams
};
