import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { ImpGeofootprintLocationActionsAffectingChildren, ImpGeofootprintLocationActionTypes, ImpGeofootprintTradeAreaActionsAffectingChildren, ImpGeofootprintTradeAreaActionTypes } from '..';
import { ImpGeofootprintGeoState } from '../../models/imp-geofootprint-geo-state';
import { EntityCreateSuccessful, EntityLoadSuccessful, PersistentActionTypes } from '../persistent.actions';
import { deleteChildrenByParentId } from '../utils';
import { ImpGeofootprintGeoActions, ImpGeofootprintGeoActionTypes } from './imp-geofootprint-geo.actions';

export interface State extends EntityState<ImpGeofootprintGeoState> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ImpGeofootprintGeoState> = createEntityAdapter<ImpGeofootprintGeoState>({
  sortComparer: false,
  selectId: model => model.ggId
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions =
  ImpGeofootprintGeoActions
  | EntityCreateSuccessful
  | EntityLoadSuccessful
  | ImpGeofootprintTradeAreaActionsAffectingChildren
  | ImpGeofootprintLocationActionsAffectingChildren;

export function reducer(state = initialState, action: reducerActions) : State {
  switch (action.type) {
    case PersistentActionTypes.EntityLoadSuccessful:
    case PersistentActionTypes.EntityCreateSuccessful:
      return adapter.addAll(action.payload.normalizedEntities.impGeofootprintGeos, state);
    case ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeo: {
      return adapter.addOne(action.payload.impGeofootprintGeo, state);
    }
    case ImpGeofootprintGeoActionTypes.AddImpGeofootprintGeos: {
      return adapter.addMany(action.payload.impGeofootprintGeos, state);
    }
    case ImpGeofootprintGeoActionTypes.UpdateImpGeofootprintGeo: {
      return adapter.updateOne(action.payload.impGeofootprintGeo, state);
    }
    case ImpGeofootprintGeoActionTypes.UpdateImpGeofootprintGeos: {
      return adapter.updateMany(action.payload.impGeofootprintGeos, state);
    }
    case ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeo: {
      return adapter.removeOne(action.payload.id, state);
    }
    case ImpGeofootprintGeoActionTypes.DeleteImpGeofootprintGeos: {
      return adapter.removeMany(action.payload.ids, state);
    }
    case ImpGeofootprintGeoActionTypes.ClearImpGeofootprintGeos:
    case ImpGeofootprintTradeAreaActionTypes.ClearImpGeofootprintTradeAreas:
    case ImpGeofootprintLocationActionTypes.ClearImpGeofootprintLocations:
      return adapter.removeAll(state);

    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeArea:
      return deleteChildrenByParentId(adapter, state, [action.payload.id], g => g.gtaId);
    case ImpGeofootprintTradeAreaActionTypes.DeleteImpGeofootprintTradeAreas:
      return deleteChildrenByParentId(adapter, state, action.payload.ids, g => g.gtaId);
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocation:
      return deleteChildrenByParentId(adapter, state, [action.payload.id], g => g.glId);
    case ImpGeofootprintLocationActionTypes.DeleteImpGeofootprintLocations:
      return deleteChildrenByParentId(adapter, state, action.payload.ids, g => g.glId);

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
