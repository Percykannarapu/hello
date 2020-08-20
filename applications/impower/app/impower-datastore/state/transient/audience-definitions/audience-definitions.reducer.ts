import { Action, ActionReducer, ActionReducerMap, combineReducers, createAction, props } from '@ngrx/store';
import * as fromInMarket from './in-market/in-market-audience.reducer';
import * as fromInterest from './interest/interest-audience.reducer';
import * as fromPixel from './pixel/pixel-audience.reducer';
import * as fromTda from './tda/tda-audience.reducer';
import * as fromVlh from './vlh/vlh-audience.reducer';

export interface State {
  interest: fromInterest.State;
  inMarket: fromInMarket.State;
  vlh: fromVlh.State;
  pixel: fromPixel.State;
  tda: fromTda.State;
}

const audienceDefinitionReducers: ActionReducerMap<State> = {
  interest: fromInterest.reducer,
  inMarket: fromInMarket.reducer,
  vlh: fromVlh.reducer,
  pixel: fromPixel.reducer,
  tda: fromTda.reducer,
};

export const definitionFetchFailure = createAction(
  '[Audience/API] Fetch Definition Failure',
  props<{ message: string, err: any }>()
);

const metaReducer: ActionReducer<State> = combineReducers(audienceDefinitionReducers);

export function reducer(state: State, action: Action) : State {
  return metaReducer(state, action);
}
