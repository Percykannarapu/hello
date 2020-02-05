import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';
import { FormsState } from './forms.interfaces';

export interface FormSelectorProps { path: keyof FormsState; nestedIdentifier?: string; }

const getFormsSlice = createSelector(impowerAppSlice, state => state.forms);
export const getNamedForm = createSelector(getFormsSlice, (state, props: FormSelectorProps) => {
  if (props.nestedIdentifier == null) {
    return state[props.path];
  } else {
    return state[props.path][props.nestedIdentifier];
  }
});
