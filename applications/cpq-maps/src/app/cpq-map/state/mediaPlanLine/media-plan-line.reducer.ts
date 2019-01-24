import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MediaPlanLine } from '../../../val-modules/mediaexpress/models/MediaPlanLine';
import { MediaPlanLineActions, MediaPlanLineActionTypes } from './media-plan-line.actions';
import { SharedActions, SharedActionTypes } from '../shared/shared.actions';

export interface MediaPlanLineState extends EntityState<MediaPlanLine> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MediaPlanLine> = createEntityAdapter<MediaPlanLine>({
  sortComparer: false,
  selectId: model => model.mbuHdrId
});

export const initialState: MediaPlanLineState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = MediaPlanLineActions | SharedActions;

export function mediaPlanLineReducer(state = initialState, action: reducerActions) : MediaPlanLineState {
  switch (action.type) {
    case SharedActionTypes.LoadEntityGraph: {
      if (action.payload.normalizedEntities.lines != null)
        return adapter.addAll(action.payload.normalizedEntities.lines, state);
      else
        return state;
    }

    case MediaPlanLineActionTypes.AddMediaPlanLine: {
      return adapter.addOne(action.payload.mediaPlanLine, state);
    }

    case MediaPlanLineActionTypes.UpsertMediaPlanLine: {
      return adapter.upsertOne(action.payload.mediaPlanLine, state);
    }

    case MediaPlanLineActionTypes.AddMediaPlanLines: {
      return adapter.addMany(action.payload.mediaPlanLines, state);
    }

    case MediaPlanLineActionTypes.UpsertMediaPlanLines: {
      return adapter.upsertMany(action.payload.mediaPlanLines, state);
    }

    case MediaPlanLineActionTypes.UpdateMediaPlanLine: {
      return adapter.updateOne(action.payload.mediaPlanLine, state);
    }

    case MediaPlanLineActionTypes.UpdateMediaPlanLines: {
      return adapter.updateMany(action.payload.mediaPlanLines, state);
    }

    case MediaPlanLineActionTypes.DeleteMediaPlanLine: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MediaPlanLineActionTypes.DeleteMediaPlanLines: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MediaPlanLineActionTypes.LoadMediaPlanLines: {
      return adapter.addAll(action.payload.mediaPlanLines, state);
    }

    case MediaPlanLineActionTypes.ClearMediaPlanLines: {
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
