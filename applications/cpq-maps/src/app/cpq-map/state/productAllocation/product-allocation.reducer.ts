import { EntityState, EntityAdapter, createEntityAdapter } from '@ngrx/entity';
import { ProductAllocation } from '../../../val-modules/mediaexpress/models/ProductAllocation';
import { ProductAllocationActions, ProductAllocationActionTypes } from './product-allocation.actions';
import { SharedActions, SharedActionTypes } from '../shared/shared.actions';

export interface ProductAllocationState extends EntityState<ProductAllocation> {
  // additional entities state properties
}

export const adapter: EntityAdapter<ProductAllocation> = createEntityAdapter<ProductAllocation>();

export const initialState: ProductAllocationState = adapter.getInitialState({
  // additional entity state properties
});

type reducerActions = ProductAllocationActions | SharedActions;

export function productAllocationReducer(state = initialState, action: reducerActions) : ProductAllocationState {
  switch (action.type) {
    case SharedActionTypes.LoadEntityGraph: {
      if (action.payload.normalizedEntities.productAllocations != null)
        return adapter.addAll(action.payload.normalizedEntities.productAllocations, state);
      else
        return state;
    }

    case ProductAllocationActionTypes.AddProductAllocation: {
      return adapter.addOne(action.payload.productAllocation, state);
    }

    case ProductAllocationActionTypes.UpsertProductAllocation: {
      return adapter.upsertOne(action.payload.productAllocation, state);
    }

    case ProductAllocationActionTypes.AddProductAllocations: {
      return adapter.addMany(action.payload.productAllocations, state);
    }

    case ProductAllocationActionTypes.UpsertProductAllocations: {
      return adapter.upsertMany(action.payload.productAllocations, state);
    }

    case ProductAllocationActionTypes.UpdateProductAllocation: {
      return adapter.updateOne(action.payload.productAllocation, state);
    }

    case ProductAllocationActionTypes.UpdateProductAllocations: {
      return adapter.updateMany(action.payload.productAllocations, state);
    }

    case ProductAllocationActionTypes.DeleteProductAllocation: {
      return adapter.removeOne(action.payload.id, state);
    }

    case ProductAllocationActionTypes.DeleteProductAllocations: {
      return adapter.removeMany(action.payload.ids, state);
    }

    case ProductAllocationActionTypes.LoadProductAllocations: {
      return adapter.addAll(action.payload.productAllocations, state);
    }

    case ProductAllocationActionTypes.ClearProductAllocations: {
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
