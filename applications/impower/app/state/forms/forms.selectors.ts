import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';
import { FormsState } from './forms.interfaces';

export interface FormSelectorProps { path: keyof FormsState; }

const getFormsSlice = createSelector(impowerAppSlice, state => state.forms);
export const getNamedForm = createSelector(getFormsSlice, (state, props: FormSelectorProps) => state[props.path]);
