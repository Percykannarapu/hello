import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { AudienceActions, AudienceActionTypes } from './audience.actions';
import { Audience } from './audience.model';

export interface Stats {
  fetchTimes: any;
  counts: any;
  totalGeoVars: number;
  totalMapVars: number;
  totalGeoVarTime: string;
  totalMapVarTime: string;
  totalAudTATime: string;
}

export interface State extends EntityState<Audience> {
  scratch: {
    outstandingVarFetches: number;
  };
  stats: Stats;
  mapIsFetching: boolean;
}

function sortBySeq(e1: Audience, e2: Audience) {
  return e1.seq - e2.seq;
}

export const adapter: EntityAdapter<Audience> = createEntityAdapter<Audience>({
  selectId: model => model.audienceIdentifier,
  sortComparer: sortBySeq
});

export const initialStatState = {
  fetchTimes: {},
  counts: {},
  totalGeoVars: 0,
  totalMapVars: 0,
  totalGeoVarTime: '',
  totalMapVarTime: '',
  totalAudTATime: ''
};

export const initialState: State = adapter.getInitialState({
  scratch: {
    outstandingVarFetches: 0,
  },
  stats: { ...initialStatState, fetchTimes: {}, counts: {} },
  mapIsFetching: false
});

export function reducer(
  state = initialState,
  action: AudienceActions
) : State {
  switch (action.type) {
    case AudienceActionTypes.AddAudience: {
      return adapter.addOne(action.payload.audience, state);
    }

    case AudienceActionTypes.UpsertAudience: {
      return adapter.upsertOne(action.payload.audience, state);
    }

    case AudienceActionTypes.AddAudiences: {
      return adapter.addMany(action.payload.audiences, state);
    }

    case AudienceActionTypes.UpsertAudiences: {
      return adapter.upsertMany(action.payload.audiences, state);
    }

    case AudienceActionTypes.UpdateAudience: {
      return adapter.updateOne(action.payload.audience, state);
    }

    case AudienceActionTypes.UpdateAudiences: {
      return adapter.updateMany(action.payload.audiences, state);
    }

    case AudienceActionTypes.DeleteAudience: {
      return adapter.removeOne(action.payload.id, state);
    }

    case AudienceActionTypes.DeleteAudiences: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case AudienceActionTypes.LoadAudiences: {
      return adapter.addAll(action.payload.audiences, state);
    }

    case AudienceActionTypes.ClearAudiences: {
      return adapter.removeAll(state);
    }

    // case AudienceActionTypes.ApplyAudiencesRecordStart: {
    //   return {...state, scratch: {...state.scratch, applyAudiencesStart: performance.now()}};
    // }

    case AudienceActionTypes.ApplyAudiencesRecordStats: {
      return {...state, stats: action.payload.stats};
    }

    case AudienceActionTypes.ClearAudienceStats: {
      return { ...state, stats: { ...initialStatState, fetchTimes: {}, counts: {} } };
    }

    case AudienceActionTypes.FetchCountIncrement: {
      return {...state, scratch: {...state.scratch, outstandingVarFetches: state.scratch.outstandingVarFetches + 1}};
    }

    case AudienceActionTypes.FetchCountDecrement: {
      return {...state, scratch: {...state.scratch, outstandingVarFetches: (state.scratch.outstandingVarFetches > 0) ? state.scratch.outstandingVarFetches - 1 : 0}};
    }

    case AudienceActionTypes.FetchMapVar: {
      return { ...state, mapIsFetching: true };
    }

    case AudienceActionTypes.FetchMapVarCompleted : {
      return { ...state, mapIsFetching: false };
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
