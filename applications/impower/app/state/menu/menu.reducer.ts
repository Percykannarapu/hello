import { MenuActions, MenuActionTypes } from './menu.actions';
import { createSelector } from '@ngrx/store';
import { getMenuSlice } from '../app.interfaces';

export interface MenuState {
  displayOpenExistingDialog: boolean;
}

const initialState: MenuState = {
  displayOpenExistingDialog: false
};

export const openExistingDialogFlag = createSelector(getMenuSlice, state => state.displayOpenExistingDialog);

export function menuReducer(state = initialState, action: MenuActions) {
  switch (action.type) {
    case MenuActionTypes.OpenExistingProjectDialog:
      return {
        ...state,
        displayOpenExistingDialog: true
      };
    case MenuActionTypes.CloseExistingProjectDialog:
      return {
        ...state,
        displayOpenExistingDialog: false
      };
    default:
      return state;
  }
}
