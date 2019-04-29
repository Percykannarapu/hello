/* tslint:disable:max-line-length */
import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { accumulateArrays, dedupeSimpleSet, formatMilli, groupByExtended } from '@val/common';
import { ClearShadingData } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { BehaviorSubject, combineLatest, concat, merge, Observable, Subscription } from 'rxjs';
import { debounceTime, filter, map, mergeMap, pairwise, reduce, startWith, tap } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { AppConfig } from '../app.config';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { DAOBaseStatus } from '../val-modules/api/models/BaseModel';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { AppStateService } from './app-state.service';

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

  private persistGeoVarCache: ImpGeofootprintVar[] = [];

  public  timingMap: Map<string, number> = new Map<string, number>();

  constructor(private appStateService: AppStateService,
              private varService: ImpGeofootprintVarService,
              private restService: RestDataService,
              private config: AppConfig,
              private projectVarService: ImpProjectVarService,
              private domainFactory: ImpDomainFactoryService,
              private logger: LoggingService,
              private store$: Store<LocalAppState>) {
    this.newVisibleGeos$ = this.appStateService.uniqueVisibleGeocodes$.pipe(
      tap(() => this.clearShadingData()),   // and clear the data cache
      map(geos => geos.filter(geo => !this.shadingData.getValue().has(geo))) // and return any that aren't in the cache
    );

    this.newSelectedGeos$ = this.appStateService.uniqueIdentifiedGeocodes$.pipe(
      map(geos => new Set(geos)),
      startWith(new Set<string>()),
      pairwise(),
      map(([previous, current]) => dedupeSimpleSet(current, previous)),
      filter(result => result.size > 0),
      map(geoSet => Array.from(geoSet))
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

  public addAudience(audience: AudienceDataDefinition, sourceRefresh: audienceSource, nationalRefresh?: nationalSource, isReload: boolean = false) : void {
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const audienceId = this.createKey(sourceId, audience.audienceIdentifier);
    //console.debug("addAudience - target-audience.service - sourceId: " + sourceId + ", audienceName: " + ((audience != null) ? audience.audienceName : "") + ", audienceSourceName: " + ((audience != null) ? audience.audienceSourceName:""));
    this.audienceSources.set(sourceId, sourceRefresh);
    if (audience.audienceSourceName === 'Audience-TA') {
      this.audienceMap.set(`/${sourceId}-${audience.secondaryId}`, audience);
    } else {
      this.audienceMap.set(audienceId, audience);
    }
    if (nationalRefresh != null) this.nationalSources.set(sourceId, nationalRefresh);

    if (audience.audienceSourceType === 'Custom' && audience.fieldconte === null)
      audience.fieldconte = FieldContentTypeCodes.Char;

    if (!isReload) {
      const projectVar = this.createProjectVar(audience);
      // protect against adding dupes to the data store
      if ( projectVar && (this.projectVarService.get().filter(pv => pv.source === projectVar.source && pv.fieldname === projectVar.fieldname).length > 0)) {
        console.warn('refusing to add duplicate project var: ', projectVar, this.projectVarService.get());
      } else {
        if (projectVar) this.projectVarService.add([projectVar]);
      }
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

  private createProjectVar(audience: AudienceDataDefinition) : ImpProjectVar {
    // Determine if we have a project var already
    let existingPVar = null;
    let varPk = null;
    // If passed a custom variable name as the identifier, look up the variable by fieldname, otherwise, by varPk
    if (Number.isNaN(Number(audience.audienceIdentifier)))
      existingPVar = this.projectVarService.get().filter(pv => pv.fieldname === audience.audienceIdentifier);
    else
      existingPVar = this.projectVarService.get().filter(pv => pv.varPk === Number(audience.audienceIdentifier));

    if (existingPVar != null && existingPVar.length > 0) {
      console.log('### createProjectVar - Existing project var found:', existingPVar[0]);
      varPk = existingPVar[0].varPk;
    }
    else {
      // If not, create a new id
      if (Number.isNaN(Number(audience.audienceIdentifier))) {
        varPk = this.projectVarService.getNextStoreId();
        if (varPk <= this.projectVarService.get().length) {
          for (const pv of this.projectVarService.get()) {
            varPk = this.projectVarService.getNextStoreId(); // avoid collisions with existing IDs
          }
        }
      }
      else
         varPk = Number(audience.audienceIdentifier);
    }
    audience.audienceIdentifier = varPk.toString();
    const currentProject = this.appStateService.currentProject$.getValue();
    //console.log("createProjectVar varPk: " + varPk + ", audienceIdentifier:" + audience.audienceIdentifier + ", audienceSourceName: " + audience.audienceSourceName + ", audienceSourceType: " + audience.audienceSourceType + ", audienceName: " + audience.audienceName);

    // This is misleading, createProjectVar will both create AND update a project var
    return this.domainFactory.createProjectVar(currentProject, varPk, audience);
  }
  // private createProjectVar(audience: AudienceDataDefinition, id?: number) : ImpProjectVar {
  //   let newId = this.projectVarService.getNextStoreId();
  //   if (newId <= this.projectVarService.get().length) {
  //     for (const pv of this.projectVarService.get()) {
  //       newId = this.projectVarService.getNextStoreId(); // avoid collisions with existing IDs
  //     }
  //   }
  //   const currentProject = this.appStateService.currentProject$.getValue();
  //   const varPk = !Number.isNaN(Number(audience.audienceIdentifier)) ? Number(audience.audienceIdentifier) : newId;
  //   //console.debug("createProjectVar varPk: " + varPk + ", newId: " + newId + ", audienceSourceName: " + audience.audienceSourceName + ", audienceSourceType: " + audience.audienceSourceType + ", audienceName: " + audience.audienceName);
  //   const projectVar = this.domainFactory.createProjectVar(currentProject, varPk, audience);
  //   return projectVar;
  // }


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
        // pv.isShadedOnMap = false;
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
    console.log('applyAudienceSelection fired - # Audiences:', audiences.length, 'selectedAudiences.length', selectedAudiences.length);
    this.unsubEverything();
    this.clearShadingData();
    this.clearVars();
    if (shadingAudience.length > 1) {
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Selected Audience Error', message: 'Only 1 Audience can be selected to shade the map by.' }));
    } else if (shadingAudience.length === 1) {
      const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
      this.shadingSub = combineLatest(this.appStateService.analysisLevel$, visibleGeos$)
        .subscribe(([analysisLevel, visibleGeos]) => this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]));
    } else if (shadingAudience.length === 0) {
      if (this.shadingSub) this.shadingSub.unsubscribe();
      this.store$.dispatch(new ClearShadingData());
    }
    if (selectedAudiences.length > 0) {
      // set up a watch process
      this.selectedSub = this.newSelectedGeos$.pipe(debounceTime(500))
        .subscribe(
          geos => {
            if (geos.length > 0)
            {
              this.persistGeoVarCache = [];
              console.log('applyAudienceSelection observable: analysisLevel:', this.appStateService.analysisLevel$.getValue(), ' - geos.count', geos.length);
              // this.varService.clearAll(false);
              this.getGeoData(this.appStateService.analysisLevel$.getValue(), geos, selectedAudiences);
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
    this.logger.debug.log('clearing shading data cache');
    const current = this.shadingData.getValue();
    current.clear();
    // this.shadingData.next(current);
  }

  private getShadingData(analysisLevel: string, geos: string[], audience: AudienceDataDefinition) {
    const key = 'SHADING_DATA';
    this.logger.debug.log('get shading data called');
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const source = this.audienceSources.get(sourceId);

    if (source != null) {
      const currentShadingData = this.shadingData.getValue();
      this.store$.dispatch(new StartBusyIndicator({key, message: 'Retrieving shading data'}));

      if (audience.requiresGeoPreCaching) {
        const startPopChunks: number = performance.now();
        this.cacheGeosOnServer(geos, startPopChunks).subscribe(txId => {
          source(analysisLevel, [audience.audienceIdentifier], [], true, txId, audience).subscribe(
            data => data.forEach(gv => currentShadingData.set(gv.geocode, gv)),
            err => this.logger.error.log('There was an error retrieving audience data for map shading', err),
            () => {
              this.removeServerGeoCache(txId, startPopChunks).subscribe();
              this.shadingData.next(currentShadingData);
              this.store$.dispatch(new StopBusyIndicator({key}));
            });
        });
      } else {
        source(analysisLevel, [audience.audienceIdentifier], geos, true, null, audience).subscribe(
          data => data.forEach(gv => currentShadingData.set(gv.geocode, gv)),
          err => this.logger.error.log('There was an error retrieving audience data for map shading', err),
          () => {
            this.shadingData.next(currentShadingData);
            this.store$.dispatch(new StopBusyIndicator({key}));
          });
      }
    }
  }

  private getGeoData(analysisLevel: string, geos: string[], selectedAudiences: AudienceDataDefinition[]) {
    const key = this.spinnerKey;
    const notificationTitle = 'Audience Error';
    const errorMessage = 'There was an error retrieving audience data';
    const nonCachedAudiences = selectedAudiences.filter(a => !a.requiresGeoPreCaching);
    const preCachedAudiences = selectedAudiences.filter(a => a.requiresGeoPreCaching);
    const observables: Observable<ImpGeofootprintVar[]>[] = [];

    if (selectedAudiences.length > 0) {
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Retrieving audience data' }));
    }

    if (nonCachedAudiences.length > 0) {
      observables.push(this.getDataForNonCachedGeos(analysisLevel, nonCachedAudiences, geos));
    }

    if (preCachedAudiences.length > 0) {
      const startTransaction: number = performance.now();
      observables.push(
        this.cacheGeosOnServer(geos, startTransaction).pipe(
          mergeMap(txId => concat(this.getDataForCachedGeos(analysisLevel, preCachedAudiences, txId, startTransaction),
                                         this.removeServerGeoCache(txId, startTransaction)))
      ));
    }

    merge(...observables, 4).subscribe(vars => {
      if (vars != null && vars.length > 0) {
        this.varService.add(vars);
      }
    }, err => {
      console.error('There was an error retrieving data from the server. Additional info:', err);
      this.store$.dispatch(new StopBusyIndicator({ key }));
      this.store$.dispatch(new ErrorNotification({ notificationTitle, message: errorMessage }));
    }, () => {
      this.store$.dispatch(new StopBusyIndicator({ key }));
    });
  }

  private cacheGeosOnServer(geocodes: string[], txStartTime: number) : Observable<number> {
    const chunks = this.config.geoInfoQueryChunks;
    this.logger.info.log('Populating', geocodes.length, 'geo chunks on server');
    return this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks, geocodes}]).pipe(
      tap(response => this.logger.info.log('populateChunkedGeos took ', formatMilli(performance.now() - txStartTime), ', Response:', response)),
      map(response => response.payload.transactionId)
    );
  }

  private getDataForCachedGeos(analysisLevel: string, selectedAudiences: AudienceDataDefinition[], transactionId: number, txStartTime: number) : Observable<ImpGeofootprintVar[]> {
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    const audiencesBySource = groupByExtended(selectedAudiences, a => this.createKey(a.audienceSourceType, a.audienceSourceName));
    const isolatedGetStart = performance.now();

    audiencesBySource.forEach((audiences, source) => {
      const refreshCallback = this.audienceSources.get(source);
      if (refreshCallback != null) {
        const ids = audiences.map(a => a.audienceIdentifier);
        observables.push(
          refreshCallback(analysisLevel, ids, [], false, transactionId).pipe(
            tap(response => this.logger.info.log(`Retrieve GeoVar data for "${source}" took`, formatMilli(performance.now() - isolatedGetStart), ', Count:', response.length)),
          )
        );
      }
    });

    return merge(...observables, 4).pipe(
      reduce((a, c) => accumulateArrays(a, c), []),
      tap(response => this.logger.info.log('Total GeoVar data retrieval took', formatMilli(performance.now() - isolatedGetStart), ', Total:', response.length)),
      tap(() => this.logger.info.log('Total Populate & Retrieve time', formatMilli(performance.now() - txStartTime))),
    );
  }

  private getDataForNonCachedGeos(analysisLevel: string, selectedAudiences: AudienceDataDefinition[], geos: string[]) : Observable<ImpGeofootprintVar[]> {
    const observables: Observable<ImpGeofootprintVar[]>[] = [];
    const audiencesBySource = groupByExtended(selectedAudiences, a => this.createKey(a.audienceSourceType, a.audienceSourceName));
    audiencesBySource.forEach((audiences, source) => {
      const refreshCallback = this.audienceSources.get(source);
      const ids = audiences.map(a => a.audienceIdentifier);
      if (refreshCallback != null) {
        observables.push(refreshCallback(analysisLevel, ids, geos, false, null, audiences[0]));
      }
    });
    return merge(...observables, 4).pipe(
      reduce((a, c) => accumulateArrays(a, c), [])
    );
  }

  private removeServerGeoCache(transactionId: number, txStartTime: number) : Observable<any> {
    const deleteStartTime = performance.now();
    return this.restService.delete('v1/targeting/base/chunkedgeos/deleteChunks/', transactionId).pipe(
      tap(response => this.logger.info.log('deleteChunks took ', formatMilli(performance.now() - deleteStartTime), ', Response:', response)),
      tap(() => this.logger.info.log('Total Transaction time', formatMilli(performance.now() - txStartTime))),
      map(() => null) // just to make sure it doesn't try to stuff this into the varService
    );
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
      } else {
         inputData = {
          geoType: serviceAnalysisLevel,
          source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
          geocodes: ['*'],
          digCategoryIds: [numericId],
          varType: ['ALL']
        };
        reqInput.push(inputData);
      }
    });
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
}
