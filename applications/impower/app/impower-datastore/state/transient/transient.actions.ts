import { createAction } from '@ngrx/store';

export const clearTransientDataActionType = '[Transient/API] Clear Data';
export const clearTransientData = createAction(
  clearTransientDataActionType
);
