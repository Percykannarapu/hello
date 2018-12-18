import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpProjectState } from '../../models/imp-project-state';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { ImpProjectPrefActionsAffectingParent, ImpProjectPrefActionTypes } from '../projectPref/imp-project-pref.actions';
import { ImpProjectVarActionsAffectingParent, ImpProjectVarActionTypes } from '../projectVar/imp-project-var.actions';
import { addChildIds, clearChildIds, deleteChildIds } from '../utils';
import { ImpProjectActions, ImpProjectActionTypes } from './imp-project.actions';

export interface State extends EntityState<ImpProjectState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpProjectState> = createEntityAdapter<ImpProjectState>({
  sortComparer: false,
  selectId: model => model.projectId
});

export const initialState: State = adapter.getInitialState({
  // additional entities state properties
});

type reducerActions =
  ImpProjectActions |
  EntityCreateSuccessful | EntityLoadSuccessful |
  ImpProjectVarActionsAffectingParent |
  ImpProjectPrefActionsAffectingParent;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    // primary actions
    case PersistentActionTypes.EntityCreateSuccessful:
    case PersistentActionTypes.EntityLoadSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impProjects, state);
    case ImpProjectActionTypes.UpdateImpProject:
      return adapter.updateOne(action.payload.impProject, state);

    // child actions
    case ImpProjectVarActionTypes.DeleteImpProjectVar:
      return deleteChildIds(adapter, state, [action.payload.id], 'impProjectVars');
    case ImpProjectVarActionTypes.DeleteImpProjectVars:
      return deleteChildIds(adapter, state, action.payload.ids, 'impProjectVars');
    case ImpProjectVarActionTypes.ClearImpProjectVars:
      return clearChildIds(adapter, state, 'impProjectVars');
    case ImpProjectVarActionTypes.AddImpProjectVar:
      return addChildIds(adapter, state, [action.payload.impProjectVar], 'impProjectVars', v => v.projectId);
    case ImpProjectVarActionTypes.AddImpProjectVars:
      return addChildIds(adapter, state, action.payload.impProjectVars, 'impProjectVars', v => v.projectId);

      case ImpProjectPrefActionTypes.DeleteImpProjectPref:
      return deleteChildIds(adapter, state, [action.payload.id], 'impProjectPrefs');
    case ImpProjectPrefActionTypes.DeleteImpProjectPrefs:
      return deleteChildIds(adapter, state, action.payload.ids, 'impProjectPrefs');
    case ImpProjectPrefActionTypes.ClearImpProjectPrefs:
      return clearChildIds(adapter, state, 'impProjectPrefs');
    case ImpProjectPrefActionTypes.AddImpProjectPref:
      return addChildIds(adapter, state, [action.payload.impProjectPref], 'impProjectPrefs', p => p.projectId);
    case ImpProjectPrefActionTypes.AddImpProjectPrefs:
      return addChildIds(adapter, state, action.payload.impProjectPrefs, 'impProjectPrefs', p => p.projectId);

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
