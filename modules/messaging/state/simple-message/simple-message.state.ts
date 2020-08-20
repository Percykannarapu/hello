import { Action } from '@ngrx/store';

export interface SimpleMessageState {
  header: string;
  message: string;
  button: string;
  display: boolean;
}

const initialState: SimpleMessageState = {
  header: '',
  message: '',
  button: 'OK',
  display: false,
};

enum SimpleMessageActionTypes {
  ShowSimpleMessageBox = '[Messaging - Simple Message] Show Dialog',
  HideSimpleMessageBox = '[Messaging - Simple Message] Hide Dialog'
}

export class ShowSimpleMessageBox implements Action {
  readonly type = SimpleMessageActionTypes.ShowSimpleMessageBox;
  constructor(public payload: { message: string, header?: string, button?: string }){}
}

export class HideSimpleMessageBox implements Action {
  readonly type = SimpleMessageActionTypes.HideSimpleMessageBox;
}

export type SimpleMessageActions = ShowSimpleMessageBox | HideSimpleMessageBox;

export function simpleMessageReducer(state = initialState, action: SimpleMessageActions) : SimpleMessageState {
  switch (action.type) {
    case SimpleMessageActionTypes.ShowSimpleMessageBox:
      return {
        ...state,
        ...initialState,
        ...action.payload,
        display: true
      };
    case SimpleMessageActionTypes.HideSimpleMessageBox:
      return {
        ...state,
        ...initialState
      };
    default:
      return state;
  }
}
