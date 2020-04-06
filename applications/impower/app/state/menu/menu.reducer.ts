import {MenuActions, MenuActionTypes} from './menu.actions';

export interface MenuState {
  displayOpenExistingDialog: boolean;
  displayPrintViewDialog: boolean;
  displayCrossbowSitesDialog: boolean;
  displaySendToValassisDigitalDialog: boolean;
}

const initialState: MenuState = {
  displayOpenExistingDialog: false,
  displayPrintViewDialog: false,
  displayCrossbowSitesDialog: false,
  displaySendToValassisDigitalDialog: false,
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
    case MenuActionTypes.OpenExportCrossbowSitesDialog:
      return {
          ...state,
          displayCrossbowSitesDialog: true
      };
    case MenuActionTypes.CloseExportCrossbowSitesDialog:
      return {
        ...state,
        displayCrossbowSitesDialog: false
      };
    case MenuActionTypes.ClientNmaeForValassisDigitalDialog:
       return {
         ...state,
         displaySendToValassisDigitalDialog: true 
       };
    case MenuActionTypes.CloseclientNmaeForValassisDigitalDialog:
       return {
          ...state,
          displaySendToValassisDigitalDialog: false
       };     
    default:
      return state;
  }
}
