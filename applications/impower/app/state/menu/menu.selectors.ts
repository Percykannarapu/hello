import { createSelector } from '@ngrx/store';
import { impowerAppSlice } from '../app.reducer';

const getMenuSlice = createSelector(impowerAppSlice, state => state.menu);

export const openExistingDialogFlag = createSelector(getMenuSlice, state => state.displayOpenExistingDialog);
export const printViewDialogFlag = createSelector(getMenuSlice, state => state.displayPrintViewDialog);
export const openExportCrossbowSitesFlag = createSelector(getMenuSlice, state => state.displayCrossbowSitesDialog);
