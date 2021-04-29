import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { MpCommonVersion } from '../../../val-modules/mediaexpress/models/MpCommonVersion';
import { MpCommonVersionActions, MpCommonVersionActionTypes } from './mp-common-version.actions';

export interface MpCommonVersionState extends EntityState<MpCommonVersion> {
  // additional entities state properties
}

export const adapter: EntityAdapter<MpCommonVersion> = createEntityAdapter<MpCommonVersion>({
  sortComparer: false,
  selectId: model => model.commonVersionId
});

export const initialState: MpCommonVersionState = adapter.getInitialState({
  // additional entity state properties
});

export function mpCommonVersionReducer(state = initialState, action: MpCommonVersionActions) : MpCommonVersionState {
  switch (action.type) {
    case MpCommonVersionActionTypes.AddMpCommonVersion: {
      return adapter.addOne(action.payload.mpCommonVersion, state);
    }

    case MpCommonVersionActionTypes.UpsertMpCommonVersion: {
      return adapter.upsertOne(action.payload.mpCommonVersion, state);
    }

    case MpCommonVersionActionTypes.AddMpCommonVersions: {
      return adapter.addMany(action.payload.mpCommonVersions, state);
    }

    case MpCommonVersionActionTypes.UpsertMpCommonVersions: {
      return adapter.upsertMany(action.payload.mpCommonVersions, state);
    }

    case MpCommonVersionActionTypes.UpdateMpCommonVersion: {
      return adapter.updateOne(action.payload.mpCommonVersion, state);
    }

    case MpCommonVersionActionTypes.UpdateMpCommonVersions: {
      return adapter.updateMany(action.payload.mpCommonVersions, state);
    }

    case MpCommonVersionActionTypes.DeleteMpCommonVersion: {
      return adapter.removeOne(action.payload.id, state);
    }

    case MpCommonVersionActionTypes.DeleteMpCommonVersions: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case MpCommonVersionActionTypes.LoadMpCommonVersions: {
      return adapter.setAll(action.payload.mpCommonVersions, state);
    }

    case MpCommonVersionActionTypes.ClearMpCommonVersions: {
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
