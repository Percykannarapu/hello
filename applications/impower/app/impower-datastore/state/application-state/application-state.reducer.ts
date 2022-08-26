import { createReducer, on } from '@ngrx/store';
import * as ApplicationStateActions from './application-state.actions';

export interface ImpowerApplicationState {
  isOnline: boolean;
}

export const initialState: ImpowerApplicationState = {
  isOnline: true
};

export const reducer = createReducer(
  initialState,

  on(ApplicationStateActions.setNetworkStatus, (state, action) => {
    return { ...state, isOnline: action.isOnline };
  }),
);
