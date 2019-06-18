import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MapVar } from './map-vars.model';
import { MapVarActions, MapVarActionTypes } from './map-vars.actions';
import { groupBy } from '@val/common';

export interface State extends EntityState<MapVar> {
  transactionId: number;
}

export const adapter: EntityAdapter<MapVar> = createEntityAdapter<MapVar>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState({
  transactionId: null
});

export function reducer(state = initialState, action: MapVarActions) : State {
  switch (action.type) {
    case MapVarActionTypes.AddMapVar: {
      return adapter.addOne(action.payload.mapVar, state);
    }

    case MapVarActionTypes.UpsertMapVar: {
      return adapter.upsertOne(action.payload.mapVar, state);
    }

    case MapVarActionTypes.AddMapVars: {
      if (action.payload.mapVars == null || action.payload.mapVars.length === 0) return state;
      const mergedEntities = [];
      groupBy(action.payload.mapVars, 'geocode').forEach((mapvars, geocode) => {
          let entity = {};
          mapvars.forEach(mapvar => entity = { ...entity, ...mapvar });
          mergedEntities.push(entity);
      });
      return adapter.addMany(mergedEntities, state);
    }

    case MapVarActionTypes.UpsertMapVars: {
      if (action.payload.mapVars == null || action.payload.mapVars.length === 0) return state;

      const mergedEntities = [];
      groupBy(action.payload.mapVars, 'geocode').forEach((mapvars, geocode) => {
          let entity = {};
          mapvars.forEach(mapvar => entity = { ...entity, ...mapvar });
          mergedEntities.push(entity);
      });
      return adapter.upsertMany(mergedEntities, state);
    }

    case MapVarActionTypes.UpdateMapVar: {
      return adapter.updateOne(action.payload.mapVar, state);
    }

    case MapVarActionTypes.UpdateMapVars: {
      return adapter.updateMany(action.payload.mapVars, state);
    }

    case MapVarActionTypes.DeleteMapVar: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MapVarActionTypes.DeleteMapVars: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MapVarActionTypes.LoadMapVars: {
      return adapter.addAll(action.payload.mapVars, state);
    }

    case MapVarActionTypes.ClearMapVars: {
      console.log('### MapVarActionTypes.ClearMapVars');
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
