/* tslint:disable:max-line-length */
import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { accumulateArrays, dedupeSimpleSet, formatMilli, groupByExtended, isNumber, mapByExtended } from '@val/common';
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
import { DeleteAudience, ClearAudiences, UpsertAudience, ApplyAudiences, FetchMapVar, ClearAudienceStats, RehydrateAudiences } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { ClearGeoVars } from './../impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { ClearMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.actions';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

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
  public static audienceSeq: number = 0;

  public readonly spinnerKey: string = 'TargetAudienceServiceKey';

  public newSelectedGeos$: Observable<string[]>;
  public newVisibleGeos$: Observable<string[]>;

  private nationalSources = new Map<string, nationalSource>();
  private audienceSources = new Map<string, audienceSource>();
  public  audienceMap: Map<string, AudienceDataDefinition> = new Map<string, AudienceDataDefinition>();
  private audiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  private deletedAudiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  private shadingData: BehaviorSubject<Map<string, ImpGeofootprintVar>> = new BehaviorSubject<Map<string, ImpGeofootprintVar>>(new Map<string, ImpGeofootprintVar>());
  private shadingSub: Subscription;
  private selectedSub: Subscription;

  public shadingData$: Observable<Map<string, ImpGeofootprintVar>> = this.shadingData.asObservable();
  public audiences$: Observable<AudienceDataDefinition[]> = this.audiences.asObservable();
  public deletedAudiences$: Observable<AudienceDataDefinition[]> = this.deletedAudiences.asObservable();

  public  timingMap: Map<string, number> = new Map<string, number>();
  private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  private mapAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  private natExportAudiencesBS$ = new BehaviorSubject<Audience[]>([]);

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

    // Subscribe to store selectors
    this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
    this.store$.select(fromAudienceSelectors.getAudiencesOnMap).subscribe(this.mapAudiencesBS$);
    this.store$.select(fromAudienceSelectors.getAudiencesNationalExtract).subscribe(this.natExportAudiencesBS$);

    this.audiences$ = this.store$.select(fromAudienceSelectors.allAudiences);
/*
// TODO: This does work, but causes an error on reload
    this.store$.select(fromAudienceSelectors.getAudiencesOnMap).subscribe(shadingAudience => {
      console.log('### getAudiencesOnMap.sub - audience:', shadingAudience);
      //const shadingAudience = audiences.filter(a => a.showOnMap);
      // const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
      // console.log('applyAudienceSelection fired - # Audiences:', audiences.length, ', selectedAudiences.length:', selectedAudiences.length, ', shadingAudience.length:', shadingAudience.length, ', audiences:', audiences);
      this.unsubEverything();
      this.clearShadingData();
      this.clearVars();
      if (shadingAudience.length > 1) {
        this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Selected Audience Error', message: 'Only 1 Audience can be selected to shade the map by.' }));
      }
      else if (shadingAudience.length === 1) {
        console.log('### getAudiencesOnMap.sub - length === 1');
        const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
        this.shadingSub = combineLatest(this.appStateService.analysisLevel$, visibleGeos$)
          .subscribe(([analysisLevel, visibleGeos]) => this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]));
      }
      else if (shadingAudience.length === 0) {
        console.log('### getAudiencesOnMap.sub - length === 0');
        if (this.shadingSub) this.shadingSub.unsubscribe();
          this.store$.dispatch(new ClearShadingData());
      }
    });*/
  }

  public createKey = (...values: string[]) => values.join('/');

  public ngOnDestroy() : void {
    this.unsubEverything();
  }

  public clearAll() : void {
    this.audienceMap.clear();
    this.audienceSources.clear();
    this.nationalSources.clear();
    this.store$.dispatch( new ClearMapVars());
    this.store$.dispatch( new ClearGeoVars());
    this.store$.dispatch( new ClearAudiences());
    this.store$.dispatch( new ClearAudienceStats());
    this.shadingData.next(new Map<string, ImpGeofootprintVar>());
    this.audiences.next([]);
  }

  public rehydrateAudiences() {
    this.store$.dispatch(new RehydrateAudiences());
  }

  public addAudience(audience: AudienceDataDefinition, nationalRefresh?: nationalSource, isReload: boolean = false) : void {
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const audienceId = this.createKey(sourceId, audience.audienceIdentifier);

    this.logger.debug.log('addAudience - seq:', ((audience != null) ? audience.seq : ''), ', sourceId:', sourceId, ', audienceName:', ((audience != null) ? audience.audienceName : ''), ', audienceSourceName: ', ((audience != null) ? audience.audienceSourceName : ''));

    if (audience.audienceSourceName === 'Audience-TA')
      this.audienceMap.set(`/${sourceId}-${audience.secondaryId}`, audience);
    else
      this.audienceMap.set(audienceId, audience);

    if (nationalRefresh != null)
      this.nationalSources.set(sourceId, nationalRefresh);

    if (audience.audienceSourceType === 'Custom' && audience.fieldconte === null)
      audience.fieldconte = FieldContentTypeCodes.Char;

    // Check to see if this is an update to protect the sequence
    const existingAudience = (this.allAudiencesBS$.getValue() != null) ? this.allAudiencesBS$.getValue().find(aud => aud.audienceIdentifier === audience.audienceIdentifier) : null;

    // If necessary assign a new seq value (audience sort order)
    if (audience.seq == null) {
      if (existingAudience != null && existingAudience.seq != null) {
        audience.seq = existingAudience.seq;
      }
      else {
        audience.seq = this.allAudiencesBS$.value.length;
      }
    }
    else
      if (!isReload && (audience.seq < this.allAudiencesBS$.value.length))
        audience.seq = this.allAudiencesBS$.value.length;

    if (!isReload) {
      const projectVar = this.createProjectVar(audience);

      // protect against adding dupes to the data store
      if ( projectVar && (this.projectVarService.get().filter(pv => pv.source === projectVar.source && pv.fieldname === projectVar.fieldname).length > 0))
        console.warn('refusing to add duplicate project var: ', projectVar, this.projectVarService.get());
      else {
        if (projectVar) this.projectVarService.add([projectVar]);
      }
    }
    this.store$.dispatch(new UpsertAudience({ audience: audience }));
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
      varPk = existingPVar[0].varPk;
    }
    else {
      const audiences: Audience[] = this.allAudiencesBS$.value;
      const dsAudience = (audience.audienceIdentifier != null)
                         ? audiences.filter(aud => aud.audienceIdentifier === audience.audienceIdentifier)
                         : audiences.filter(aud => aud.audienceName === audience.audienceName);
      if (dsAudience != null && dsAudience.length > 0) {
        varPk = dsAudience[0].audienceIdentifier;
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
    }
    audience.audienceIdentifier = varPk.toString();
    const currentProject = this.appStateService.currentProject$.getValue();
    //console.log("createProjectVar varPk: " + varPk + ", audienceIdentifier:" + audience.audienceIdentifier + ", audienceSourceName: " + audience.audienceSourceName + ", audienceSourceType: " + audience.audienceSourceType + ", audienceName: " + audience.audienceName);

    // This is misleading, createProjectVar will both create AND update a project var
    return this.domainFactory.createProjectVar(currentProject, varPk, audience);
  }

  public syncProjectVars() {
    this.allAudiencesBS$.value.forEach(aud => {
      this.createProjectVar(aud);
    });
  }

  public updateProjectVars(audience: AudienceDataDefinition) {
    //console.debug("updateProjectVars fired: audience.audienceIdentifier: " + audience.audienceIdentifier);
    const newProjectVar = this.createProjectVar(audience);
    this.store$.dispatch(new UpsertAudience({ audience: audience }));
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
        newPv.isShadedOnMap = false; // gotta turn off all the others since we can only shade by one variable
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
    const audienceIdentifier = audience.audienceSourceType === 'Custom' ? audience.audienceName : audience.audienceIdentifier;
    if (sourceType === audience.audienceSourceType && sourceName === audience.audienceSourceName && id.toString() === audienceIdentifier) {
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
    this.store$.dispatch(new DeleteAudience ({ id: audienceIdentifier }));

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
    const reqInput = [];
    const audiences = this.natExportAudiencesBS$.value;
//  const audiences = Array.from(this.audienceMap.values()).filter(a => a.exportNationally === true);
    if (audiences.length > 0 && analysisLevel != null && analysisLevel.length > 0 && projectId != null) {
      const convertedData: any[] = [];
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Downloading National Data' }));
      if (analysisLevel === 'PCR'){
        audiences.forEach(audience => {
          let inputData;
          const numericId = Number(audience.audienceIdentifier);
          const duplicateCategorys = reqInput.length > 0 ? reqInput.filter( inputMap => inputMap['source'] == audience.audienceSourceName) : [];
          if (duplicateCategorys.length > 0){
            duplicateCategorys[0]['digCategoryIds'].push(numericId);
          } else {
             inputData = {
              geoType: analysisLevel,
              source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
              geocodes: ['*'],
              digCategoryIds: [numericId],
              varType: ['ALL']
            };
            reqInput.push(inputData);
          }
        });
        this.restService.post('v1/targeting/base/geoinfo/digitallookuppcr', reqInput). subscribe(res => {
          const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
          const fileName = `NatlExtract_${analysisLevel}_${projectId}_${fmtDate}.csv`.replace(/\//g, '_');
          const url = 'https://impowerdev.val.vlss.local/nationalextract/ID-VALVCSTRN014VM-62527-1564060554517-36-37500.csv';
          //res.payload;
          console.log('response fuse:::', res);
          const element = window.document.createElement('a');
          document.body.appendChild(element);
          element.href = res.payload;
          
          element['download'] = fileName;
          element.target = '_blank';
          
          element.click();
        });
      }else{
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
      }
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

  public clearVars() {
    const project = this.appStateService.currentProject$.getValue();
    const tas = (project != null) ? project.getImpGeofootprintTradeAreas() : [];

    for (const ta of tas) {
      ta.impGeofootprintVars = [];
    }
    this.varService.clearAll();
  }

  public syncProjectVarOrder()
  {
    const project = this.appStateService.currentProject$.getValue();
    this.allAudiencesBS$.value.forEach((audience, key) => {
      const updatedPv = this.domainFactory.createProjectVar(this.appStateService.currentProject$.getValue(), Number(audience.audienceIdentifier), audience);
      const hierPv = project.impProjectVars.find(pv => pv.varPk.toString() === audience.audienceIdentifier); // forEach(projectVar => projectVar.sortOrder = this.projectVarService.get().filter())
      hierPv.sortOrder = updatedPv.sortOrder;
    });
  }

  // This is a temporary helper method to ensure the legacy audienceMap is in alignment with the new NgRx store
  private setAudienceMapFromStore()
  {
    this.audienceMap.clear();
    this.allAudiencesBS$.value.forEach((audience, key) => {
   // this.logger.debug.log('### setAudienceMapFromStore - setting key:', key, ', audience:', audience.audienceIdentifier, ', source:', audience.audienceSourceType, ', sourceName:', audience.audienceSourceName, ', secondaryId:', audience.secondaryId);
      const audKey = audience.audienceSourceType + '/' + audience.audienceSourceName + '/' + audience.audienceIdentifier;
      this.audienceMap.set(audKey, audience);
    });
  }

  public rehydrateShading() { // REVIEW
    this.setAudienceMapFromStore();

    const shadingAudience = Array.from(this.mapAudiencesBS$.value);
    this.logger.info.log('rehydrateShading fired - shadingAudience.length:', shadingAudience.length, ', shadingAudience:', shadingAudience);
    if (this.shadingSub) this.shadingSub.unsubscribe();
    this.clearShadingData();

    switch (shadingAudience.length) {
      case 0:
        if (this.shadingSub) this.shadingSub.unsubscribe();
        this.store$.dispatch(new ClearShadingData());
        break;

      case 1:
        const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
        this.shadingSub = combineLatest(this.appStateService.analysisLevel$, visibleGeos$)
          .subscribe(([analysisLevel, visibleGeos]) => this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]));
        // console.log('### rehydrateShading visibleGeos:', visibleGeos$.getValue().length, visibleGeos$.getValue());
        // if (visibleGeos$.getValue().length > 0)
        //   this.store$.dispatch(new FetchMapVar({ analysisLevel: this.appStateService.analysisLevel$.getValue(), geos: visibleGeos$.getValue() }));
        break;

      default:
        this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Selected Audience Error', message: 'Only 1 Audience can be selected to shade the map by.' }));
        break;
    }
  }

  public applyAudienceSelection() : void {
    this.setAudienceMapFromStore();

    const audiences = Array.from(this.allAudiencesBS$.value);
    const shadingAudience = Array.from(this.mapAudiencesBS$.value);
    const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
    this.logger.info.log('applyAudienceSelection fired - # Audiences:', audiences.length, ', selectedAudiences.length:', selectedAudiences.length, ', shadingAudience.length:', shadingAudience.length, ', audiences:', audiences);
    this.unsubEverything();
    this.clearVars();
    this.clearShadingData();
/*    if (shadingAudience.length > 1) {
      this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Selected Audience Error', message: 'Only 1 Audience can be selected to shade the map by.' }));
    }
    else
      if (shadingAudience.length === 1) {
        const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
        this.shadingSub = combineLatest(this.appStateService.analysisLevel$, visibleGeos$)
          .subscribe(([analysisLevel, visibleGeos]) => this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]));
      }
      else
        if (shadingAudience.length === 0) {
          if (this.shadingSub) this.shadingSub.unsubscribe();
            this.store$.dispatch(new ClearShadingData());
        }*/
    this.rehydrateShading();

    if (audiences.length > 0) {
      this.store$.dispatch(new ApplyAudiences({analysisLevel: this.appStateService.analysisLevel$.getValue()}));
    }

    if (selectedAudiences.length > 0) {
      // set up a watch process
      this.selectedSub = this.newSelectedGeos$.pipe(debounceTime(500))
        .subscribe(
          geos => {
            if (geos.length > 0)
            {
              this.logger.debug.log('applyAudienceSelection observable: analysisLevel:', this.appStateService.analysisLevel$.getValue(), ' - geos.count', geos.length);
              this.getGeoData(this.appStateService.analysisLevel$.getValue(), geos, selectedAudiences);
            }
          }
        );
    }
  }

  public unsubEverything() {
    if (this.shadingSub) this.shadingSub.unsubscribe();
    if (this.selectedSub) this.selectedSub.unsubscribe();
  }

  public clearShadingData() : void {
    this.logger.debug.log('clearing shading data cache');
    const current = this.shadingData.getValue();
    current.clear();
  }

  private getShadingData(analysisLevel: string, geos: string[], audience: AudienceDataDefinition) {
    if (geos == null || geos.length === 0 || audience == null) {
      return;
    }
    // this.logger.debug.log('### getShadingData - fired - lvl:', analysisLevel, ', audience:', audience, ', # geos:', geos.length);
    this.setAudienceMapFromStore();

    const key = 'SHADING_DATA';
    this.logger.debug.log('get shading data called for audience:', audience);
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const source = this.audienceSources.get(sourceId);

    // this.logger.debug.log('getShadingData - audienceSources:');
    // this.audienceSources.forEach((value, sourceKey) => {
    //   this.logger.debug.log('getShadingData - audienceSources - key:', sourceKey, ', value:', value);
    // });
    // this.logger.debug.log('getShadingData - audienceSources ', (this.audienceSources.has(sourceId) ? 'has' : 'does not have'), sourceId);
    // this.logger.debug.log('getShadingData - sourceId:', sourceId, ', source:', source, ', audienceSources:', this.audienceSources);

    if (this.mapAudiencesBS$.value.length > 0) {
      const currentShadingData = this.shadingData.getValue();
//REVIEW      this.store$.dispatch(new StartBusyIndicator({key, message: 'Retrieving shading data'}));
  //      if (audience.requiresGeoPreCaching) {
        //this.store$.dispatch(new MapVarCacheGeos({ geocodes: new Set(geos) }));
          this.store$.dispatch(new FetchMapVar({ analysisLevel: analysisLevel, geos: geos }));
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
    const sourceNameGen = (a: AudienceDataDefinition) => a.audienceSourceName.replace(/-/g, '_');
    const dmaAudiences = mapByExtended(audiences, a => `${a.audienceIdentifier}_${sourceNameGen(a)}_DMA`.toLowerCase());
    const natAudiences = mapByExtended(audiences, a => `${a.audienceIdentifier}_${sourceNameGen(a)}_NAT`.toLowerCase());
    const observables: Observable<any[]>[] = this.nationalRefreshDownload(audiences , analysisLevel);
    return merge(...observables, 4).pipe(
      map(data => data.map(d => {
        const result = { Geocode: d.geocode };
        for (const key of Object.keys(d.attrs)) {
          if (dmaAudiences.has(key.toLowerCase())) {
            const audience = dmaAudiences.get(key.toLowerCase());
            const newKey = `${audience.audienceName} (${sourceNameGen(audience)} - DMA)`;
            result[newKey] = isNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
          } else if (natAudiences.has(key.toLowerCase())) {
            const audience = natAudiences.get(key.toLowerCase());
            const newKey = `${audience.audienceName} (${sourceNameGen(audience)} - National)`;
            result[newKey] = isNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
          } else {
            result[key] = Math.round(Number(d.attrs[key]));
          }
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
    if (reqInput.length > 0) {
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
