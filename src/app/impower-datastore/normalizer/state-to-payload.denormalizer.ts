import { ImpowerPersistentState } from '../state/persistent';
import { ImpProjectPayload } from '../payload-models/imp-project-payload';
import { ImpGeofootprintMasterPayload } from '../payload-models/imp-geofootprint-master-payload';
import { ImpGeofootprintMasterState } from '../state/models/imp-geofootprint-master-state';
import { ImpGeofootprintLocationPayload } from '../payload-models/imp-geofootprint-location-payload';
import { ImpProjectState } from '../state/models/imp-project-state';
import { ImpGeofootprintLocationState } from '../state/models/imp-geofootprint-location-state';
import { ImpGeofootprintTradeAreaPayload } from '../payload-models/imp-geofootprint-trade-area-payload';

/**
 * Converts a fully normalized entity-state representation into a de-normalized full hierarchy representation
 * @param state - The normalized entity-state representation
 */
export function denormalize(state: ImpowerPersistentState) : ImpProjectPayload {
  if (state == null) throw new Error('Cannot denormalize a null or undefined State');
  const currentProject = state.impProjects.entities[state.impProjects.ids[0]];
  return {
    ...currentProject,
    impProjectPrefs: currentProject.impProjectPrefs.map(id => state.impProjectPrefs.entities[id]),
    impProjectVars: currentProject.impProjectVars.map(id => state.impProjectVars.entities[id]),
    impGeofootprintMasters: denormalizeMasters(currentProject, state),
  };
}

function denormalizeMasters(parent: ImpProjectState, state: ImpowerPersistentState) : ImpGeofootprintMasterPayload[] {
  const currentMasters = parent.impGeofootprintMasters.map(id => state.impGeofootprintMasters.entities[id]);
  return currentMasters.map(m => ({
    ...m,
    impGeofootprintLocations: denormalizeLocations(m, state)
  }));
}

function denormalizeLocations(parent: ImpGeofootprintMasterState, state: ImpowerPersistentState) : ImpGeofootprintLocationPayload[] {
  const currentLocations = parent.impGeofootprintLocations.map(id => state.impGeofootprintLocations.entities[id]);
  return currentLocations.map(l => ({
    ...l,
    impGeofootprintLocAttribs: l.impGeofootprintLocAttribs.map(id => state.impGeofootprintLocAttribs.entities[id]),
    impGeofootprintTradeAreas: denormalizeTradeAreas(l, state)
  }));
}

function denormalizeTradeAreas(parent: ImpGeofootprintLocationState, state: ImpowerPersistentState) : ImpGeofootprintTradeAreaPayload[] {
  const currentTradeAreas = parent.impGeofootprintTradeAreas.map(id => state.impGeofootprintTradeAreas.entities[id]);
  return currentTradeAreas.map(ta => ({
    ...ta,
    impGeofootprintGeos: ta.impGeofootprintGeos.map(id => state.impGeofootprintGeos.entities[id])
  }));
}
