import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Objective } from '../../../val-modules/mediaexpress/models/Objective';
import { ObjectiveActions, ObjectiveActionTypes } from './objective.actions';

export interface ObjectiveState extends EntityState<Objective> {
  // additional entities state properties
}

export const adapter: EntityAdapter<Objective> = createEntityAdapter<Objective>({
  sortComparer: false,
  selectId: model => model.objectiveCode
});

export const initialState: ObjectiveState = adapter.getInitialState({
  // additional entity state properties
});

export function objectiveReducer(state = initialState, action: ObjectiveActions) : ObjectiveState {
  switch (action.type) {
    case ObjectiveActionTypes.AddObjective: {
      return adapter.addOne(action.payload.objective, state);
    }

    case ObjectiveActionTypes.UpsertObjective: {
      return adapter.upsertOne(action.payload.objective, state);
    }

    case ObjectiveActionTypes.AddObjectives: {
      return adapter.addMany(action.payload.objectives, state);
    }

    case ObjectiveActionTypes.UpsertObjectives: {
      return adapter.upsertMany(action.payload.objectives, state);
    }

    case ObjectiveActionTypes.UpdateObjective: {
      return adapter.updateOne(action.payload.objective, state);
    }

    case ObjectiveActionTypes.UpdateObjectives: {
      return adapter.updateMany(action.payload.objectives, state);
    }

    case ObjectiveActionTypes.DeleteObjective: {
      return adapter.removeOne(action.payload.id, state);
    }

    case ObjectiveActionTypes.DeleteObjectives: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case ObjectiveActionTypes.LoadObjectives: {
      return adapter.setAll(action.payload.objectives, state);
    }

    case ObjectiveActionTypes.ClearObjectives: {
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
