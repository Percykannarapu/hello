import { ImpProjectPayload } from '../payload-models/imp-project-payload';
import { ImpProjectState } from '../state/models/imp-project-state';
import { simpleFlatten } from '../../val-modules/common/common.utils';
import { ImpProjectVarState } from '../state/models/imp-project-var-state';
import { ImpProjectPrefState } from '../state/models/imp-project-pref-state';
import { ImpGeofootprintMasterState } from '../state/models/imp-geofootprint-master-state';
import { ImpGeofootprintLocationState } from '../state/models/imp-geofootprint-location-state';
import { ImpGeofootprintLocAttribState } from '../state/models/imp-geofootprint-loc-attrib-state';
import { ImpGeofootprintTradeAreaState } from '../state/models/imp-geofootprint-trade-area-state';
import { ImpGeofootprintGeoState } from '../state/models/imp-geofootprint-geo-state';
import { NormalizedPayload } from '../services/normalized-payload';

/**
 * Converts a de-normalized full hierarchy into a normalized entity-state representation
 * @param payload - The de-normalized full hierarchy
 */
export function normalize(payload: ImpProjectPayload) : NormalizedPayload {
  if (payload == null) throw new Error('Cannot normalize a null or undefined payload');
  const flatLocations = simpleFlatten((payload.impGeofootprintMasters || []).map(m => m.impGeofootprintLocations));
  const flatLocAttribs = simpleFlatten(flatLocations.map(l => l.impGeofootprintLocAttribs));
  const flatTradeAreas = simpleFlatten(flatLocations.map(l => l.impGeofootprintTradeAreas));
  const flatGeos = simpleFlatten(flatTradeAreas.map(ta => ta.impGeofootprintGeos));
  return {
    impProjects: [new ImpProjectState(payload)],
    impProjectVars: (payload.impProjectVars || []).map(v => new ImpProjectVarState(v)),
    impProjectPrefs: (payload.impProjectPrefs || []).map(p => new ImpProjectPrefState(p)),
    impGeofootprintMasters: (payload.impGeofootprintMasters || []).map(m => new ImpGeofootprintMasterState(m)),
    impGeofootprintLocations: flatLocations.map(l => new ImpGeofootprintLocationState(l)),
    impGeofootprintLocAttribs: flatLocAttribs.map(la => new ImpGeofootprintLocAttribState(la)),
    impGeofootprintTradeAreas: flatTradeAreas.map(ta => new ImpGeofootprintTradeAreaState(ta)),
    impGeofootprintGeos: flatGeos.map(geo => new ImpGeofootprintGeoState(geo))
  };
}
