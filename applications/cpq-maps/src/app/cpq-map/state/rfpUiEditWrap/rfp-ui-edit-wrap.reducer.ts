import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { RfpUiEditWrapActions, RfpUiEditWrapActionTypes } from './rfp-ui-edit-wrap.actions';

export interface RfpUiEditWrapState extends EntityState<RfpUiEditWrap> {
  // additional entities state properties
}

export const adapter: EntityAdapter<RfpUiEditWrap> = createEntityAdapter<RfpUiEditWrap>({
  sortComparer: false,
  selectId: model => model['@ref']
});

export const initialState: RfpUiEditWrapState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = RfpUiEditWrapActions | GetMediaPlanDataSucceeded;

export function rfpUiEditWrapReducer(state = initialState, action: reducerActions) : RfpUiEditWrapState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.rfpUiEditWraps != null) {
        return adapter.addAll(action.payload.normalizedEntities.rfpUiEditWraps, state);
      } else {
        return state;
      }
    }

    case RfpUiEditWrapActionTypes.AddRfpUiEditWrap: {
      return adapter.addOne(action.payload.rfpUiEditWrap, state);
    }

    case RfpUiEditWrapActionTypes.UpsertRfpUiEditWrap: {
      return adapter.upsertOne(action.payload.rfpUiEditWrap, state);
    }

    case RfpUiEditWrapActionTypes.AddRfpUiEditWraps: {
      return adapter.addMany(action.payload.rfpUiEditWraps, state);
    }

    case RfpUiEditWrapActionTypes.UpsertRfpUiEditWraps: {
      return adapter.upsertMany(action.payload.rfpUiEditWraps, state);
    }

    case RfpUiEditWrapActionTypes.UpdateRfpUiEditWrap: {
      return adapter.updateOne(action.payload.rfpUiEditWrap, state);
    }

    case RfpUiEditWrapActionTypes.UpdateRfpUiEditWraps: {
      return adapter.updateMany(action.payload.rfpUiEditWraps, state);
    }

    case RfpUiEditWrapActionTypes.DeleteRfpUiEditWrap: {
      return adapter.removeOne(action.payload.id, state);
    }

    case RfpUiEditWrapActionTypes.DeleteRfpUiEditWraps: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case RfpUiEditWrapActionTypes.LoadRfpUiEditWraps: {
      return adapter.addAll(action.payload.rfpUiEditWraps, state);
    }

    case RfpUiEditWrapActionTypes.ClearRfpUiEditWraps: {
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
