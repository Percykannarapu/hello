import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Action } from '@ngrx/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LiveIndicatorService } from '../../core/live-indicator.service';

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
  StartLiveIndicator = '[Messaging - Live] Start Indicator',
  StopLiveIndicator = '[Messaging - Live] Stop Indicator',

  CrashStopBusyIndicator = '[Messaging - Busy] Crash Stop'
}

export class StartBusyIndicator implements Action {
  readonly type = BusyStateActionTypes.StartBusyIndicator;
  constructor(public payload: { key: string, message: string }){}
}

export class StopBusyIndicator implements Action {
  readonly type = BusyStateActionTypes.StopBusyIndicator;
  constructor(public payload: { key: string }){}
}

export class CrashStopBusyIndicator implements Action {
  readonly type = BusyStateActionTypes.CrashStopBusyIndicator;
}

export class StartLiveIndicator implements Action {
  readonly type = BusyStateActionTypes.StartLiveIndicator;
  constructor(public payload: { key: string, messageSource: Observable<string> }){}
}

export class StopLiveIndicator implements Action {
  readonly type = BusyStateActionTypes.StopLiveIndicator;
  constructor(public payload: { key: string }){}
}

export type BusyActions = StartBusyIndicator | StopBusyIndicator | CrashStopBusyIndicator | StartLiveIndicator | StopLiveIndicator;

export function busyReducer(state = initialState, action: BusyActions) : BusyState {
  switch (action.type) {
    case BusyStateActionTypes.CrashStopBusyIndicator:
      return { ...initialState };
    case BusyStateActionTypes.StartBusyIndicator:
      return {
        keys: [ ...state.keys, action.payload.key ],
        messages: { ...state.messages, [action.payload.key]: action.payload.message }
      };
    case BusyStateActionTypes.StopBusyIndicator:
      const newState = {
        keys: state.keys.filter(key => key !== action.payload.key),
        messages: { ...state.messages }
      };
      delete newState.messages[action.payload.key];
      return newState;
    default:
      return state;
  }
}

@Injectable()
export class BusyEffects {

  @Effect({ dispatch: false })
  start$ = this.actions$.pipe(
    ofType<StartLiveIndicator>(BusyStateActionTypes.StartLiveIndicator),
    tap(action => this.service.addSource(action.payload.key, action.payload.messageSource))
  );

  @Effect({ dispatch: false })
  stop$ = this.actions$.pipe(
    ofType<StopLiveIndicator>(BusyStateActionTypes.StopLiveIndicator),
    tap(action => this.service.removeSource(action.payload.key))
  );

  constructor(private actions$: Actions,
              private service: LiveIndicatorService) {
  }
}
