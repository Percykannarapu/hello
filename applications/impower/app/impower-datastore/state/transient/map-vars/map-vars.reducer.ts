import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { groupBy } from '@val/common';
import { MapVarActions, MapVarActionTypes } from './map-vars.actions';
import { MapVar } from './map-vars.model';

export interface State extends EntityState<MapVar> {
  mappedAudienceIds: string[];
}

export const adapter: EntityAdapter<MapVar> = createEntityAdapter<MapVar>({
  sortComparer: false,
  selectId: model => model.geocode
});

export const initialState: State = adapter.getInitialState({
  mappedAudienceIds: []
});

export function reducer(state = initialState, action: MapVarActions) : State {
  switch (action.type) {
    case MapVarActionTypes.LoadMappedAudienceIds:
      return { ...state, mappedAudienceIds: [...action.payload.audienceIds] };
    case MapVarActionTypes.AddMapVar: {
      return adapter.addOne(action.payload.mapVar, state);
    }

    case MapVarActionTypes.UpsertMapVar: {
      return adapter.upsertOne(action.payload.mapVar, state);
    }

    case MapVarActionTypes.AddMapVars: {
      if (action.payload.mapVars == null || action.payload.mapVars.length === 0) return state;
      const mergedEntities = [];
      groupBy(action.payload.mapVars, 'geocode').forEach((mapvars) => {
          mergedEntities.push(Object.assign({}, ...mapvars));
      });
      return adapter.addMany(mergedEntities, state);
    }

    case MapVarActionTypes.UpsertMapVars: {
      if (action.payload.mapVars == null || action.payload.mapVars.length === 0) return state;

      const mergedEntities = [];
      groupBy(action.payload.mapVars, 'geocode').forEach((mapvars) => {
          mergedEntities.push(Object.assign({}, ...mapvars));
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
      return adapter.setAll(action.payload.mapVars, state);
    }

    case MapVarActionTypes.ClearMapVars: {
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
