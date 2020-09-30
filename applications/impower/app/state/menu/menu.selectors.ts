import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';

const getMenuSlice = createSelector(impowerAppSlice, state => state.menu);

export const openExistingDialogFlag = createSelector(getMenuSlice, state => state.displayOpenExistingDialog);
export const printViewDialogFlag = createSelector(getMenuSlice, state => state.displayPrintViewDialog);
export const openExportCrossbowSitesFlag = createSelector(getMenuSlice, state => state.displayCrossbowSitesDialog);
export const openSendToValassisDigitalFlag = createSelector(getMenuSlice, state => state.displaySendToValassisDigitalDialog);
export const openImpowerHelpDialog = createSelector(getMenuSlice, state => state.displayImpowerHelpDialog);
