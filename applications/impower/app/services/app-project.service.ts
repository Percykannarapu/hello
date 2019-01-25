import { Injectable } from '@angular/core';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppLoggingService } from './app-logging.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';

@Injectable()
export class AppProjectService {

  public currentProject$: Observable<ImpProject>;

  constructor(private impProjectService: ImpProjectService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private restService: RestDataService,
              private impLocationService: ImpGeofootprintLocationService,
              private store$: Store<LocalAppState>) {
    this.currentProject$ = this.impProjectService.storeObservable.pipe(
      filter(projects => projects != null && projects.length > 0 && projects[0] != null),
      map(projects => projects[0]),
    );
  }

  load(id: number) : Observable<number> {
    return this.impProjectService.loadFromServer(id);
  }

  save(project?: ImpProject) : Observable<number> {
    const localProject = project == null ? this.impProjectService.get()[0] : project;
    const saveUrl = 'v1/targeting/base/impproject/deleteSave';
    localProject.impGeofootprintMasters[0].impGeofootprintLocations = this.impLocationService.get();
    this.cleanupProject(localProject);
    this.logger.info('Project being saved', JSON.stringify(localProject));
    return this.restService.post(saveUrl, localProject).pipe(
      map(response => Number(response.payload))
    );
  }

  createNew() : number {
    const newProject = this.domainFactory.createProject();
    this.impProjectService.load([newProject]);
    return newProject.projectId;
  }

  validateProject(impProject: ImpProject) : string[] {
    const errors: string[] = [];
    if (impProject.projectName == null || impProject.projectName === '')
      errors.push('imPower Project Name is required');
    if (impProject.methAnalysis == null || impProject.methAnalysis === '')
      errors.push('Analysis Level is required');
    return errors;
  }

  private cleanupProject(localProject: ImpProject) {
    // filter out empty location attributes
    localProject.getImpGeofootprintLocations().forEach(loc => {
      loc.impGeofootprintLocAttribs = loc.impGeofootprintLocAttribs.filter(atr => atr.attributeValue !== '');
    });
    // remove geovars
    localProject.getImpGeofootprintTradeAreas().forEach(ta => {
      ta.impGeofootprintVars = [];
    });
  }

}
