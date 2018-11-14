import { Action } from '@ngrx/store';

export enum ConfirmationActionTypes {
  ShowConfirmation = '[Confirmation Messaging] Show Confirmation',
  AcceptConfirmation = '[Confirmation Messaging] Accept Confirmation',
  RejectConfirmation = '[Confirmation Messaging] Reject Confirmation',
  HideConfirmation = '[Confirmation Messaging] Hide Confirmation',
}

export interface ConfirmationPayload {
  title: string;
  message: string;
  canBeClosed: boolean;
  accept: {
    label?: string;
    result: Action | Action[];
  };
  reject: {
    label?: string;
    result: Action | Action[];
  };
}

export class ShowConfirmation implements Action {
  readonly type = ConfirmationActionTypes.ShowConfirmation;
  constructor(public payload: ConfirmationPayload) {}
}

export class AcceptConfirmation implements Action {
  readonly type = ConfirmationActionTypes.AcceptConfirmation;
}

export class RejectConfirmation implements Action {
  readonly type = ConfirmationActionTypes.RejectConfirmation;
}

export class HideConfirmation implements Action {
  readonly type = ConfirmationActionTypes.HideConfirmation;
}

export type ConfirmationActions = ShowConfirmation | AcceptConfirmation | RejectConfirmation | HideConfirmation;
