import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpGeofootprintLocAttribState } from '../../models/imp-geofootprint-loc-attrib-state';
import { ImpGeofootprintLocationActionsAffectingChildren, ImpGeofootprintLocationActionTypes } from '../location/imp-geofootprint-location.actions';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { deleteChildrenByParentId } from '../utils';
import { ImpGeofootprintLocAttribActions, ImpGeofootprintLocAttribActionTypes } from './imp-geofootprint-loc-attrib.actions';

export interface State extends EntityState<ImpGeofootprintLocAttribState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpGeofootprintLocAttribState> = createEntityAdapter<ImpGeofootprintLocAttribState>({
  sortComparer: false,
  selectId: model => model.locAttributeId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = EntityCreateSuccessful | EntityLoadSuccessful | ImpGeofootprintLocAttribActions | ImpGeofootprintLocationActionsAffectingChildren;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityLoadSuccessful:
    case PersistentActionTypes.EntityCreateSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impGeofootprintLocAttribs, state);
    case ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttrib: {
      return adapter.addOne(action.payload.impGeofootprintLocAttrib, state);
    }
    case ImpGeofootprintLocAttribActionTypes.AddImpGeofootprintLocAttribs: {
      return adapter.addMany(action.payload.impGeofootprintLocAttribs, state);
    }
    case ImpGeofootprintLocAttribActionTypes.UpdateImpGeofootprintLocAttrib: {
      return adapter.updateOne(action.payload.impGeofootprintLocAttrib, state);
    }
    case ImpGeofootprintLocAttribActionTypes.UpdateImpGeofootprintLocAttribs: {
      return adapter.updateMany(action.payload.impGeofootprintLocAttribs, state);
    }
    case ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttrib: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpGeofootprintLocAttribActionTypes.DeleteImpGeofootprintLocAttribs: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpGeofootprintLocAttribActionTypes.ClearImpGeofootprintLocAttribs:
    case ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations:
      return adapter.removeAll(state);

    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation:
      return deleteChildrenByParentId(adapter, state, [action.payload.id], a => a.glId);
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations:
      return deleteChildrenByParentId(adapter, state, action.payload.ids, a => a.glId);

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
