import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpGeofootprintGeoActionsAffectingParent, ImpGeofootprintGeoActionTypes, ImpGeofootprintLocationActionsAffectingChildren, ImpGeofootprintLocationActionTypes } from '..';
import { ImpGeofootprintTradeAreaState } from '../../models/imp-geofootprint-trade-area-state';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { addChildIds, clearChildIds, deleteChildIds, deleteChildrenByParentId } from '../utils';
import { ImpGeofootprintTradeAreaActions, ImpGeofootprintTradeAreaActionTypes } from './imp-geofootprint-trade-area.actions';

export interface State extends EntityState<ImpGeofootprintTradeAreaState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpGeofootprintTradeAreaState> = createEntityAdapter<ImpGeofootprintTradeAreaState>({
  sortComparer: false,
  selectId: model => model.gtaId,
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions =
  EntityCreateSuccessful | EntityLoadSuccessful |
  ImpGeofootprintLocationActionsAffectingChildren |
  ImpGeofootprintGeoActionsAffectingParent |
  ImpGeofootprintTradeAreaActions;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityCreateSuccessful:
    case PersistentActionTypes.EntityLoadSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impGeofootprintTradeAreas, state);
    case ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeArea: {
      return adapter.addOne(action.payload.impGeofootprintTradeArea, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.AddImpGeofootprintTradeAreas: {
      return adapter.addMany(action.payload.impGeofootprintTradeAreas, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.UpdateImpGeofootprintTradeArea: {
      return adapter.updateOne(action.payload.impGeofootprintTradeArea, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.UpdateImpGeofootprintTradeAreas: {
      return adapter.updateMany(action.payload.impGeofootprintTradeAreas, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeArea: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeAreas: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpGeofootprintTradeAreaActionTypes.ClearImpGeofootprintTradeAreas:
    case ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations:
      return adapter.removeAll(state);

    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation:
      return deleteChildrenByParentId(adapter, state, [action.payload.id], ta => ta.glId);
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations:
      return deleteChildrenByParentId(adapter, state, action.payload.ids, ta => ta.glId);

    case ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeo:
      return addChildIds(adapter, state, [action.payload.impGeofootprintGeo], 'impGeofootprintGeos', g => g.gtaId);
    case ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeos:
      return addChildIds(adapter, state, action.payload.impGeofootprintGeos, 'impGeofootprintGeos', g => g.gtaId);
    case ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeo:
      return deleteChildIds(adapter, state, [action.payload.id], 'impGeofootprintGeos');
    case ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeos:
      return deleteChildIds(adapter, state, action.payload.ids, 'impGeofootprintGeos');
    case ImpGeofootprintGeoActionTypes.ClearImpGeofootprintGeos:
      return clearChildIds(adapter, state, 'impGeofootprintGeos');

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
