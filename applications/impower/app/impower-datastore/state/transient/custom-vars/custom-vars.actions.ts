import { createAction, props } from '@ngrx/store';
import { DynamicVariable } from '../dynamic-variable.model';

export const loadCustomVars = createAction(
  '[CustomVars/API] Load CustomVars',
  props<{ customVars: DynamicVariable[] }>()
);

export const mergeCustomVars = createAction(
  '[CustomVars/API] Merge CustomVars',
  props<{ customVars: DynamicVariable[] }>()
);

export const clearCustomVars = createAction(
  '[CustomVars/API] Clear CustomVars'
);
