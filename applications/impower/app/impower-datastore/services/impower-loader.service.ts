import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { ImpProjectPayload } from '../../../worker-shared/data-model/payloads/imp-project-payload';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/operators';
import { normalize } from '../normalizer/payload-to-state.normalizer';
import { ImpowerPersistentState } from '../state/persistent/persistent.reducer';
import { NormalizedPayload } from './normalized-payload';
// import { denormalize } from '../normalizer/state-to-payload.denormalizer';
import { StateModelFactoryService } from './state-model-factory.service';

@Injectable({
  providedIn: 'root'
})
export class ImpowerLoaderService {

  readonly loadUrl: string = 'v1/targeting/base/impproject/load';
  readonly saveUrl: string = 'v1/targeting/base/impproject/deleteSave';

  constructor(private restService: RestDataService,
              private factory: StateModelFactoryService) {}

  loadFullProject(id: number) : Observable<ImpProjectPayload> {
    if (id == null || id < 0) return EMPTY;
    return this.restService.get(`${this.loadUrl}/${id}`).pipe(
      map(response => response.payload as ImpProjectPayload)
    );
  }

  saveFullProject(project: ImpProjectPayload) : Observable<number> {
    return this.restService.post(this.saveUrl, project).pipe(
      map(response => response.payload)
    );
  }

  createNewProject() : NormalizedPayload {
    const newProject = this.factory.createProject();
    const newMaster = this.factory.createMaster(newProject.projectId);
    // I can do this here because we're still using new instances that aren't part of the store
    newProject.impGeofootprintMasters.push(newMaster.cgmId);

    return {
      impProjects: [newProject],
      impProjectPrefs: [],
      impProjectVars: [],
      impGeofootprintMasters: [newMaster],
      impGeofootprintLocations: [],
      impGeofootprintLocAttribs: [],
      impGeofootprintTradeAreas: [],
      impGeofootprintGeos: []
    };
  }

  normalizeProject(payload: ImpProjectPayload) : NormalizedPayload {
    return normalize(payload);
  }

  denormalizeProject(state: ImpowerPersistentState) : ImpProjectPayload {
    // return denormalize(state);
    return null;
  }
}
