import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { RfpUiEdit } from '../../../val-modules/mediaexpress/models/RfpUiEdit';
import { GetMediaPlanDataSucceeded, InitActionTypes } from '../init/init.actions';
import { RfpUiEditActions, RfpUiEditActionTypes } from './rfp-ui-edit.actions';

export interface RfpUiEditState extends EntityState<RfpUiEdit> {
  // additional entities state properties
}

export const adapter: EntityAdapter<RfpUiEdit> = createEntityAdapter<RfpUiEdit>({
  sortComparer: false,
  selectId: model => model['@ref']
});

export const initialState: RfpUiEditState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = RfpUiEditActions | GetMediaPlanDataSucceeded;

export function rfpUiEditreducer(state = initialState, action: reducerActions) : RfpUiEditState {
  switch (action.type) {
    case InitActionTypes.GetMediaPlanDataSucceeded: {
      if (action.payload.normalizedEntities.rfpUiEdits != null) {
        return adapter.setAll(action.payload.normalizedEntities.rfpUiEdits, state);
      } else {
        return state;
      }
    }

    case RfpUiEditActionTypes.AddRfpUiEdit: {
      return adapter.addOne(action.payload.rfpUiEdit, state);
    }

    case RfpUiEditActionTypes.UpsertRfpUiEdit: {
      return adapter.upsertOne(action.payload.rfpUiEdit, state);
    }

    case RfpUiEditActionTypes.AddRfpUiEdits: {
      return adapter.addMany(action.payload.rfpUiEdits, state);
    }

    case RfpUiEditActionTypes.UpsertRfpUiEdits: {
      return adapter.upsertMany(action.payload.rfpUiEdits, state);
    }

    case RfpUiEditActionTypes.UpdateRfpUiEdit: {
      return adapter.updateOne(action.payload.rfpUiEdit, state);
    }

    case RfpUiEditActionTypes.UpdateRfpUiEdits: {
      return adapter.updateMany(action.payload.rfpUiEdits, state);
    }

    case RfpUiEditActionTypes.DeleteRfpUiEdit: {
      return adapter.removeOne(action.payload.id, state);
    }

    case RfpUiEditActionTypes.DeleteRfpUiEdits: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case RfpUiEditActionTypes.LoadRfpUiEdits: {
      return adapter.setAll(action.payload.rfpUiEdits, state);
    }

    case RfpUiEditActionTypes.ClearRfpUiEdits: {
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
