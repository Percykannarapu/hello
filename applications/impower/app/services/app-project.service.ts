import { Injectable } from '@angular/core';
import { isValidNumber } from '@val/common';
import { Observable, of, throwError } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';
import { RestResponse } from '../models/RestResponse';
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
              private impLocationService: ImpGeofootprintLocationService,
              private domainFactory: ImpDomainFactoryService,
              private logger: AppLoggingService,
              private restService: RestDataService) {
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
    const projectToSave = project == null ? this.impProjectService.get()[0] : project;
    if (projectToSave == null) return of(null as number);
    this.cleanupProject(projectToSave);
    return this.saveImpl(projectToSave).pipe(
      map(response => Number(response.payload)),
      switchMap(id => isValidNumber(id) ? of(id) : throwError('There was an error saving the project'))
    );
  }

  private saveImpl(project: ImpProject, useMsgPack: boolean = true) : Observable<RestResponse> {
    const endpoint = useMsgPack ? 'impprojectmsgpack' : 'impproject';
    const saveUrl = `v1/targeting/base/${endpoint}/deleteSave`;
    if (useMsgPack) {
      return this.restService.postMessagePack(saveUrl, project);
    } else {
      return this.restService.post(saveUrl, project);
    }
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
    // this line of code is dumb, but necessary
    localProject.impGeofootprintMasters[0].impGeofootprintLocations = [ ...this.impLocationService.get()];
    // remove all Ids except the root Project Id
    localProject.impGeofootprintMasters.forEach(m => {
      m.cgmId = undefined;
      m.projectId = undefined;
    });
    localProject.impProjectPrefs.forEach(pref => {
      pref.projectPrefId = undefined;
      pref.projectId = undefined;
    });
    localProject.impProjectVars.forEach(pv => {
      pv.pvId = undefined;
      pv.projectId = undefined;
      pv.isShadedOnMap = false;
    });
    localProject.getImpGeofootprintLocations().forEach(loc => {
      loc.glId = undefined;
      loc.cgmId = undefined;
      loc.projectId = undefined;
      loc.impGeofootprintLocAttribs.forEach(atr => {
        atr.locAttributeId = undefined;
        atr.glId = undefined;
        atr.cgmId = undefined;
        atr.projectId = undefined;
      });
      // filter out empty location attributes
      loc.impGeofootprintLocAttribs = loc.impGeofootprintLocAttribs.filter(atr => atr.attributeValue !== '' && atr.attributeValue != null);
    });
    localProject.getImpGeofootprintTradeAreas().forEach(ta => {
      ta.gtaId = undefined;
      ta.glId = undefined;
      ta.cgmId = undefined;
      ta.projectId = undefined;
      // remove geovars
      ta.impGeofootprintVars = [];
    });
    localProject.getImpGeofootprintGeos().forEach(geo => {
      geo.ggId = undefined;
      geo.gtaId = undefined;
      geo.glId = undefined;
      geo.cgmId = undefined;
      geo.projectId = undefined;
      // clear out filter reasons
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

  public updateProjectId(id: number) {
    if (this.currentProjectRef != null && this.currentProjectRef.projectId !== id) {
      this.currentProjectRef.projectId = id;
      this.impProjectService.makeDirty();
    }
  }
}
