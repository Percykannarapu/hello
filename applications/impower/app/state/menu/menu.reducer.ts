import { MenuActions, MenuActionTypes } from './menu.actions';
import { createSelector } from '@ngrx/store';
import { getMenuSlice } from '../app.interfaces';

export interface MenuState {
  displayOpenExistingDialog: boolean;
  displayPrintViewDialog: boolean;
}

const initialState: MenuState = {
  displayOpenExistingDialog: false,
  displayPrintViewDialog: false
};

export const openExistingDialogFlag = createSelector(getMenuSlice, state => state.displayOpenExistingDialog);

export const printViewDialogFlag = createSelector(getMenuSlice, state => state.displayPrintViewDialog);

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
    case MenuActionTypes.OpenPrintViewDialog:
      return {
        ...state,
        displayPrintViewDialog: true
      };
      case MenuActionTypes.ClosePrintViewDialog:
        return {
          ...state,
          displayPrintViewDialog: false
        };
    default:
      return state;
  }
}
