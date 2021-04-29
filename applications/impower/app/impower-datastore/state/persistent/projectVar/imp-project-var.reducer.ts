import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpProjectVarState } from '../../models/imp-project-var-state';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { ImpProjectVarActions, ImpProjectVarActionTypes } from './imp-project-var.actions';

export interface State extends EntityState<ImpProjectVarState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpProjectVarState> = createEntityAdapter<ImpProjectVarState>({
  sortComparer: false,
  selectId: model => model.pvId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = ImpProjectVarActions | EntityCreateSuccessful | EntityLoadSuccessful;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityCreateSuccessful:
    case PersistentActionTypes.EntityLoadSuccessful:
      return adapter.setAll(action.payload.normalizedEntities.impProjectVars, state);
    case ImpProjectVarActionTypes.AddImpProjectVar: {
      return adapter.addOne(action.payload.impProjectVar, state);
    }
    case ImpProjectVarActionTypes.AddImpProjectVars: {
      return adapter.addMany(action.payload.impProjectVars, state);
    }
    case ImpProjectVarActionTypes.UpdateImpProjectVar: {
      return adapter.updateOne(action.payload.impProjectVar, state);
    }
    case ImpProjectVarActionTypes.UpdateImpProjectVars: {
      return adapter.updateMany(action.payload.impProjectVars, state);
    }
    case ImpProjectVarActionTypes.DeleteImpProjectVar: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpProjectVarActionTypes.DeleteImpProjectVars: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpProjectVarActionTypes.ClearImpProjectVars:
      return adapter.removeAll(state);
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
