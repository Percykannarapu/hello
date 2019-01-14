import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlanGroup } from '../../../val-modules/mediaexpress/models/MediaPlanGroup';
import { MediaPlanGroupActions, MediaPlanGroupActionTypes } from './media-plan-group.actions';

export interface MediaPlanGroupState extends EntityState<MediaPlanGroup> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlanGroup> = createEntityAdapter<MediaPlanGroup>({
  sortComparer: false,
  selectId: model => model.mediaPlanGroupId
});

export const initialState: MediaPlanGroupState = adapter.getInitialState({
  // additional entity state properties
});

export function mediaPlanGroupReducer(state = initialState, action: MediaPlanGroupActions) : MediaPlanGroupState {
  switch (action.type) {
    case MediaPlanGroupActionTypes.AddMediaPlanGroup: {
      return adapter.addOne(action.payload.mediaPlanGroup, state);
    }

    case MediaPlanGroupActionTypes.UpsertMediaPlanGroup: {
      return adapter.upsertOne(action.payload.mediaPlanGroup, state);
    }

    case MediaPlanGroupActionTypes.AddMediaPlanGroups: {
      return adapter.addMany(action.payload.mediaPlanGroups, state);
    }

    case MediaPlanGroupActionTypes.UpsertMediaPlanGroups: {
      return adapter.upsertMany(action.payload.mediaPlanGroups, state);
    }

    case MediaPlanGroupActionTypes.UpdateMediaPlanGroup: {
      return adapter.updateOne(action.payload.mediaPlanGroup, state);
    }

    case MediaPlanGroupActionTypes.UpdateMediaPlanGroups: {
      return adapter.updateMany(action.payload.mediaPlanGroups, state);
    }

    case MediaPlanGroupActionTypes.DeleteMediaPlanGroup: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanGroupActionTypes.DeleteMediaPlanGroups: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanGroupActionTypes.LoadMediaPlanGroups: {
      return adapter.addAll(action.payload.mediaPlanGroups, state);
    }

    case MediaPlanGroupActionTypes.ClearMediaPlanGroups: {
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
