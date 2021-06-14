import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';


export interface ImpowerPersistentState {

}

const persistentReducers: ActionReducerMap<ImpowerPersistentState> = {

};

const metaReducer: ActionReducer<ImpowerPersistentState, Action> = combineReducers(persistentReducers);

export function reducer(state: ImpowerPersistentState, action: Action) : ImpowerPersistentState {
  return metaReducer(state, action);
}
