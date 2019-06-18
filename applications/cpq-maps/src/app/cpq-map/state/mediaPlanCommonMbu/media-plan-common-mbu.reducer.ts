import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlanCommonMbu } from '../../../val-modules/mediaexpress/models/MediaPlanCommonMbu';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { MediaPlanCommonMbuActions, MediaPlanCommonMbuActionTypes } from './media-plan-common-mbu.actions';

export interface MediaPlanCommonMbuState extends EntityState<MediaPlanCommonMbu> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlanCommonMbu> = createEntityAdapter<MediaPlanCommonMbu>({
  sortComparer: false,
  selectId: model => model.commonMbuId
});

export const initialState: MediaPlanCommonMbuState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = MediaPlanCommonMbuActions | GetMediaPlanDataSucceeded;

export function mediaPlanCommonMbuReducer(state = initialState, action: reducerActions) : MediaPlanCommonMbuState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.commonMbus != null)
        return adapter.addAll(action.payload.normalizedEntities.commonMbus, state);
      else
        return state;
    }

    case MediaPlanCommonMbuActionTypes.AddMediaPlanCommonMbu: {
      return adapter.addOne(action.payload.mediaPlanCommonMbu, state);
    }

    case MediaPlanCommonMbuActionTypes.UpsertMediaPlanCommonMbu: {
      return adapter.upsertOne(action.payload.mediaPlanCommonMbu, state);
    }

    case MediaPlanCommonMbuActionTypes.AddMediaPlanCommonMbus: {
      return adapter.addMany(action.payload.mediaPlanCommonMbus, state);
    }

    case MediaPlanCommonMbuActionTypes.UpsertMediaPlanCommonMbus: {
      return adapter.upsertMany(action.payload.mediaPlanCommonMbus, state);
    }

    case MediaPlanCommonMbuActionTypes.UpdateMediaPlanCommonMbu: {
      return adapter.updateOne(action.payload.mediaPlanCommonMbu, state);
    }

    case MediaPlanCommonMbuActionTypes.UpdateMediaPlanCommonMbus: {
      return adapter.updateMany(action.payload.mediaPlanCommonMbus, state);
    }

    case MediaPlanCommonMbuActionTypes.DeleteMediaPlanCommonMbu: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanCommonMbuActionTypes.DeleteMediaPlanCommonMbus: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanCommonMbuActionTypes.LoadMediaPlanCommonMbus: {
      return adapter.addAll(action.payload.mediaPlanCommonMbus, state);
    }

    case MediaPlanCommonMbuActionTypes.ClearMediaPlanCommonMbus: {
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
