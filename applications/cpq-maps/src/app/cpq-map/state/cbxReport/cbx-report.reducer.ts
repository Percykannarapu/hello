import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { CbxReport } from '../../../val-modules/mediaexpress/models/CbxReport';
import { CbxReportActions, CbxReportActionTypes } from './cbx-report.actions';

export interface CbxReportState extends EntityState<CbxReport> {
  // additional entities state properties
}

export const adapter: EntityAdapter<CbxReport> = createEntityAdapter<CbxReport>({
  sortComparer: false,
  selectId: model => model.reportRunId
});

export const initialState: CbxReportState = adapter.getInitialState({
  // additional entity state properties
});

export function cbxReportReducer(state = initialState, action: CbxReportActions) : CbxReportState {
  switch (action.type) {
    case CbxReportActionTypes.AddCbxReport: {
      return adapter.addOne(action.payload.cbxReport, state);
    }

    case CbxReportActionTypes.UpsertCbxReport: {
      return adapter.upsertOne(action.payload.cbxReport, state);
    }

    case CbxReportActionTypes.AddCbxReports: {
      return adapter.addMany(action.payload.cbxReports, state);
    }

    case CbxReportActionTypes.UpsertCbxReports: {
      return adapter.upsertMany(action.payload.cbxReports, state);
    }

    case CbxReportActionTypes.UpdateCbxReport: {
      return adapter.updateOne(action.payload.cbxReport, state);
    }

    case CbxReportActionTypes.UpdateCbxReports: {
      return adapter.updateMany(action.payload.cbxReports, state);
    }

    case CbxReportActionTypes.DeleteCbxReport: {
      return adapter.removeOne(action.payload.id, state);
    }

    case CbxReportActionTypes.DeleteCbxReports: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case CbxReportActionTypes.LoadCbxReports: {
      return adapter.addAll(action.payload.cbxReports, state);
    }

    case CbxReportActionTypes.ClearCbxReports: {
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
