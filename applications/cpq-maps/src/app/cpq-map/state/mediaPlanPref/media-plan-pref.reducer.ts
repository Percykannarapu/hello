import { MediaPlanPref } from '../../../val-modules/mediaexpress/models/MediaPlanPref';
import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlanPrefActions, MediaPlanPrefActionTypes } from './media-plan-pref.actions';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';




export interface MediaPlanPrefState extends EntityState<MediaPlanPref> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlanPref> = createEntityAdapter<MediaPlanPref>({
  sortComparer: false,
  selectId: model => model.prefId
});

export const initialState: MediaPlanPrefState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = MediaPlanPrefActions | GetMediaPlanDataSucceeded;

export function mediaPlanPrefReducer(state = initialState, action: reducerActions) : MediaPlanPrefState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.mediaPlanPrefs != null)
        return adapter.addMany(action.payload.normalizedEntities.mediaPlanPrefs, state);
      else
        return state;
    }

    case MediaPlanPrefActionTypes.AddMediaPlanPref: {
      return adapter.addOne(action.payload.mediaPlanPref, state);
    }

    case MediaPlanPrefActionTypes.UpsertMediaPlanPref: {
      return adapter.upsertOne(action.payload.mediaPlanPref, state);
    }

    case MediaPlanPrefActionTypes.AddMediaPlanPrefs: {
      return adapter.addMany(action.payload.mediaPlanPrefs, state);
    }

    case MediaPlanPrefActionTypes.UpsertMediaPlanPrefs: {
      return adapter.upsertMany(action.payload.mediaPlanPrefs, state);
    }

    case MediaPlanPrefActionTypes.UpdateMediaPlanPref: {
      return adapter.updateOne(action.payload.mediaPlanPref, state);
    }

    case MediaPlanPrefActionTypes.UpdateMediaPlanPrefs: {
      return adapter.updateMany(action.payload.mediaPlanPrefs, state);
    }

    case MediaPlanPrefActionTypes.DeleteMediaPlanPref: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanPrefActionTypes.DeleteMediaPlanPrefs: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanPrefActionTypes.LoadMediaPlanPrefs: {
      return adapter.addAll(action.payload.mediaPlanPrefs, state);
    }

    case MediaPlanPrefActionTypes.ClearMediaPlanPrefs: {
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