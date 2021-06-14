import { ImpGeofootprintGeoState } from '../../../worker-shared/data-model/state/imp-geofootprint-geo-state';
import { ImpGeofootprintLocAttribState } from '../../../worker-shared/data-model/state/imp-geofootprint-loc-attrib-state';
import { ImpGeofootprintLocationState } from '../../../worker-shared/data-model/state/imp-geofootprint-location-state';
import { ImpGeofootprintMasterState } from '../../../worker-shared/data-model/state/imp-geofootprint-master-state';
import { ImpGeofootprintTradeAreaState } from '../../../worker-shared/data-model/state/imp-geofootprint-trade-area-state';
import { ImpProjectPrefState } from '../../../worker-shared/data-model/state/imp-project-pref-state';
import { ImpProjectState } from '../../../worker-shared/data-model/state/imp-project-state';
import { ImpProjectVarState } from '../../../worker-shared/data-model/state/imp-project-var-state';

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
