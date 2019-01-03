import { Action, ActionReducer, ActionReducerMap, combineReducers } from '@ngrx/store';
import * as fromProject from './project/imp-project.reducer';
import * as fromProjectVar from './projectVar/imp-project-var.reducer';
import * as fromProjectPref from './projectPref/imp-project-pref.reducer';
import * as fromMaster from './master/imp-geofootprint-master.reducer';
import * as fromLocation from './location/imp-geofootprint-location.reducer';
import * as fromLocationAttrs from './locationAttribute/imp-geofootprint-loc-attrib.reducer';
import * as fromTradeArea from './tradeArea/imp-geofootprint-trade-area.reducer';
import * as fromGeo from './geo/imp-geofootprint-geo.reducer';

export interface ImpowerPersistentState {
  impProjects: fromProject.State;
  impProjectVars: fromProjectVar.State;
  impProjectPrefs: fromProjectPref.State;
  impGeofootprintMasters: fromMaster.State;
  impGeofootprintLocations: fromLocation.State;
  impGeofootprintLocAttribs: fromLocationAttrs.State;
  impGeofootprintTradeAreas: fromTradeArea.State;
  impGeofootprintGeos: fromGeo.State;
}

const persistentReducers: ActionReducerMap<ImpowerPersistentState> = {
  impProjects: fromProject.reducer,
  impProjectPrefs: fromProjectPref.reducer,
  impProjectVars: fromProjectVar.reducer,
  impGeofootprintMasters: fromMaster.reducer,
  impGeofootprintLocations: fromLocation.reducer,
  impGeofootprintLocAttribs: fromLocationAttrs.reducer,
  impGeofootprintTradeAreas: fromTradeArea.reducer,
  impGeofootprintGeos: fromGeo.reducer
};

const metaReducer: ActionReducer<ImpowerPersistentState, Action> = combineReducers(persistentReducers);

export function reducer(state: ImpowerPersistentState, action: Action) : ImpowerPersistentState {
  return metaReducer(state, action);
}
