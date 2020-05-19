import { createReducer, on } from '@ngrx/store';
import * as FormsActions from './forms.actions';
import { FormsState } from './forms.interfaces';

export const initialState: FormsState = {
  addLocation: null,
  marketLocation: null,
  shadingSettings: null
};

export const formsReducer = createReducer(
  initialState,

  on(FormsActions.loadForms, state => state),
  on(FormsActions.updateNamedForm, (state, { path, formData }) => ({ ...state, [path]: { ...state[path], ...formData } })),
  on(FormsActions.resetNamedForm, (state, { path }) => ({ ...state, [path]: initialState[path] })),
  on(FormsActions.updateNestedForm, (state, { root, identifier, formData }) => ({
    ...state,
    [root]: {
      ...state[root],
      [identifier] : {
        ...formData
      }
    }
  })),
  on(FormsActions.resetNestedForm, (state, { root, identifier }) => ({
    ...state,
    [root]: {
      ...state[root],
      [identifier]: null
    }
  })),
  on(FormsActions.removeNestedForm, (state, { root, identifier }) => {
    const removalRoot = { ...state, [root]: { ...state[root] } };
    delete removalRoot[root][identifier];
    return removalRoot;
  })
);
