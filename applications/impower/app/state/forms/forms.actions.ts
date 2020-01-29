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
