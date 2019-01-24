import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlanLineDetail } from '../../../val-modules/mediaexpress/models/MediaPlanLineDetail';
import { MediaPlanLineDetailActions, MediaPlanLineDetailActionTypes } from './media-plan-line-detail.actions';

export interface MediaPlanLineDetailState extends EntityState<MediaPlanLineDetail> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlanLineDetail> = createEntityAdapter<MediaPlanLineDetail>({
  sortComparer: false,
  selectId: model => model.mbuDtlId
});

export const initialState: MediaPlanLineDetailState = adapter.getInitialState({
  // additional entity state properties
});

export function mediaPlanLineDetailReducer(state = initialState, action: MediaPlanLineDetailActions) : MediaPlanLineDetailState {
  switch (action.type) {
    case MediaPlanLineDetailActionTypes.AddMediaPlanLineDetail: {
      return adapter.addOne(action.payload.mediaPlanLineDetail, state);
    }

    case MediaPlanLineDetailActionTypes.UpsertMediaPlanLineDetail: {
      return adapter.upsertOne(action.payload.mediaPlanLineDetail, state);
    }

    case MediaPlanLineDetailActionTypes.AddMediaPlanLineDetails: {
      return adapter.addMany(action.payload.mediaPlanLineDetails, state);
    }

    case MediaPlanLineDetailActionTypes.UpsertMediaPlanLineDetails: {
      return adapter.upsertMany(action.payload.mediaPlanLineDetails, state);
    }

    case MediaPlanLineDetailActionTypes.UpdateMediaPlanLineDetail: {
      return adapter.updateOne(action.payload.mediaPlanLineDetail, state);
    }

    case MediaPlanLineDetailActionTypes.UpdateMediaPlanLineDetails: {
      return adapter.updateMany(action.payload.mediaPlanLineDetails, state);
    }

    case MediaPlanLineDetailActionTypes.DeleteMediaPlanLineDetail: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanLineDetailActionTypes.DeleteMediaPlanLineDetails: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanLineDetailActionTypes.LoadMediaPlanLineDetails: {
      return adapter.addAll(action.payload.mediaPlanLineDetails, state);
    }

    case MediaPlanLineDetailActionTypes.ClearMediaPlanLineDetails: {
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
