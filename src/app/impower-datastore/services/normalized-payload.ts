import { ImpProjectState } from '../state/models/imp-project-state';
import { ImpProjectPrefState } from '../state/models/imp-project-pref-state';
import { ImpProjectVarState } from '../state/models/imp-project-var-state';
import { ImpGeofootprintMasterState } from '../state/models/imp-geofootprint-master-state';
import { ImpGeofootprintLocationState } from '../state/models/imp-geofootprint-location-state';
import { ImpGeofootprintLocAttribState } from '../state/models/imp-geofootprint-loc-attrib-state';
import { ImpGeofootprintTradeAreaState } from '../state/models/imp-geofootprint-trade-area-state';
import { ImpGeofootprintGeoState } from '../state/models/imp-geofootprint-geo-state';

export interface NormalizedPayload {
  impProjects: ImpProjectState[];
  impProjectPrefs: ImpProjectPrefState[];
  impProjectVars: ImpProjectVarState[];
  impGeofootprintMasters: ImpGeofootprintMasterState[];
  impGeofootprintLocations: ImpGeofootprintLocationState[];
  impGeofootprintLocAttribs: ImpGeofootprintLocAttribState[];
  impGeofootprintTradeAreas: ImpGeofootprintTradeAreaState[];
  impGeofootprintGeos: ImpGeofootprintGeoState[];
}
