import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpGeofootprintLocAttribActionsAffectingParent, ImpGeofootprintLocAttribActionTypes, ImpGeofootprintTradeAreaActionsAffectingParent, ImpGeofootprintTradeAreaActionTypes, PersistentActionTypes } from '..';
import { EntityCreateSuccessful, EntityLoadSuccessful } from '../persistent.actions';
import { addChildIds, clearChildIds, deleteChildIds } from '../utils';
import { ImpGeofootprintLocationActions, ImpGeofootprintLocationActionTypes } from './imp-geofootprint-location.actions';
import { ImpGeofootprintLocationState } from '../../models/imp-geofootprint-location-state';

export interface State extends EntityState<ImpGeofootprintLocationState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpGeofootprintLocationState> = createEntityAdapter<ImpGeofootprintLocationState>({
  sortComparer: false,
  selectId: model => model.glId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions =
  ImpGeofootprintLocationActions |
  EntityCreateSuccessful | EntityLoadSuccessful |
  ImpGeofootprintLocAttribActionsAffectingParent |
  ImpGeofootprintTradeAreaActionsAffectingParent;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityCreateSuccessful:
    case PersistentActionTypes.EntityLoadSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impGeofootprintLocations, state);
    case ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocation: {
      return adapter.addOne(action.payload.impGeofootprintLocation, state);
    }
    case ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocations: {
      return adapter.addMany(action.payload.impGeofootprintLocations, state);
    }
    case ImpGeofootprintLocationActionTypes.UpdateImpGeofootprintLocation: {
      return adapter.updateOne(action.payload.impGeofootprintLocation, state);
    }
    case ImpGeofootprintLocationActionTypes.UpdateImpGeofootprintLocations: {
      return adapter.updateMany(action.payload.impGeofootprintLocations, state);
    }
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations: {
      return adapter.removeAll(state);
    }

    case ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttrib:
      return addChildIds(adapter, state, [action.payload.impGeofootprintLocAttrib], 'impGeofootprintLocAttribs', a => a.glId);
    case ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttribs:
      return addChildIds(adapter, state, action.payload.impGeofootprintLocAttribs, 'impGeofootprintLocAttribs', a => a.glId);
    case ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttrib:
      return deleteChildIds(adapter, state, [action.payload.id], 'impGeofootprintLocAttribs');
    case ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttribs:
      return deleteChildIds(adapter, state, action.payload.ids, 'impGeofootprintLocAttribs');
    case ImpGeofootprintLocAttribActionTypes.ClearImpGeofootprintLocAttribs:
      return clearChildIds(adapter, state, 'impGeofootprintLocAttribs');

    case ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeArea:
      return addChildIds(adapter, state, [action.payload.impGeofootprintTradeArea], 'impGeofootprintTradeAreas', ta => ta.glId);
    case ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeAreas:
      return addChildIds(adapter, state, action.payload.impGeofootprintTradeAreas, 'impGeofootprintTradeAreas', ta => ta.glId);
    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeArea:
      return deleteChildIds(adapter, state, [action.payload.id], 'impGeofootprintTradeAreas');
    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeAreas:
      return deleteChildIds(adapter, state, action.payload.ids, 'impGeofootprintTradeAreas');
    case ImpGeofootprintTradeAreaActionTypes.ClearImpGeofootprintTradeAreas:
      return clearChildIds(adapter, state, 'impGeofootprintTradeAreas');

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
