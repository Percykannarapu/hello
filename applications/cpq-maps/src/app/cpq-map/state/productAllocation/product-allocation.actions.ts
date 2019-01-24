import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { ProductAllocation } from '../../../val-modules/mediaexpress/models/ProductAllocation';

export enum ProductAllocationActionTypes {
  LoadProductAllocations = '[ProductAllocation] Load ProductAllocations',
  AddProductAllocation = '[ProductAllocation] Add ProductAllocation',
  UpsertProductAllocation = '[ProductAllocation] Upsert ProductAllocation',
  AddProductAllocations = '[ProductAllocation] Add ProductAllocations',
  UpsertProductAllocations = '[ProductAllocation] Upsert ProductAllocations',
  UpdateProductAllocation = '[ProductAllocation] Update ProductAllocation',
  UpdateProductAllocations = '[ProductAllocation] Update ProductAllocations',
  DeleteProductAllocation = '[ProductAllocation] Delete ProductAllocation',
  DeleteProductAllocations = '[ProductAllocation] Delete ProductAllocations',
  ClearProductAllocations = '[ProductAllocation] Clear ProductAllocations'
}

export class LoadProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.LoadProductAllocations;

  constructor(public payload: { productAllocations: ProductAllocation[] }) {}
}

export class AddProductAllocation implements Action {
  readonly type = ProductAllocationActionTypes.AddProductAllocation;

  constructor(public payload: { productAllocation: ProductAllocation }) {}
}

export class UpsertProductAllocation implements Action {
  readonly type = ProductAllocationActionTypes.UpsertProductAllocation;

  constructor(public payload: { productAllocation: ProductAllocation }) {}
}

export class AddProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.AddProductAllocations;

  constructor(public payload: { productAllocations: ProductAllocation[] }) {}
}

export class UpsertProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.UpsertProductAllocations;

  constructor(public payload: { productAllocations: ProductAllocation[] }) {}
}

export class UpdateProductAllocation implements Action {
  readonly type = ProductAllocationActionTypes.UpdateProductAllocation;

  constructor(public payload: { productAllocation: Update<ProductAllocation> }) {}
}

export class UpdateProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.UpdateProductAllocations;

  constructor(public payload: { productAllocations: Update<ProductAllocation>[] }) {}
}

export class DeleteProductAllocation implements Action {
  readonly type = ProductAllocationActionTypes.DeleteProductAllocation;

  constructor(public payload: { id: string }) {}
}

export class DeleteProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.DeleteProductAllocations;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearProductAllocations implements Action {
  readonly type = ProductAllocationActionTypes.ClearProductAllocations;
}

export type ProductAllocationActions =
 LoadProductAllocations
 | AddProductAllocation
 | UpsertProductAllocation
 | AddProductAllocations
 | UpsertProductAllocations
 | UpdateProductAllocation
 | UpdateProductAllocations
 | DeleteProductAllocation
 | DeleteProductAllocations
 | ClearProductAllocations;
