import { Action } from '@ngrx/store';

export interface BusyState {
  keys: string[];
  messages: {
    [key: string] : string;
  };
}

const initialState: BusyState = {
  keys: [],
  messages: {}
};

enum BusyStateActionTypes {
  StartBusyIndicator = '[Messaging - Busy] Start Indicator',
  StopBusyIndicator = '[Messaging - Busy] Stop Indicator',
}

export class StartBusyIndicator implements Action {
  readonly type = BusyStateActionTypes.StartBusyIndicator;
  constructor(public payload: { key: string, message: string }){}
}

export class StopBusyIndicator implements Action {
  readonly type = BusyStateActionTypes.StopBusyIndicator;
  constructor(public payload: { key: string }){}
}

export type BusyActions = StartBusyIndicator | StopBusyIndicator;

export function busyReducer(state = initialState, action: BusyActions) : BusyState {
  switch (action.type) {
    case BusyStateActionTypes.StartBusyIndicator:
      return {
        keys: [ ...state.keys, action.payload.key ],
        messages: { ...state.messages, [action.payload.key]: action.payload.message }
      };
    case BusyStateActionTypes.StopBusyIndicator:
      delete state.messages[action.payload.key];
      return {
        keys: state.keys.filter(key => key !== action.payload.key),
        messages: { ...state.messages }
      };
    default:
      return state;
  }
}
