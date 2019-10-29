import {MenuActions, MenuActionTypes} from './menu.actions';

export interface MenuState {
  displayOpenExistingDialog: boolean;
  displayPrintViewDialog: boolean;
}

const initialState: MenuState = {
  displayOpenExistingDialog: false,
  displayPrintViewDialog: false
};

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
