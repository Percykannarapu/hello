import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { CbxReportParam } from '../../../val-modules/mediaexpress/models/CbxReportParam';
import { CbxReportParamActions, CbxReportParamActionTypes } from './cbx-report-param.actions';

export interface CbxReportParamState extends EntityState<CbxReportParam> {
  // additional entities state properties
}

export const adapter: EntityAdapter<CbxReportParam> = createEntityAdapter<CbxReportParam>({
  sortComparer: false,
  selectId: model => model.reportParamId
});

export const initialState: CbxReportParamState = adapter.getInitialState({
  // additional entity state properties
});

export function cbxReportParamReducer(state = initialState, action: CbxReportParamActions) : CbxReportParamState {
  switch (action.type) {
    case CbxReportParamActionTypes.AddCbxReportParam: {
      return adapter.addOne(action.payload.cbxReportParam, state);
    }

    case CbxReportParamActionTypes.UpsertCbxReportParam: {
      return adapter.upsertOne(action.payload.cbxReportParam, state);
    }

    case CbxReportParamActionTypes.AddCbxReportParams: {
      return adapter.addMany(action.payload.cbxReportParams, state);
    }

    case CbxReportParamActionTypes.UpsertCbxReportParams: {
      return adapter.upsertMany(action.payload.cbxReportParams, state);
    }

    case CbxReportParamActionTypes.UpdateCbxReportParam: {
      return adapter.updateOne(action.payload.cbxReportParam, state);
    }

    case CbxReportParamActionTypes.UpdateCbxReportParams: {
      return adapter.updateMany(action.payload.cbxReportParams, state);
    }

    case CbxReportParamActionTypes.DeleteCbxReportParam: {
      return adapter.removeOne(action.payload.id, state);
    }

    case CbxReportParamActionTypes.DeleteCbxReportParams: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case CbxReportParamActionTypes.LoadCbxReportParams: {
      return adapter.addAll(action.payload.cbxReportParams, state);
    }

    case CbxReportParamActionTypes.ClearCbxReportParams: {
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
