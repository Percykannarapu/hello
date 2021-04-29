import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { GeoAttribute } from './geo-attributes.model';
import { GeoAttributeActions, GeoAttributeActionTypes } from './geo-attributes.actions';

export interface State extends EntityState<GeoAttribute> {
  // additional entities state properties
}

export const adapter: EntityAdapter<GeoAttribute> = createEntityAdapter<GeoAttribute>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState({
  // additional entity state properties
});

export function reducer(state = initialState, action: GeoAttributeActions) : State {
  switch (action.type) {
    case GeoAttributeActionTypes.AddGeoAttribute: {
      return adapter.addOne(action.payload.geoAttribute, state);
    }

    case GeoAttributeActionTypes.UpsertGeoAttribute: {
      return adapter.upsertOne(action.payload.geoAttribute, state);
    }

    case GeoAttributeActionTypes.AddGeoAttributes: {
      return adapter.addMany(action.payload.geoAttributes, state);
    }

    case GeoAttributeActionTypes.UpsertGeoAttributes: {
      return adapter.upsertMany(action.payload.geoAttributes, state);
    }

    case GeoAttributeActionTypes.UpdateGeoAttribute: {
      return adapter.updateOne(action.payload.geoAttribute, state);
    }

    case GeoAttributeActionTypes.UpdateGeoAttributes: {
      return adapter.updateMany(action.payload.geoAttributes, state);
    }

    case GeoAttributeActionTypes.DeleteGeoAttribute: {
      return adapter.removeOne(action.payload.id, state);
    }

    case GeoAttributeActionTypes.DeleteGeoAttributes: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case GeoAttributeActionTypes.LoadGeoAttributes: {
      return adapter.setAll(action.payload.geoAttributes, state);
    }

    case GeoAttributeActionTypes.ClearGeoAttributes: {
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
