import { ImpProjectPayload } from '../../../worker-shared/data-model/payloads/imp-project-payload';
import { ImpGeofootprintGeoState } from '../../../worker-shared/data-model/state/imp-geofootprint-geo-state';
import { ImpGeofootprintLocAttribState } from '../../../worker-shared/data-model/state/imp-geofootprint-loc-attrib-state';
import { ImpGeofootprintLocationState } from '../../../worker-shared/data-model/state/imp-geofootprint-location-state';
import { ImpGeofootprintMasterState } from '../../../worker-shared/data-model/state/imp-geofootprint-master-state';
import { ImpGeofootprintTradeAreaState } from '../../../worker-shared/data-model/state/imp-geofootprint-trade-area-state';
import { ImpProjectPrefState } from '../../../worker-shared/data-model/state/imp-project-pref-state';
import { ImpProjectState } from '../../../worker-shared/data-model/state/imp-project-state';
import { ImpProjectVarState } from '../../../worker-shared/data-model/state/imp-project-var-state';
import { NormalizedPayload } from '../services/normalized-payload';
import { simpleFlatten } from '@val/common';

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
