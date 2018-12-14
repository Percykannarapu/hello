import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpProjectPrefState } from '../../models/imp-project-pref-state';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { ImpProjectPrefActions, ImpProjectPrefActionTypes } from './imp-project-pref.actions';

export interface State extends EntityState<ImpProjectPrefState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpProjectPrefState> = createEntityAdapter<ImpProjectPrefState>({
  sortComparer: false,
  selectId: model => model.projectPrefId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = ImpProjectPrefActions | EntityCreateSuccessful | EntityLoadSuccessful;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityLoadSuccessful:
    case PersistentActionTypes.EntityCreateSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impProjectPrefs, state);
    case ImpProjectPrefActionTypes.AddImpProjectPref: {
      return adapter.addOne(action.payload.impProjectPref, state);
    }
    case ImpProjectPrefActionTypes.AddImpProjectPrefs: {
      return adapter.addMany(action.payload.impProjectPrefs, state);
    }
    case ImpProjectPrefActionTypes.UpdateImpProjectPref: {
      return adapter.updateOne(action.payload.impProjectPref, state);
    }
    case ImpProjectPrefActionTypes.UpdateImpProjectPrefs: {
      return adapter.updateMany(action.payload.impProjectPrefs, state);
    }
    case ImpProjectPrefActionTypes.DeleteImpProjectPref: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpProjectPrefActionTypes.DeleteImpProjectPrefs: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpProjectPrefActionTypes.ClearImpProjectPrefs:
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
