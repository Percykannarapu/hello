import { createReducer, on } from '@ngrx/store';
import * as FormsActions from './forms.actions';
import { FormsState } from './forms.interfaces';

export const initialState: FormsState = {
  addLocation: { number: '' },
  shadingSettings: null
};

export const formsReducer = createReducer(
  initialState,

  on(FormsActions.loadForms, state => state),
  on(FormsActions.updateNamedForm, (state, { path, formData }) => ({ ...state, [path]: { ...state[path], ...formData } })),
  on(FormsActions.resetNamedForm, (state, { path }) => ({ ...state, [path]: { ...initialState[path] }}))
);
