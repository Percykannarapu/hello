import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { CbxReportType } from '../../../val-modules/mediaexpress/models/CbxReportType';
import { CbxReportTypeActions, CbxReportTypeActionTypes } from './cbx-report-type.actions';

export interface CbxReportTypeState extends EntityState<CbxReportType> {
  // additional entities state properties
}

export const adapter: EntityAdapter<CbxReportType> = createEntityAdapter<CbxReportType>({
  sortComparer: false,
  selectId: model => model.reportTypeCode
});

export const initialState: CbxReportTypeState = adapter.getInitialState({
  // additional entity state properties
});

export function cbxReportTypeReducer(state = initialState, action: CbxReportTypeActions) : CbxReportTypeState {
  switch (action.type) {
    case CbxReportTypeActionTypes.AddCbxReportType: {
      return adapter.addOne(action.payload.cbxReportType, state);
    }

    case CbxReportTypeActionTypes.UpsertCbxReportType: {
      return adapter.upsertOne(action.payload.cbxReportType, state);
    }

    case CbxReportTypeActionTypes.AddCbxReportTypes: {
      return adapter.addMany(action.payload.cbxReportTypes, state);
    }

    case CbxReportTypeActionTypes.UpsertCbxReportTypes: {
      return adapter.upsertMany(action.payload.cbxReportTypes, state);
    }

    case CbxReportTypeActionTypes.UpdateCbxReportType: {
      return adapter.updateOne(action.payload.cbxReportType, state);
    }

    case CbxReportTypeActionTypes.UpdateCbxReportTypes: {
      return adapter.updateMany(action.payload.cbxReportTypes, state);
    }

    case CbxReportTypeActionTypes.DeleteCbxReportType: {
      return adapter.removeOne(action.payload.id, state);
    }

    case CbxReportTypeActionTypes.DeleteCbxReportTypes: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case CbxReportTypeActionTypes.LoadCbxReportTypes: {
      return adapter.addAll(action.payload.cbxReportTypes, state);
    }

    case CbxReportTypeActionTypes.ClearCbxReportTypes: {
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
