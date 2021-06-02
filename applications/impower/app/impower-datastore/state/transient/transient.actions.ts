import { createAction, props } from '@ngrx/store';

export const clearTransientData = createAction(
  '[Transient/API] Clear Data',
  props<{ fullEntityWipe: boolean }>()
);
