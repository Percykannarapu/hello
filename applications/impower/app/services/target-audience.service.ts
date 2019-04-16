import { Injectable, OnDestroy } from '@angular/core';
import { ClearShadingData } from '@val/esri';
import { BehaviorSubject, Observable, Subscription, combineLatest, merge, throwError } from 'rxjs';
import { map, tap, filter, startWith, debounceTime, catchError, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import * as XLSX from 'xlsx';
import { AppStateService } from './app-state.service';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { DAOBaseStatus } from '../val-modules/api/models/BaseModel';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { filterArray, roundTo, formatMilli, safe } from '@val/common';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { RestResponse } from '../models/RestResponse';
import { getOrSetAsInMap } from '@angular/animations/browser/src/render/shared';

export type audienceSource = (analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, transactionId: number, audience?: AudienceDataDefinition) => Observable<ImpGeofootprintVar[]>;
export type nationalSource = (analysisLevel: string, identifier: string, transactionId: number) => Observable<any[]>;

interface OnlineBulkDownloadDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
  attrs: Map<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceService implements OnDestroy {

  // This field is being used to maintain the sort order for the audiences grid
  // As each new audience is created it will get assigned the current value
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
  public geoTransactionId: number = -1;

  private geosRequested = new Set<string>();

  private persistGeoVarCache: ImpGeofootprintVar[] = [];

  public  timingMap: Map<string, number> = new Map<string, number>();

  constructor(private appStateService: AppStateService,
              private varService: ImpGeofootprintVarService,
              private restService: RestDataService,
              private config: AppConfig,
              private projectVarService: ImpProjectVarService,
              private domainFactory: ImpDomainFactoryService,
              private store$: Store<LocalAppState>) {
    this.newVisibleGeos$ = this.appStateService.uniqueVisibleGeocodes$.pipe(
      tap(() => this.clearShadingData()),   // and clear the data cache
      map(geos => geos.filter(geo => !this.shadingData.getValue().has(geo))) // and return any that aren't in the cache
    );

    this.newSelectedGeos$ = this.appStateService.uniqueIdentifiedGeocodes$.pipe(
      debounceTime(500),
      filterArray(geo => !this.geosRequested.has(geo)),
      filter(geos => geos.length > 0),
    );
  }

  private createKey = (...values: string[]) => values.join('/');

  public ngOnDestroy() : void {
    this.unsubEverything();
  }

  public clearAll() : void {
    this.audienceMap.clear();
    this.audienceSources.clear();
    this.nationalSources.clear();
    this.shadingData.next(new Map<string, ImpGeofootprintVar>());
    this.audiences.next([]);
  }

  public addAudience(audience: AudienceDataDefinition, sourceRefresh: audienceSource, nationalRefresh?: nationalSource, id?: number) : void {
    let sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const audienceId = this.createKey(sourceId, audience.audienceIdentifier);
    //console.debug("addAudience - target-audience.service - sourceId: " + sourceId + ", audienceName: " + ((audience != null) ? audience.audienceName : "") + ", audienceSourceName: " + ((audience != null) ? audience.audienceSourceName:""));
    this.audienceSources.set(sourceId, sourceRefresh);
    if (audience.audienceSourceName === 'Audience-TA') {
      this.audienceMap.set(`/${sourceId}-${audience.secondaryId}`, audience);
    } else {
      this.audienceMap.set(audienceId, audience);
    }
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
    //console.debug("createProjectVar varPk: " + varPk + ", newId: " + newId + ", audienceSourceName: " + audience.audienceSourceName + ", audienceSourceType: " + audience.audienceSourceType + ", audienceName: " + audience.audienceName);
    const projectVar = this.domainFactory.createProjectVar(currentProject, varPk, audience);
    return projectVar;
  }

  public updateProjectVars(audience: AudienceDataDefinition) {
    //console.debug("updateProjectVars fired: audience.audienceIdentifier: " + audience.audienceIdentifier);
    const newProjectVar = this.createProjectVar(audience);
    newProjectVar.baseStatus = DAOBaseStatus.UPDATE;
    for (const projectVar of this.projectVarService.get()) {
      if (this.matchProjectVar(projectVar, audience)) {
        //if (projectVar.pvId) newProjectVar.pvId = projectVar.pvId;
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
    //for US8712 when user saves the projects checkboxes also need to save DB to maintains state
   /* if (audience.allowNationalExport) {
      const otherVars = this.projectVarService.get().filter(pv => !this.matchProjectVar(pv, audience));
      for (const pv of otherVars) {
        const newPv = Object.assign(pv);
        newPv.baseStatus = DAOBaseStatus.UPDATE;
        //pv.isNationalExtract = false;
        this.projectVarService.update(pv, newPv);
      }
    }*/
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
        hierarchyVars = hierarchyVars.filter(hv => !(hv.source === source && hv.varPk.toString() === audienceIdentifier));
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
    const key = 'NATIONAL_EXTRACT';
    const audiences = Array.from(this.audienceMap.values()).filter(a => a.exportNationally === true);
    if (audiences.length > 0 && analysisLevel != null && analysisLevel.length > 0 && projectId != null) {
      const convertedData: any[] = [];
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Downloading National Data' }));
      this.getNationalData(audiences, analysisLevel).subscribe(
        data => convertedData.push(...data),
        err => {
          console.error('There was an error processing the National Extract', err);
          this.store$.dispatch(new StopBusyIndicator({ key }));
        },
        () => {
          try {
            const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
            const fileName = `NatlExtract_${analysisLevel}_${projectId}_${fmtDate}.xlsx`.replace(/\//g, '_');
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(convertedData);
            const sheetName = projectId.toString();
            //audiences[0].audienceName.replace(/\//g, '_').substr(0, 31); // magic number == maximum number of chars allowed in an Excel tab name
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, fileName);
            const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName.replace('~', ':') + '~' + audiences[0].audienceSourceName + '~' + analysisLevel;
            this.store$.dispatch(new CreateAudienceUsageMetric('online', 'export', metricText, convertedData.length));
          } finally {
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        }
      );
    } else {
      const notificationTitle = 'National Extract Export';
      if (audiences.length === 0) {
        this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'A variable must be selected for a national extract before exporting.' }));
      } else if (analysisLevel == null || analysisLevel.length === 0) {
        this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'An Analysis Level must be selected for a national extract before exporting.' }));
      } else {
        this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'The project must be saved before exporting a national extract.' }));
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
    const tas = (project != null) ? project.getImpGeofootprintTradeAreas() : [];

    for (const ta of tas) {
      ta.impGeofootprintVars = [];
    }
    this.varService.clearAll();
  }

  public applyAudienceSelection() : void {
    const audiences = Array.from(this.audienceMap.values());
    const shadingAudience = audiences.filter(a => a.showOnMap);
    const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
    console.log("applyAudienceSelection fired - # Audiences:", audiences.length, "selectedAudiences.length", selectedAudiences.length);
    this.unsubEverything();
    this.clearShadingData();
    this.clearVars();
    if (shadingAudience.length > 1) {
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Selected Audience Error', message: 'Only 1 Audience can be selected to shade the map by.' }));
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
    } else if (shadingAudience.length === 0) {
      if (this.shadingSub) this.shadingSub.unsubscribe();
      this.store$.dispatch(new ClearShadingData());
    }
    if (selectedAudiences.length > 0) {
      // set up a watch process
      this.selectedSub = this.newSelectedGeos$.pipe(debounceTime(3000))
        .subscribe(
          geos => {
            if (geos.length > 0)
            {
              this.persistGeoVarCache = [];
              console.log("applyAudienceSelection observable: analysisLevel:", this.appStateService.analysisLevel$.getValue()," - geos.count",(geos != null ? geos.length : null));
              this.varService.clearAll(false);
              this.persistGeoVarData(this.appStateService.analysisLevel$.getValue(), geos, selectedAudiences);
              this.persistGeoVarCache = [];
            }
          }
        );

      // this.selectedSub = this.newSelectedGeos$.pipe(
      //   withLatestFrom(this.appStateService.analysisLevel$),
      //   map(([geos, analysisLevel]) => {
      //       this.persistGeoVarCache = [];
      //       console.log("### applyAudienceSelection observable: analysisLevel:", analysisLevel,"geos.count",(geos != null ? geos.length : null));
      //       this.persistGeoVarData(analysisLevel, geos, selectedAudiences);
      //       this.persistGeoVarCache = [];
      //     })
      //   ).subscribe();

      // this.selectedSub = combineLatest(this.appStateService.analysisLevel$, this.newSelectedGeos$).pipe(debounceTime(9000))
      //   .subscribe(
      //     ([analysisLevel, geos]) => {
      //       this.persistGeoVarCache = [];
      //       console.log("### applyAudienceSelection observable: analysisLevel:", analysisLevel,"geos.count",(geos != null ? geos.length : null));
      //       this.varService.clearAll(false);
      //       this.persistGeoVarData(analysisLevel, geos, selectedAudiences);
      //       this.persistGeoVarCache = [];
      //     }
      //   );
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
    // this.shadingData.next(current);
  }

  private getShadingData(analysisLevel: string, geos: string[], audience: AudienceDataDefinition) {
    const key = 'SHADING_DATA';
    console.log('get shading data called');
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const source = this.audienceSources.get(sourceId);
    const projectVarsDict = this.appStateService.projectVarsDict$.getValue();

    if (source != null) {
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Retrieving shading data' }));
      const currentShadingData = this.shadingData.getValue();
      // this is an http call, no need for an unsub
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Retrieving shading data' }));
      if (audience.audienceSourceName === 'Audience-TA') {
        source(analysisLevel, [audience.audienceIdentifier], geos, true, this.geoTransactionId, audience).subscribe(
          data => {
            data = data.filter(gv => (projectVarsDict[gv.varPk]||safe).customVarExprDisplay.includes(audience.secondaryId));
            data.forEach(gv => currentShadingData.set(gv.geocode, gv));
          },
          err => console.error('There was an error retrieving audience data for map shading', err),
          () => {
            this.shadingData.next(currentShadingData);
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        );
      } else {
        source(analysisLevel, [audience.audienceIdentifier], geos, true, this.geoTransactionId).subscribe(
          data => data.forEach(gv => currentShadingData.set(gv.geocode, gv)),
          err => console.error('There was an error retrieving audience data for map shading', err),
          () => {
            this.shadingData.next(currentShadingData);
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        );
      }
    }
  }

  private persistGeoVarData(analysisLevel: string, geos: string[], selectedAudiences: AudienceDataDefinition[]) {
    let startTime = performance.now();
    geos.forEach(geo => this.geosRequested.add(geo));
    const key = this.spinnerKey;
    const sources = new Set(selectedAudiences.map(a => this.createKey(a.audienceSourceType, a.audienceSourceName)));
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    const doneAudienceTAs: Set<string> = new Set<string>();

    let audienceSourceType: string;
    let audienceSourceName: string;

    // Post geofootprint and get a transactionId
    let startPopChunks = performance.now();
    this.geoTransactionId = -1;
    this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks: 5, geocodes: geos}]).subscribe
      (response => {
        console.log("populateChunkedGeos took ", formatMilli(performance.now() - startPopChunks), ", Response:", response);
        // console.log("response.payload.transactionId:", response.payload.transactionId);
        this.geoTransactionId = response.payload.transactionId;

        sources.forEach(s => {
          //console.log("audienceSource.get of " + s);
          const sourceRefresh = this.audienceSources.get(s);
          if (sourceRefresh != null) {
            let ids = selectedAudiences.filter(a => this.createKey(a.audienceSourceType, a.audienceSourceName) === s).map(a => a.audienceIdentifier);
            //if (s.split('/')[0] === 'Custom') {
            //  ids = selectedAudiences.filter(a => this.createKey(a.audienceSourceType, a.audienceSourceName)).map(a => a.audienceIdentifier);
            //}

            const sAudiences = selectedAudiences.filter(a => a.audienceSourceType === s.split('/')[0] && a.audienceSourceName === s.split('/')[1]);
    //        const doneAudienceTAs: Set<string> = new Set<string>();

    //        sAudiences.forEach(taAudience => {
              audienceSourceType = s.split('/')[0];
              audienceSourceName = s.split('/')[1];
              const taAudiences = selectedAudiences.filter(a => a.audienceSourceName === 'Audience-TA');
              console.log("persistGeoVarData staging:", audienceSourceName.padEnd(8), "type:", audienceSourceType.padEnd(7), " transactionId:", this.geoTransactionId, "ids: ", ids);
              if (audienceSourceName === 'Audience-TA') {
                const taAudiences = selectedAudiences.filter(a => a.audienceSourceType === s.split('/')[0] && a.audienceSourceName === s.split('/')[1] && a.audienceSourceName === 'Audience-TA');
                taAudiences.forEach(taAudience => {
                  if (!doneAudienceTAs.has(taAudience.audienceIdentifier.split('-')[0])) {
                //  observables.push(sourceRefresh(analysisLevel, [taAudience.audienceIdentifier.split('-')[0]], geos, false));
                    observables.push(sourceRefresh(analysisLevel, ids, geos, false, this.geoTransactionId, taAudience));
                    doneAudienceTAs.add(taAudience.audienceIdentifier.split('-')[0]);
                  }
                });
              }
              else
              {
                observables.push(sourceRefresh(analysisLevel, ids, geos, false, this.geoTransactionId));
              }
          }
        });
        //console.debug("persistGeoVarData Observable count: ", observables.length);
        const accumulator: ImpGeofootprintVar[] = [];
        this.store$.dispatch(new StartBusyIndicator({ key, message: 'Retrieving audience data' }));
        merge(...observables, 4).subscribe(
          vars => {
// Not sure if these are necessary and the second one is expensive
/*
let startVarsFilter = performance.now();
let v1Filter = performance.now();
let varCount = vars.length;
            vars = vars.filter(gv => this.varService.get().findIndex(gvar => gvar.geocode === gv.geocode && gvar.varPk === gv.varPk && gvar.impGeofootprintLocation.locationNumber === gv.impGeofootprintLocation.locationNumber) === -1);
console.log("### v1Filter filters took ", formatMilli(performance.now() - v1Filter), " Before:", varCount, ", After:", vars.length);
let v2Filter = performance.now();
varCount = vars.length;
            vars = vars.filter(gv => this.persistGeoVarCache.findIndex(gvar => gvar.geocode === gv.geocode && gvar.varPk === gv.varPk && gvar.impGeofootprintLocation.locationNumber === gv.impGeofootprintLocation.locationNumber) === -1);
console.log("### v2Filter filters took ", formatMilli(performance.now() - v2Filter), " Before:", varCount, ", After:", vars.length);
            console.log("### vars filters took ", formatMilli(performance.now() - startVarsFilter));
*/
            const projectVarsDict = this.appStateService.projectVarsDict$.getValue();
            if (vars.length > 0) {
              let source = (projectVarsDict[vars[0].varPk]||safe).customVarExprDisplay.match("\\(\\w+\\)$") != null ? (projectVarsDict[vars[0].varPk]||safe).customVarExprDisplay.match("\\(\\w+\\)$")[0]: "(TDA)";
              let restTime = this.timingMap.has(source.toLowerCase()) ? formatMilli(this.timingMap.get(source.toLowerCase())) : null;
              let pad = [6-vars.length.toString().length, 6-accumulator.length.toString().length, 6-(vars.length + accumulator.length).toString().length];
              console.log("persistGeoVarData -", source.padEnd(10), "vars (New:"+"".padEnd(pad[0]), vars.length, ", Current:"+"".padEnd(pad[1]), accumulator.length, ", Total:"+"".padEnd(pad[2]), (vars.length + accumulator.length), ", In Store:", this.varService.get().length,")","- REST call took", restTime);

              // Clear out the timer for this source
              if (this.timingMap.has(source.toLowerCase()))
                this.timingMap.delete(source.toLowerCase());

              // Debug version that shows the actual variables in a collapsable group
              //console.groupCollapsed("persistGeoVarData vars (New: ", vars.length, ", Current: ", accumulator.length, ", Total: ", (vars.length + accumulator.length), ", In Store:", this.varService.get().length,"): ");
              //console.debug(vars);
              //console.groupEnd();

              const size = 90000;
              for (let i = 0; i < vars.length; i += size) {
                accumulator.push(...vars.slice(i, i + size))
                this.persistGeoVarCache.push(...vars.slice(i, i + size));
              }
            }},
          err => {
            console.error('There was an error retrieving audience data', err);
            this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Error', message: 'There was an error retrieving audience data' }));
            this.store$.dispatch(new StopBusyIndicator({ key }));
          },
          () => {
            /* // Debug print new geoVars grouped by id, name
            console.log("persistGeoVarData complete - Added", accumulator.length, "new geo vars");
            let variablePkCounts:Map<string,ImpGeofootprintVar[]> = groupByExtended(accumulator, (i) => i.varPk + ", " + i.customVarExprDisplay);
            if (variablePkCounts != null && variablePkCounts.size > 0)
              console.table(Array.from(variablePkCounts.keys()).map(v => { return {Variable: v, Count: variablePkCounts.get(v).length}}));*/

              // Add the newly created geo vars to the data store
              //console.log("persistGeoVarData - adding", accumulator.length,"geo vars to the data store.  Existing store size: ", this.varService.get().length);
              if (accumulator.length > 0) {
                this.varService.add(accumulator);
                // This version avoids dupes but is slow.  this.varService.add(accumulator.filter(gv => this.varService.get().findIndex(gvar => gvar.geocode === gv.geocode && gvar.varPk === gv.varPk && gvar.impGeofootprintLocation.locationNumber === gv.impGeofootprintLocation.locationNumber) === -1));
              }
            /* // Debug print datastore geoVars grouped by id, name (NOTE: let variablePkCounts:Map<string,ImpGeofootprintVar[]> defined above)
            console.log("persistGeoVarData - Current Geo Vars:");
            variablePkCounts = groupByExtended(this.varService.get(), (i) => i.varPk + ", " + i.customVarExprDisplay);
            console.table(Array.from(variablePkCounts.keys()).map(v => { return {Variable: v, Count: variablePkCounts.get(v).length}}));*/

            // Delete the geocode chunks
            this.restService.delete('v1/targeting/base/chunkedgeos/deleteChunks/', this.geoTransactionId).subscribe
              (response => {
                console.log("deleteChunks response: ", response);
              },
              err => {
                console.error("persistGeoVarData - Error deleting chunks:", err);
              });

            // Done processing this set of geos
            this.geosRequested.clear();

            console.log("*** persistGeoVarData completed in", formatMilli(performance.now() - startTime),"***");
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        );
      }),
      err => {
        console.error('Error posting to /v1/targeting/base/geoinfo/populateChunkedGeos with payload:');
        console.error('payload:\n{\n'+
                      '   chunks: ', 10, '\n',
                      '   geocodes: ', geos.toString(), '\n',
                     );
        console.error(err);
        return throwError('No transaction id was returned from populateChunkedGeos');}
      ,() => {
        console.log("populateChunkedGeos complete");
      };
  }

  private getNationalData(audiences: AudienceDataDefinition[] , analysisLevel: string) : Observable<any[]> {
    const observables: Observable<any[]>[] = this.nationalRefreshDownload(audiences , analysisLevel);
    return merge(...observables, 4).pipe(
      map(data => data.map(d => {
        const result = { Geocode: d.geocode };
        for (const key of Object.keys(d.attrs)) {
          result[key] = Math.round(Number(d.attrs[key]));
        }
        return result;
      }))
    );
  }

  public nationalRefreshDownload(audiences: AudienceDataDefinition[], analysisLevel: string) : Observable<any[]>[] {
    const reqInput = [];
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    audiences.forEach(audience => {
      let inputData;
      const numericId = Number(audience.audienceIdentifier);
      const duplicateCategorys = reqInput.length > 0 ? reqInput.filter( inputMap => inputMap['source'] == audience.audienceSourceName) : [];
      if (duplicateCategorys.length > 0){
        duplicateCategorys[0]['digCategoryIds'].push(numericId);
      }
      else{
         inputData = {
          geoType: serviceAnalysisLevel,
          source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
          geocodes: ['*'],
          digCategoryIds: [numericId]
        };
        reqInput.push(inputData);
      }
    });
    console.log('reqInput:::::::', JSON.stringify(reqInput));
    const observables: Observable<OnlineBulkDownloadDataResponse[]>[] = [];
    if (reqInput.length > 0){
      observables.push( this.restService.post('v1/targeting/base/geoinfo/digitallookup', reqInput).pipe(
       map(response => this.convertFuseResponse(response))
     ));
    }
    return observables;
  }

  public convertFuseResponse(response: RestResponse) {
    const responseArray: OnlineBulkDownloadDataResponse[] = response.payload.rows;
    return responseArray;
  }

  public getShadingVar(geocode: string) : ImpGeofootprintVar {
    return this.shadingData.getValue().get(geocode);
  }

  public refreshAudiences() {
    //this.audiences.next(this.audiences.getValue());
    this.projectVarService.makeDirty();
  }
}