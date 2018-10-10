import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, merge } from 'rxjs';
import { map, tap, filter, startWith, debounceTime } from 'rxjs/operators';
import { UsageService } from './usage.service';
import { AppMessagingService } from './app-messaging.service';
import { AppConfig } from '../app.config';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import * as XLSX from 'xlsx';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppStateService } from './app-state.service';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { DAOBaseStatus } from '../val-modules/api/models/BaseModel';
import { AppProjectService } from './app-project.service';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';

export type audienceSource = (analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, audience?: AudienceDataDefinition) => Observable<ImpGeofootprintVar[]>;
export type nationalSource = (analysisLevel: string, identifier: string) => Observable<any[]>;

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceService implements OnDestroy {

  // This field is being used to maintain the sort order for the audiences grid
  // As each new audience is created it will get assinged the current value
  // of this number and increment it, then when we save this value will be
  // saved in the database and when we load we will know what order to populate the grid in
  public static audienceCounter: number = 0;

  private readonly spinnerKey: string = 'TargetAudienceServiceKey';

  private newSelectedGeos$: Observable<string[]>;
  private newVisibleGeos$: Observable<string[]>;

  private nationalSources = new Map<string, nationalSource>();
  private audienceSources = new Map<string, audienceSource>();
  public audienceMap: Map<string, AudienceDataDefinition> = new Map<string, AudienceDataDefinition>();
  private audiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  private deletedAudiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  private shadingData: BehaviorSubject<Map<string, ImpGeofootprintVar>> = new BehaviorSubject<Map<string, ImpGeofootprintVar>>(new Map<string, ImpGeofootprintVar>());
  private shadingSub: Subscription;
  private selectedSub: Subscription;

  public shadingData$: Observable<Map<string, ImpGeofootprintVar>> = this.shadingData.asObservable();
  public audiences$: Observable<AudienceDataDefinition[]> = this.audiences.asObservable();
  public deletedAudiences$: Observable<AudienceDataDefinition[]> = this.deletedAudiences.asObservable();

  constructor(private appStateService: AppStateService,
              private varService: ImpGeofootprintVarService,
              private projectService: AppProjectService,
              private usageService: UsageService,
              private messagingService: AppMessagingService,
              private config: AppConfig,
              private projectVarService: ImpProjectVarService,
              private domainFactory: ImpDomainFactoryService) {
    this.newVisibleGeos$ = this.appStateService.uniqueVisibleGeocodes$.pipe(
      tap(() => this.clearShadingData()),   // and clear the data cache
      map(geos => geos.filter(geo => !this.shadingData.getValue().has(geo))) // and return any that aren't in the cache
    );

    this.newSelectedGeos$ = this.appStateService.uniqueSelectedGeocodes$.pipe(
      debounceTime(500),
      map(geos => {
        const varGeos = new Set(this.varService.get().map(gv => gv.geocode));
        return geos.filter(g => !varGeos.has(g));
      }),
      filter(geos => geos.length > 0),
    );

    this.projectService.projectIsLoading$.pipe(
      filter(loading => loading),
    ).subscribe(() => {
      this.audienceMap.clear();
      this.audienceSources.clear();
      this.nationalSources.clear();
      this.shadingData.next(new Map<string, ImpGeofootprintVar>());
      this.audiences.next([]);
    });
  }

  private createKey = (...values: string[]) => values.join('/');

  public ngOnDestroy() : void {
    this.unsubEverything();
  }

  public addAudience(audience: AudienceDataDefinition, sourceRefresh: audienceSource, nationalRefresh?: nationalSource, id?: number) : void {
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const audienceId = this.createKey(sourceId, audience.audienceIdentifier);
    this.audienceSources.set(sourceId, sourceRefresh);
    this.audienceMap.set(audienceId, audience);
    if (nationalRefresh != null) this.nationalSources.set(sourceId, nationalRefresh);
    const projectVar = this.createProjectVar(audience, id);
    // protect against adding dupes to the data store
    if ( projectVar && (this.projectVarService.get().filter(pv => pv.source === projectVar.source && pv.fieldname === projectVar.fieldname).length > 0)) {
      console.warn('refusing to add duplicate project var: ', projectVar, this.projectVarService.get());
    } else {
      if (projectVar) this.projectVarService.add([projectVar]);
    }
    const audienceList = Array.from(this.audienceMap.values());
    this.audiences.next(audienceList.sort((a, b) => this.compare(a, b)));
  }

  private compare(a, b) {
    if (a.audienceCounter > b.audienceCounter) {
      return 1;
    }
    if (a.audienceCounter < b.audienceCounter) {
      return -1;
    }
    return 0;
  }

  public moveAudienceUp(audience: AudienceDataDefinition) {
    if (audience == null || audience.audienceCounter === 0) {
      return; // in this case we are already at the top of the list
    }
    const audienceList = Array.from(this.audienceMap.values());
    for (let i = 0; i < audienceList.length; i++) {
      const audienceKey = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
      const currentKey = this.createKey(audienceList[i].audienceSourceType, audienceList[i].audienceSourceName);
      if (audienceKey + audience.audienceName === currentKey + audienceList[i].audienceName) {
        let swapTargets = audienceList.filter(a => a.audienceCounter < audience.audienceCounter);
        swapTargets = swapTargets.sort((a, b) => this.compare(a, b));
        const swapTarget = swapTargets[swapTargets.length - 1];
        const newPosition = swapTarget.audienceCounter;
        const oldPosition = audience.audienceCounter;
        audience.audienceCounter = newPosition;
        swapTarget.audienceCounter = oldPosition;
        break;
      }
    }
    this.audiences.next(audienceList.sort((a, b) => this.compare(a, b)));
    this.projectVarService.clearAll();
    for (const newAudience of audienceList ) {
      this.projectVarService.add([this.createProjectVar(newAudience)]);
    }
  }

  private createProjectVar(audience: AudienceDataDefinition, id?: number) : ImpProjectVar {
    let newId = this.projectVarService.getNextStoreId();
    if (newId <= this.projectVarService.get().length) {
      for (const pv of this.projectVarService.get()) {
        newId = this.projectVarService.getNextStoreId(); // avoid collisions with existing IDs
      }
    }
    const currentProject = this.appStateService.currentProject$.getValue();
    const varPk = !Number.isNaN(Number(audience.audienceIdentifier)) ? Number(audience.audienceIdentifier) : newId;
    const projectVar = this.domainFactory.createProjectVar(currentProject, varPk, audience);
    return projectVar;
  }

  public updateProjectVars(audience: AudienceDataDefinition) {
    const newProjectVar = this.createProjectVar(audience);
    newProjectVar.baseStatus = DAOBaseStatus.UPDATE;
    for (const projectVar of this.projectVarService.get()) {
      if (this.matchProjectVar(projectVar, audience)) {
        if (projectVar.pvId) newProjectVar.pvId = projectVar.pvId;
        this.projectVarService.update(projectVar, newProjectVar);
      }
    }
    if (audience.showOnMap) {
      const otherVars = this.projectVarService.get().filter(pv => !this.matchProjectVar(pv, audience));
      for (const pv of otherVars) {
        const newPv = Object.assign(pv);
        newPv.baseStatus = DAOBaseStatus.UPDATE;
        pv.isShadedOnMap = false;
        this.projectVarService.update(pv, newPv);
      }
    }
    if (audience.allowNationalExport) {
      const otherVars = this.projectVarService.get().filter(pv => !this.matchProjectVar(pv, audience));
      for (const pv of otherVars) {
        const newPv = Object.assign(pv);
        newPv.baseStatus = DAOBaseStatus.UPDATE;
        pv.isNationalExtract = false;
        this.projectVarService.update(pv, newPv);
      }
    }
  }

  private matchProjectVar(projectVar: ImpProjectVar, audience: AudienceDataDefinition) : boolean {
    const sourceType = projectVar.source.split('_')[0];
    const sourceName = projectVar.source.split('_')[1];
    const id = audience.audienceSourceType === 'Custom' ? projectVar.fieldname : projectVar.varPk;
    if (sourceType === audience.audienceSourceType && sourceName === audience.audienceSourceName && id.toString() === audience.audienceIdentifier) {
      return true;
    }
    return false;
  }

  private removeProjectVar(sourceType: 'Online' | 'Offline' | 'Custom', sourceName: string, audienceIdentifier: string) {
    for (const projectVar of this.projectVarService.get()) {
      const parts = projectVar.source.split('~');
      const source = sourceType + '_' + sourceName;
      if (parts[0].toLowerCase() === source.toLowerCase() && (projectVar.varPk.toString() === audienceIdentifier || projectVar.fieldname === audienceIdentifier)) {
        this.projectVarService.addDbRemove(projectVar);
        this.projectVarService.remove(projectVar);
        let hierarchyVars = this.appStateService.currentProject$.getValue().impProjectVars;
        hierarchyVars = hierarchyVars.filter(hv => hv.source !== source && hv.varPk.toString() !== audienceIdentifier);
        this.appStateService.currentProject$.getValue().impProjectVars = [];
        this.appStateService.currentProject$.getValue().impProjectVars.push(...hierarchyVars);
      }
    }
  }

  public removeAudience(sourceType: 'Online' | 'Offline' | 'Custom', sourceName: string, audienceIdentifier: string) : void {
    const sourceId = this.createKey(sourceType, sourceName);
    const audienceId = this.createKey(sourceId, audienceIdentifier);
    if (this.audienceMap.has(audienceId)) {
      this.audienceMap.delete(audienceId);
      const remainingAudiences = Array.from(this.audienceMap.values());
      if (this.audienceSources.has(sourceId) && remainingAudiences.filter(a => a.audienceSourceType === sourceType && a.audienceSourceName === sourceName).length === 0) {
        this.audienceSources.delete(sourceId);
      }
      this.removeProjectVar(sourceType, sourceName, audienceIdentifier);
      this.audiences.next(Array.from(this.audienceMap.values()));
    }
  }

  public addDeletedAudience(sourceType: 'Online' | 'Offline' | 'Custom', sourceName: string, audienceIdentifier: string) : void {
    const sourceId = this.createKey(sourceType, sourceName);
    const audienceId = this.createKey(sourceId, audienceIdentifier);
    if (this.audienceMap.has(audienceId)) {
      this.deletedAudiences.next([this.audienceMap.get(audienceId)]);
    }
  }

  public exportNationalExtract(analysisLevel: string, projectId: number) : void {
    const spinnerId = 'NATIONAL_EXTRACT';
    const audiences = Array.from(this.audienceMap.values()).filter(a => a.exportNationally === true);
    if (audiences.length > 0 && analysisLevel != null && analysisLevel.length > 0 && projectId != null) {
      const convertedData: any[] = [];
      this.messagingService.startSpinnerDialog(spinnerId, 'Downloading National Data');
      this.getNationalData(audiences[0], analysisLevel).subscribe(
        data => convertedData.push(...data),
        err => {
          console.error('There was an error processing the National Extract', err);
          this.messagingService.stopSpinnerDialog(spinnerId);
        },
        () => {
          try {
            const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'export' });
            const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName.replace('~', ':') + '~' + audiences[0].audienceSourceName + '~' + analysisLevel;
            this.usageService.createCounterMetric(usageMetricName, metricText, convertedData.length);
            const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
            const fileName = `NatlExtract_${analysisLevel}_${audiences[0].audienceIdentifier}_${fmtDate}.xlsx`.replace(/\//g, '_');
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(convertedData);
            const sheetName = audiences[0].audienceName.replace(/\//g, '_').substr(0, 31); // magic number == maximum number of chars allowed in an Excel tab name
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, fileName);
          } finally {
            this.messagingService.stopSpinnerDialog(spinnerId);
          }
        }
      );
    } else {
      if (audiences.length === 0) {
        this.messagingService.showErrorNotification('National Extract Export', 'A variable must be selected for a national extract before exporting.');
      } else if (analysisLevel == null || analysisLevel.length === 0) {
        this.messagingService.showErrorNotification('National Extract Export', 'An Analysis Level must be selected for a national extract before exporting.');
      } else {
        this.messagingService.showErrorNotification('National Extract Export', 'The project must be saved before exporting a national extract.');
      }
    }
  }

  public getAudiences(identifier?: string | string[]) : AudienceDataDefinition[] {
    if (identifier != null) {
      let identifiers: string[];
      if (!Array.isArray(identifier)) {
        identifiers = [identifier];
      } else {
        identifiers = identifier;
      }
      const result: AudienceDataDefinition[] = [];
      identifiers.forEach(id => result.push(this.audienceMap.get(id)));
      return result;
    }
    return this.audiences.getValue();
  }

  private clearVars() {
    const project = this.appStateService.currentProject$.getValue();
    const tas = project.getImpGeofootprintTradeAreas();
    for (const ta of tas) {
      ta.impGeofootprintVars = [];
    }
    this.varService.clearAll();
  }

  public applyAudienceSelection() : void {
    const audiences = Array.from(this.audienceMap.values());
    const shadingAudience = audiences.filter(a => a.showOnMap);
    const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
    this.unsubEverything();
    this.clearShadingData();
    this.clearVars();
    if (shadingAudience.length > 1) {
      this.messagingService.showErrorNotification('Selected Audience Error', 'Only 1 Audience can be selected to shade the map by.');
    } else if (shadingAudience.length === 1) {
      // pre-load the mapping data
      // combineLatest(this.appStateService.analysisLevel$, this.currentVisibleGeos$).subscribe(
      //   ([analysisLevel, geos]) => this.getShadingData(analysisLevel, geos, shadingAudience[0]));
      // set up a map watch process
      const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
      const newGeos$ = this.newVisibleGeos$.pipe(startWith(null));
      this.shadingSub = combineLatest(this.appStateService.analysisLevel$, newGeos$, visibleGeos$).subscribe(
        ([analysisLevel, newGeos, visibleGeos]) => {
          if (!newGeos) {
            this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]);
          } else {
            this.getShadingData(analysisLevel, newGeos, shadingAudience[0]);
          }
        }
      );
    }
    if (selectedAudiences.length > 0) {
      // set up a watch process
      this.selectedSub = combineLatest(this.appStateService.analysisLevel$, this.newSelectedGeos$)
        .subscribe(
          ([analysisLevel, geos]) => this.persistGeoVarData(analysisLevel, geos, selectedAudiences)
        );
    }
  }

  private unsubEverything() {
    if (this.shadingSub) this.shadingSub.unsubscribe();
    if (this.selectedSub) this.selectedSub.unsubscribe();
  }

  public clearShadingData() : void {
    console.log('clearing shading data cache');
    const current = this.shadingData.getValue();
    current.clear();
    this.shadingData.next(current);
  }

  private getShadingData(analysisLevel: string, geos: string[], audience: AudienceDataDefinition) {
    this.messagingService.startSpinnerDialog('SHADING_DATA', 'Retrieving shading data');
    console.log('get shading data called');
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const source = this.audienceSources.get(sourceId);
    if (source != null) {
      const currentShadingData = this.shadingData.getValue();
      // this is an http call, no need for an unsub
      if (audience.audienceSourceName === 'Audience-TA') {
        source(analysisLevel, [audience.audienceIdentifier], geos, true, audience).subscribe(
          data => {
            data = data.filter(gv => gv.customVarExprDisplay.includes(audience.secondaryId));
            data.forEach(gv => currentShadingData.set(gv.geocode, gv));
          },
          err => console.error('There was an error retrieving audience data for map shading', err),
          () => {
            this.shadingData.next(currentShadingData);
            this.messagingService.stopSpinnerDialog('SHADING_DATA');
          }
        );
      } else {
        source(analysisLevel, [audience.audienceIdentifier], geos, true).subscribe(
          data => data.forEach(gv => currentShadingData.set(gv.geocode, gv)),
          err => console.error('There was an error retrieving audience data for map shading', err),
          () => {
            this.shadingData.next(currentShadingData);
            this.messagingService.stopSpinnerDialog('SHADING_DATA');
          }
        );
      }
    }
  }

  private persistGeoVarData(analysisLevel: string, geos: string[], selectedAudiences: AudienceDataDefinition[]) {
    this.messagingService.startSpinnerDialog(this.spinnerKey, 'Retrieving audience data');
    const sources = new Set(selectedAudiences.map(a => this.createKey(a.audienceSourceType, a.audienceSourceName)));
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    sources.forEach(s => {
      const sourceRefresh = this.audienceSources.get(s);
      if (sourceRefresh != null) {
        let ids = selectedAudiences.filter(a => this.createKey(a.audienceSourceType, a.audienceSourceName) === s).map(a => a.audienceIdentifier);
        if (s.split('/')[0] === 'Custom') {
          ids = selectedAudiences.filter(a => this.createKey(a.audienceSourceType, a.audienceSourceName)).map(a => a.audienceIdentifier);
        }
        const taAudiences = selectedAudiences.filter(a => a.audienceSourceName === 'Audience-TA');
        if (taAudiences.length > 0) {
          const doneAudienceTAs: Set<string> = new Set<string>();
          for (const taAudience of taAudiences) {
            if (doneAudienceTAs.has(taAudience.audienceIdentifier.split('-')[0])) {
              continue;
            } else {
              observables.push(sourceRefresh(analysisLevel, ids, geos, false, taAudience));
              doneAudienceTAs.add(taAudience.audienceIdentifier.split('-')[0]);
            }
          }
        } else {
          observables.push(sourceRefresh(analysisLevel, ids, geos, false));
        }
      }
    });
    const accumulator: ImpGeofootprintVar[] = [];
    merge(...observables, 4).subscribe(
      vars => accumulator.push(...vars),
      err => {
        console.error('There was an error retrieving audience data', err);
        this.messagingService.showErrorNotification('Audience Error', 'There was an error retrieving audience data');
        this.messagingService.stopSpinnerDialog(this.spinnerKey);
      },
      () => {
        console.log('persist complete', accumulator);
        this.varService.add(accumulator);
        this.messagingService.stopSpinnerDialog(this.spinnerKey);
      }
    );
  }

  private getNationalData(audience: AudienceDataDefinition, analysisLevel: string) : Observable<any[]> {
    const sourceKey = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    return this.nationalSources.get(sourceKey)(analysisLevel, audience.audienceIdentifier);
  }

  public getShadingVar(geocode: string) : ImpGeofootprintVar {
    return this.shadingData.getValue().get(geocode);
  }
}
