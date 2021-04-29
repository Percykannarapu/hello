import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlan } from '../../../val-modules/mediaexpress/models/MediaPlan';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { MediaPlanActions, MediaPlanActionTypes } from './media-plan.actions';

export interface MediaPlanState extends EntityState<MediaPlan> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlan> = createEntityAdapter<MediaPlan>({
  sortComparer: false,
  selectId: model => model.mediaPlanId
});

export const initialState: MediaPlanState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = MediaPlanActions | GetMediaPlanDataSucceeded;

export function mediaPlanReducer(state = initialState, action: reducerActions) : MediaPlanState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.mediaPlans != null)
        return adapter.setAll(action.payload.normalizedEntities.mediaPlans, state);
      else
        return state;
    }

    case MediaPlanActionTypes.AddMediaPlan: {
      return adapter.addOne(action.payload.mediaPlan, state);
    }

    case MediaPlanActionTypes.UpsertMediaPlan: {
      return adapter.upsertOne(action.payload.mediaPlan, state);
    }

    case MediaPlanActionTypes.AddMediaPlans: {
      return adapter.addMany(action.payload.mediaPlans, state);
    }

    case MediaPlanActionTypes.UpsertMediaPlans: {
      return adapter.upsertMany(action.payload.mediaPlans, state);
    }

    case MediaPlanActionTypes.UpdateMediaPlan: {
      return adapter.updateOne(action.payload.mediaPlan, state);
    }

    case MediaPlanActionTypes.UpdateMediaPlans: {
      return adapter.updateMany(action.payload.mediaPlans, state);
    }

    case MediaPlanActionTypes.DeleteMediaPlan: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanActionTypes.DeleteMediaPlans: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanActionTypes.LoadMediaPlans: {
      return adapter.setAll(action.payload.mediaPlans, state);
    }

    case MediaPlanActionTypes.ClearMediaPlans: {
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
