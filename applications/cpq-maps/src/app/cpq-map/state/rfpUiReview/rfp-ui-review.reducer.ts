import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { RfpUiReview } from '../../../val-modules/mediaexpress/models/RfpUiReview';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { RfpUiReviewActions, RfpUiReviewActionTypes } from './rfp-ui-review.actions';

export interface RfpUiReviewState extends EntityState<RfpUiReview> {
  // additional entities state properties
}

export const adapter: EntityAdapter<RfpUiReview> = createEntityAdapter<RfpUiReview>({
  sortComparer: false,
  selectId: model => model['@ref']
});

export const initialState: RfpUiReviewState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = RfpUiReviewActions | GetMediaPlanDataSucceeded;

export function rfpUiReviewreducer(state = initialState, action: reducerActions) : RfpUiReviewState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.rfpUiReviews != null) {
        return adapter.addAll(action.payload.normalizedEntities.rfpUiReviews, state);
      } else {
        return state;
      }
    }

    case RfpUiReviewActionTypes.AddRfpUiReview: {
      return adapter.addOne(action.payload.rfpUiReview, state);
    }

    case RfpUiReviewActionTypes.UpsertRfpUiReview: {
      return adapter.upsertOne(action.payload.rfpUiReview, state);
    }

    case RfpUiReviewActionTypes.AddRfpUiReviews: {
      return adapter.addMany(action.payload.rfpUiReviews, state);
    }

    case RfpUiReviewActionTypes.UpsertRfpUiReviews: {
      return adapter.upsertMany(action.payload.rfpUiReviews, state);
    }

    case RfpUiReviewActionTypes.UpdateRfpUiReview: {
      return adapter.updateOne(action.payload.rfpUiReview, state);
    }

    case RfpUiReviewActionTypes.UpdateRfpUiReviews: {
      return adapter.updateMany(action.payload.rfpUiReviews, state);
    }

    case RfpUiReviewActionTypes.DeleteRfpUiReview: {
      return adapter.removeOne(action.payload.id, state);
    }

    case RfpUiReviewActionTypes.DeleteRfpUiReviews: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case RfpUiReviewActionTypes.LoadRfpUiReviews: {
      return adapter.addAll(action.payload.rfpUiReviews, state);
    }

    case RfpUiReviewActionTypes.ClearRfpUiReviews: {
      return adapter.removeAll(state);
    }

    default: {
      return state;
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
