import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { PpToWrapPage } from '../../../val-modules/mediaexpress/models/PpToWrapPage';
import { PpToWrapPageActions, PpToWrapPageActionTypes } from './pp-to-wrap-page.actions';

export interface PpToWrapPageState extends EntityState<PpToWrapPage> {
  // additional entities state properties
}

export const adapter: EntityAdapter<PpToWrapPage> = createEntityAdapter<PpToWrapPage>({
  sortComparer: false,
  selectId: model => model.pptwpId
});

export const initialState: PpToWrapPageState = adapter.getInitialState({
  // additional entity state properties
});

export function ppToWrapPageReducer(state = initialState, action: PpToWrapPageActions) : PpToWrapPageState {
  switch (action.type) {
    case PpToWrapPageActionTypes.AddPpToWrapPage: {
      return adapter.addOne(action.payload.ppToWrapPage, state);
    }

    case PpToWrapPageActionTypes.UpsertPpToWrapPage: {
      return adapter.upsertOne(action.payload.ppToWrapPage, state);
    }

    case PpToWrapPageActionTypes.AddPpToWrapPages: {
      return adapter.addMany(action.payload.ppToWrapPages, state);
    }

    case PpToWrapPageActionTypes.UpsertPpToWrapPages: {
      return adapter.upsertMany(action.payload.ppToWrapPages, state);
    }

    case PpToWrapPageActionTypes.UpdatePpToWrapPage: {
      return adapter.updateOne(action.payload.ppToWrapPage, state);
    }

    case PpToWrapPageActionTypes.UpdatePpToWrapPages: {
      return adapter.updateMany(action.payload.ppToWrapPages, state);
    }

    case PpToWrapPageActionTypes.DeletePpToWrapPage: {
      return adapter.removeOne(action.payload.id, state);
    }

    case PpToWrapPageActionTypes.DeletePpToWrapPages: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case PpToWrapPageActionTypes.LoadPpToWrapPages: {
      return adapter.setAll(action.payload.ppToWrapPages, state);
    }

    case PpToWrapPageActionTypes.ClearPpToWrapPages: {
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
