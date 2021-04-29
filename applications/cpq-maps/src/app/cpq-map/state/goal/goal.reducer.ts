import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { Goal } from '../../../val-modules/mediaexpress/models/Goal';
import { GoalActions, GoalActionTypes } from './goal.actions';

export interface GoalState extends EntityState<Goal> {
  // additional entities state properties
}

export const adapter: EntityAdapter<Goal> = createEntityAdapter<Goal>({
  sortComparer: false,
  selectId: model => model.goalCode
});

export const initialState: GoalState = adapter.getInitialState({
  // additional entity state properties
});

export function goalReducer(state = initialState, action: GoalActions) : GoalState {
  switch (action.type) {
    case GoalActionTypes.AddGoal: {
      return adapter.addOne(action.payload.goal, state);
    }

    case GoalActionTypes.UpsertGoal: {
      return adapter.upsertOne(action.payload.goal, state);
    }

    case GoalActionTypes.AddGoals: {
      return adapter.addMany(action.payload.goals, state);
    }

    case GoalActionTypes.UpsertGoals: {
      return adapter.upsertMany(action.payload.goals, state);
    }

    case GoalActionTypes.UpdateGoal: {
      return adapter.updateOne(action.payload.goal, state);
    }

    case GoalActionTypes.UpdateGoals: {
      return adapter.updateMany(action.payload.goals, state);
    }

    case GoalActionTypes.DeleteGoal: {
      return adapter.removeOne(action.payload.id, state);
    }

    case GoalActionTypes.DeleteGoals: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case GoalActionTypes.LoadGoals: {
      return adapter.setAll(action.payload.goals, state);
    }

    case GoalActionTypes.ClearGoals: {
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
