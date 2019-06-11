import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { RfpUiEditDetailActions, RfpUiEditDetailActionTypes } from './rfp-ui-edit-detail.actions';

export interface RfpUiEditDetailState extends EntityState<RfpUiEditDetail> {
  // additional entities state properties
}

export const adapter: EntityAdapter<RfpUiEditDetail> = createEntityAdapter<RfpUiEditDetail>({
  sortComparer: false,
  selectId: model => model['@ref']
});

export const initialState: RfpUiEditDetailState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = RfpUiEditDetailActions | GetMediaPlanDataSucceeded;

export function rfpUiEditDetailreducer(state = initialState, action: reducerActions) : RfpUiEditDetailState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.rfpUiEditDetails != null)
        return adapter.addAll(action.payload.normalizedEntities.rfpUiEditDetails, state);
      else
        return state;
    }

    case RfpUiEditDetailActionTypes.AddRfpUiEditDetail: {
      return adapter.addOne(action.payload.rfpUiEditDetail, state);
    }

    case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetail: {
      return adapter.upsertOne(action.payload.rfpUiEditDetail, state);
    }

    case RfpUiEditDetailActionTypes.AddRfpUiEditDetails: {
      return adapter.addMany(action.payload.rfpUiEditDetails, state);
    }

    case RfpUiEditDetailActionTypes.UpsertRfpUiEditDetails: {
      return adapter.upsertMany(action.payload.rfpUiEditDetails, state);
    }

    case RfpUiEditDetailActionTypes.UpdateRfpUiEditDetail: {
      return adapter.updateOne(action.payload.rfpUiEditDetail, state);
    }

    case RfpUiEditDetailActionTypes.UpdateRfpUiEditDetails: {
      return adapter.updateMany(action.payload.rfpUiEditDetails, state);
    }

    case RfpUiEditDetailActionTypes.DeleteRfpUiEditDetail: {
      return adapter.removeOne(action.payload.id, state);
    }

    case RfpUiEditDetailActionTypes.DeleteRfpUiEditDetails: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case RfpUiEditDetailActionTypes.LoadRfpUiEditDetails: {
      return adapter.addAll(action.payload.rfpUiEditDetails, state);
    }

    case RfpUiEditDetailActionTypes.ClearRfpUiEditDetails: {
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
