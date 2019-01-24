import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { TargetAudiencePref } from '../../../val-modules/mediaexpress/models/TargetAudiencePref';
import { TargetAudienceActions, TargetAudienceActionTypes } from './target-audience.actions';
import { SharedActions, SharedActionTypes } from '../shared/shared.actions';

export interface TargetAudienceState extends EntityState<TargetAudiencePref> {
  // additional entities state properties
}

export const adapter: EntityAdapter<TargetAudiencePref> = createEntityAdapter<TargetAudiencePref>({
  sortComparer: false,
  selectId: model => model.targetAudiencePrefId
});

export const initialState: TargetAudienceState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = TargetAudienceActions | SharedActions;

export function targetAudienceReducer(state = initialState, action: reducerActions) : TargetAudienceState {
  switch (action.type) {
    case SharedActionTypes.LoadEntityGraph: {
      if (action.payload.normalizedEntities.targetAudiencePrefs != null)
        return adapter.addMany(action.payload.normalizedEntities.targetAudiencePrefs, state);
      else
        return state;
    }
    
    case TargetAudienceActionTypes.AddTargetAudience: {
      return adapter.addOne(action.payload.targetAudience, state);
    }

    case TargetAudienceActionTypes.UpsertTargetAudience: {
      return adapter.upsertOne(action.payload.targetAudience, state);
    }

    case TargetAudienceActionTypes.AddTargetAudiences: {
      return adapter.addMany(action.payload.targetAudiences, state);
    }

    case TargetAudienceActionTypes.UpsertTargetAudiences: {
      return adapter.upsertMany(action.payload.targetAudiences, state);
    }

    case TargetAudienceActionTypes.UpdateTargetAudience: {
      return adapter.updateOne(action.payload.targetAudience, state);
    }

    case TargetAudienceActionTypes.UpdateTargetAudiences: {
      return adapter.updateMany(action.payload.targetAudiences, state);
    }

    case TargetAudienceActionTypes.DeleteTargetAudience: {
      return adapter.removeOne(action.payload.id, state);
    }

    case TargetAudienceActionTypes.DeleteTargetAudiences: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case TargetAudienceActionTypes.LoadTargetAudiences: {
      return adapter.addAll(action.payload.targetAudiences, state);
    }

    case TargetAudienceActionTypes.ClearTargetAudiences: {
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
