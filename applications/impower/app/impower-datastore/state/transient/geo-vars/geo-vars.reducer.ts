import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { GeoVar } from './geo-vars.model';
import { GeoVarActions, GeoVarActionTypes } from './geo-vars.actions';
import { groupBy } from '@val/common';


export interface State extends EntityState<GeoVar> {
  transactionId: number;
}

export const adapter: EntityAdapter<GeoVar> = createEntityAdapter<GeoVar>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState({
  transactionId: null,
});

export function reducer(state = initialState, action: GeoVarActions) : State {
  switch (action.type) {
    case GeoVarActionTypes.AddGeoVar: {
      return adapter.addOne(action.payload.geoVar, state);
    }

    case GeoVarActionTypes.UpsertGeoVar: {
      return adapter.upsertOne(action.payload.geoVar, state);
    }

    case GeoVarActionTypes.AddGeoVars: {
      if (action.payload.geoVars == null || action.payload.geoVars.length === 0) return state;
      const mergedEntities = [];
      groupBy(action.payload.geoVars, 'geocode').forEach((geovars, geocode) => {
          let entity = {};
          geovars.forEach(geovar => entity = { ...entity, ...geovar });
          mergedEntities.push(entity);
      });
      return adapter.addMany(mergedEntities, state);
    }

    case GeoVarActionTypes.UpsertGeoVars: {
      if (action.payload.geoVars == null || action.payload.geoVars.length === 0) return state;

      const mergedEntities = [];
      groupBy(action.payload.geoVars, 'geocode').forEach((geovars, geocode) => {
          let entity = {};
          geovars.forEach(geovar => entity = { ...entity, ...geovar });
          mergedEntities.push(entity);
      });
      return adapter.upsertMany(mergedEntities, state);
    }

    case GeoVarActionTypes.UpdateGeoVar: {
      return adapter.updateOne(action.payload.geoVar, state);
    }

    case GeoVarActionTypes.UpdateGeoVars: {
      return adapter.updateMany(action.payload.geoVars, state);
    }

    case GeoVarActionTypes.DeleteGeoVar: {
      return adapter.removeOne(action.payload.id, state);
    }

    case GeoVarActionTypes.DeleteGeoVars: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case GeoVarActionTypes.LoadGeoVars: {
      return adapter.setAll(action.payload.geoVars, state);
    }

    case GeoVarActionTypes.ClearGeoVars: {
      return adapter.removeAll(state);
    }

    case GeoVarActionTypes.GeoVarCacheGeosComplete: {
      return {...state, transactionId: action.payload.transactionId};
    }

    case GeoVarActionTypes.GeoVarCacheGeosFailure: {
      return {...state, transactionId: null};
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
