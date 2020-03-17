import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintMasterService } from '../val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from '../val-modules/targeting/services/ImpProjectPref.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';

@Injectable()
export class AppProjectService {

  public currentProject$: Observable<ImpProject>;
  public currentNullableProject$: Observable<ImpProject>;

  private currentProjectRef: ImpProject;

  constructor(private impProjectService: ImpProjectService,
              private impProjectPrefService: ImpProjectPrefService,
              private impProjectVarService: ImpProjectVarService,
              private impMasterService: ImpGeofootprintMasterService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private restService: RestDataService,
              private impLocationService: ImpGeofootprintLocationService,
              private config: AppConfig) {
    this.currentNullableProject$ = this.impProjectService.storeObservable.pipe(
      map(projects => projects == null || projects.length === 0 ? null : projects[0])
    );
    this.currentProject$ = this.currentNullableProject$.pipe(
      filter(project => project != null)
    );

    this.currentProject$.subscribe(project => this.currentProjectRef = project);
  }

  load(id: number) : Observable<ImpProject> {
    return this.impProjectService.loadFromServer(id);
  }

  save(project?: ImpProject) : Observable<number> {
    const localProject = project == null ? this.impProjectService.get()[0] : project;
    const saveUrl = 'v1/targeting/base/impprojectmsgpack/deleteSave';
    localProject.impGeofootprintMasters[0].impGeofootprintLocations = this.impLocationService.get();
    this.cleanupProject(localProject);

    return this.restService.postMessagePack(saveUrl, localProject).pipe(
      map(response => Number(response.payload))
    );
  }

  createNew() : number {
    const newProject = this.domainFactory.createProject();
    this.impProjectService.load([newProject]);
    return newProject.projectId;
  }

  clearAll() : void {
    this.impProjectService.startTx();
    this.impProjectService.clearAll();
    this.impProjectPrefService.clearAll();
    this.impProjectVarService.clearAll();
    this.impMasterService.clearAll();
  }

  finalizeClear() : void {
    this.impProjectService.stopTx();
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
    localProject.getImpGeofootprintGeos().forEach(geo => {
      geo['filterReasons'] = undefined;
    });
  }

  public updateMergeType(mergeType: TradeAreaMergeTypeCodes, siteType: SuccessfulLocationTypeCodes) : void {
    if (mergeType == null) return;
    switch (siteType) {
      case ImpClientLocationTypeCodes.Competitor:
        this.currentProjectRef.taCompetitorMergeType = mergeType;
        break;
      case ImpClientLocationTypeCodes.Site:
        this.currentProjectRef.taSiteMergeType = mergeType;
        break;
    }
    this.impProjectService.makeDirty();
  }
}
