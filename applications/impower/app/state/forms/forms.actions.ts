import { createAction, props } from '@ngrx/store';
import { FormsState } from './forms.interfaces';

export const loadForms = createAction(
  '[Forms] Load Forms'
);

export const updateNamedForm = createAction(
  '[Forms] Update Named Form',
  props<{ path: keyof FormsState, formData: any }>()
);

export const resetNamedForm = createAction(
  '[Forms] Reset Named Form',
  props<{ path: keyof FormsState }>()
);

export const updateNestedForm = createAction(
  '[Forms] Update Nested Form',
  props<{ root: keyof FormsState, identifier: string, formData: any }>()
);

export const resetNestedForm = createAction(
  '[Forms] Reset Nested Form',
  props<{ root: keyof FormsState, identifier: string }>()
);

export const removeNestedForm = createAction(
  '[Forms] Remove Nested Form',
  props<{ root: keyof FormsState, identifier: string }>()
);
