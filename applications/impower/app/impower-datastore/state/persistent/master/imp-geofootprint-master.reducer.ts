import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpGeofootprintMasterState } from '../../models/imp-geofootprint-master-state';
import { ImpGeofootprintLocationActionsAffectingParent, ImpGeofootprintLocationActionTypes } from '../location/imp-geofootprint-location.actions';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { addChildIds, clearChildIds, deleteChildIds } from '../utils';
import { ImpGeofootprintMasterActions, ImpGeofootprintMasterActionTypes } from './imp-geofootprint-master.actions';

export interface State extends EntityState<ImpGeofootprintMasterState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpGeofootprintMasterState> = createEntityAdapter<ImpGeofootprintMasterState>({
  sortComparer: false,
  selectId: model => model.cgmId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions =
  EntityCreateSuccessful | EntityLoadSuccessful |
  ImpGeofootprintMasterActions |
  ImpGeofootprintLocationActionsAffectingParent;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    // primary actions
    case PersistentActionTypes.EntityCreateSuccessful:
    case PersistentActionTypes.EntityLoadSuccessful:
      return adapter.setAll(action.payload.normalizedEntities.impGeofootprintMasters, state);
    case ImpGeofootprintMasterActionTypes.UpdateImpGeofootprintMaster:
      return adapter.updateOne(action.payload.impGeofootprintMaster, state);

    //child actions
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation:
      return deleteChildIds(adapter, state, [action.payload.id], 'impGeofootprintLocations');
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations:
      return deleteChildIds(adapter, state, action.payload.ids, 'impGeofootprintLocations');
    case ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations:
      return clearChildIds(adapter, state, 'impGeofootprintLocations');
    case ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocation:
      return addChildIds(adapter, state, [action.payload.impGeofootprintLocation], 'impGeofootprintLocations', loc => loc.cgmId);
    case ImpGeofootprintLocationActionTypes.AddImpGeofootprintLocations:
      return addChildIds(adapter, state, action.payload.impGeofootprintLocations, 'impGeofootprintLocations', loc => loc.cgmId);

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
