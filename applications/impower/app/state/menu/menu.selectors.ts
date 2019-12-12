import {createSelector} from '@ngrx/store';
import {LocalAppState} from '../app.interfaces';

const getMenuSlice = (state: LocalAppState) => state.menu;

export const openExistingDialogFlag = createSelector(getMenuSlice, state => state.displayOpenExistingDialog);
export const printViewDialogFlag = createSelector(getMenuSlice, state => state.displayPrintViewDialog);
export const openExportCrossbowSitesFlag = createSelector(getMenuSlice, state => state.displayCrossbowSitesDialog);