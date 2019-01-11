import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { AdvertiserInfo } from '../../../val-modules/mediaexpress/models/AdvertiserInfo';
import { AdvertiserInfoActions, AdvertiserInfoActionTypes } from './advertiser-info.actions';

export interface AdvertiserInfoState extends EntityState<AdvertiserInfo> {
  // additional entities state properties
}

export const adapter: EntityAdapter<AdvertiserInfo> = createEntityAdapter<AdvertiserInfo>({
  sortComparer: false,
  selectId: model => model.advertiserInfoId
});

export const initialState: AdvertiserInfoState = adapter.getInitialState({
  // additional entity state properties
});

export function advertiserInfoReducer(state = initialState, action: AdvertiserInfoActions) : AdvertiserInfoState {
  switch (action.type) {
    case AdvertiserInfoActionTypes.AddAdvertiserInfo: {
      return adapter.addOne(action.payload.advertiserInfo, state);
    }

    case AdvertiserInfoActionTypes.UpsertAdvertiserInfo: {
      return adapter.upsertOne(action.payload.advertiserInfo, state);
    }

    case AdvertiserInfoActionTypes.AddAdvertiserInfos: {
      return adapter.addMany(action.payload.advertiserInfos, state);
    }

    case AdvertiserInfoActionTypes.UpsertAdvertiserInfos: {
      return adapter.upsertMany(action.payload.advertiserInfos, state);
    }

    case AdvertiserInfoActionTypes.UpdateAdvertiserInfo: {
      return adapter.updateOne(action.payload.advertiserInfo, state);
    }

    case AdvertiserInfoActionTypes.UpdateAdvertiserInfos: {
      return adapter.updateMany(action.payload.advertiserInfos, state);
    }

    case AdvertiserInfoActionTypes.DeleteAdvertiserInfo: {
      return adapter.removeOne(action.payload.id, state);
    }

    case AdvertiserInfoActionTypes.DeleteAdvertiserInfos: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case AdvertiserInfoActionTypes.LoadAdvertiserInfos: {
      return adapter.addAll(action.payload.advertiserInfos, state);
    }

    case AdvertiserInfoActionTypes.ClearAdvertiserInfos: {
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
