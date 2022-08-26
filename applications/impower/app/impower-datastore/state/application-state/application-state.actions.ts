import { createAction, props } from '@ngrx/store';

export const setNetworkStatus = createAction(
  '[Application State] Set Network Status',
  props<{ isOnline: boolean }>()
);


