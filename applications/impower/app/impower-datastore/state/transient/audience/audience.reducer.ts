import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { createReducer, on } from '@ngrx/store';
import { AudienceActions, AudienceActionTypes } from './audience.actions';
import { Audience } from './audience.model';
import * as fromTransientActions from '../transient.actions';

export interface State extends EntityState<Audience> {
  ids: string[];
}

function sortBySeq(e1: Audience, e2: Audience) {
  return e1.sortOrder - e2.sortOrder;
}

export const adapter: EntityAdapter<Audience> = createEntityAdapter<Audience>({
  selectId: model => model.audienceIdentifier,
  sortComparer: sortBySeq
});

export const initialState: State = adapter.getInitialState() as State;

function swapAudiencePositions(state: State, audienceId: string, swapOffset: number) : State {
  const currentPosition = state.ids.indexOf(audienceId);
  const newPosition = currentPosition + swapOffset;
  if (newPosition < 0 || newPosition >= state.ids.length) {
    return state;
  } else {
    const neighborId = state.ids[newPosition];
    return adapter.updateMany([
      { id: audienceId, changes: { sortOrder: newPosition }},
      { id: neighborId, changes: { sortOrder: currentPosition }}
    ], state);
  }
}

const audienceReducer = createReducer(initialState,
  on(fromTransientActions.clearTransientData, (state, action) => {
    if (action.fullEntityWipe) return adapter.removeAll(state);
    return state;
  })
);

export function reducer(state = initialState, action: AudienceActions) : State {
  switch (action.type) {
    case AudienceActionTypes.MoveAudienceUp:
      return swapAudiencePositions(state, action.payload.audienceIdentifier, -1);
    case AudienceActionTypes.MoveAudienceDn:
      return swapAudiencePositions(state, action.payload.audienceIdentifier, 1);
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
      return adapter.setAll(action.payload.audiences, state);
    }

    case AudienceActionTypes.ClearAudiences: {
      return adapter.removeAll(state);
    }

    default: {
      return audienceReducer(state, action);
    }
  }
}

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = adapter.getSelectors();
