import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, merge } from 'rxjs';
import { map, mergeMap, switchMap, take, tap, skip, filter } from 'rxjs/operators';
import { UsageService } from './usage.service';
import { AppGeoService } from './app-geo.service';
import { AppMessagingService } from './app-messaging.service';
import { AppConfig } from '../app.config';
import { MapDispatchService } from './map-dispatch.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition, AudienceTradeAreaConfig } from '../models/audience-data.model';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import * as XLSX from 'xlsx';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppStateService } from './app-state.service';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpProjectVar } from '../val-modules/targeting/models/ImpProjectVar';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';
import { DAOBaseStatus } from '../val-modules/api/models/BaseModel';
import { TargetAudienceTdaService } from './target-audience-tda.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';

export type audienceSource = (analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, audience?: AudienceDataDefinition) => Observable<ImpGeofootprintVar[]>;
export type nationalSource = (analysisLevel: string, identifier: string) => Observable<any[]>;

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceService implements OnDestroy {
  private readonly spinnerKey: string = 'TargetAudienceServiceKey';

  private newSelectedGeos$: Observable<string[]>;
  private newVisibleGeos$: Observable<string[]>;
  private currentVisibleGeos$: Observable<string[]>;

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

  constructor(private geoService: AppGeoService, private appStateService: AppStateService,
    private varService: ImpGeofootprintVarService, private projectService: ImpProjectService,
    private usageService: UsageService, private messagingService: AppMessagingService,
    private config: AppConfig, private mapDispatchService: MapDispatchService,
    private projectVarService: ImpProjectVarService, private restService: RestDataService) {
    const layerId$ = this.appStateService.analysisLevel$.pipe(
      filter(al => al != null && al.length > 0),
      map(al => this.config.getLayerIdForAnalysisLevel(al)),     // convert it to a layer id
    );

    this.newVisibleGeos$ = layerId$.pipe(
      tap(() => this.clearShadingData()),   // and clear the data cache
      switchMap(layerId => this.mapDispatchService.geocodesInViewExtent(layerId)), // set up sub on map-visible geocodes
      map(geos => geos.filter(geo => !this.shadingData.getValue().has(geo))) // and return any that aren't in the cache
    );

    this.currentVisibleGeos$ = layerId$.pipe(
      mergeMap(layerId => this.mapDispatchService.geocodesInViewExtent(layerId, true).pipe(take(1)))
    );

    this.newSelectedGeos$ = this.appStateService.uniqueSelectedGeocodes$.pipe(
      map(geos => {
        const varGeos = new Set(this.varService.get().map(gv => gv.geocode));
        return geos.filter(g => !varGeos.has(g));
      })
    );

    this.appStateService.projectIsLoading$.pipe(
      filter(loading => loading),
    ).subscribe(loading => {
      this.audienceMap.clear();
      this.audiences.next(Array.from(this.audienceMap.values()));
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
    this.audiences.next(Array.from(this.audienceMap.values()));
  }

  private createProjectVar(audience: AudienceDataDefinition, id?: number) : ImpProjectVar {
    const projectVar = new ImpProjectVar();
    try {
      let source = audience.audienceSourceType + '_' + audience.audienceSourceName;
      source = source.replace(' ', '_');
      source = source + '~' + audience.audienceIdentifier;
      projectVar.pvId = id ? id : null;
      projectVar.baseStatus = DAOBaseStatus.INSERT;
      projectVar.varPk = this.projectVarService.getNextStoreId();
      projectVar.isShadedOnMap = audience.showOnMap;
      projectVar.isIncludedInGeoGrid = audience.showOnGrid;
      projectVar.isIncludedInGeofootprint = audience.exportInGeoFootprint;
      projectVar.isNationalExtract = audience.exportNationally;
      projectVar.indexBase = audience.selectedDataSet;
      projectVar.fieldname = audience.audienceName;
      projectVar.source = source;
      projectVar.isCustom = audience.audienceSourceType.match('Custom') ? true : false;
      projectVar.isString = false;
      projectVar.isNumber = false;
      projectVar.isUploaded = false;
      projectVar.isActive = true;
    } catch (error) {
      console.log(error);
      return null;
    }
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
    const sourceName = projectVar.source.split('_')[1].split('~')[0];
    const id = projectVar.source.split('~')[1];
    if (sourceType === audience.audienceSourceType && sourceName === audience.audienceSourceName && id === audience.audienceIdentifier) {
      return true;
    }
    return false;
  }

  private removeProjectVar(sourceType: 'Online' | 'Offline' | 'Custom', sourceName: string, audienceIdentifier: string) {
    for (const projectVar of this.projectVarService.get()) {
      const parts = projectVar.source.split('~');
      let source = sourceType.toUpperCase() + '_' + sourceName.toUpperCase();
      source = source.replace(' ', '_');
      if (parts[0] === source && parts[1] === audienceIdentifier) {
        if (projectVar.varPk) {
          // remove it from the database only if it has an ID populated
          this.projectVarService.addDbRemove(projectVar);
        }
        this.projectVarService.remove(projectVar);
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
            const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName + '~' + audiences[0].audienceSourceName + '~' + analysisLevel;
            this.usageService.createCounterMetric(usageMetricName, metricText, convertedData.length);
            const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
            const fileName = `NatlExtract_${analysisLevel}_${audiences[0].audienceIdentifier}_${fmtDate}.xlsx`;
            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(convertedData);
            const sheetName = audiences[0].audienceName.substr(0, 31); // magic number == maximum number of chars allowed in an Excel tab name
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            XLSX.writeFile(workbook, fileName);
          } finally {
            this.messagingService.stopSpinnerDialog(spinnerId);
          }
        }
      );
    } else {
      if (audiences.length === 0) {
        this.messagingService.showGrowlError('National Extract Export', 'A variable must be selected for a national extract before exporting.');
      } else if (analysisLevel == null || analysisLevel.length === 0) {
        this.messagingService.showGrowlError('National Extract Export', 'An Analysis Level must be selected for a national extract before exporting.');
      } else {
        this.messagingService.showGrowlError('National Extract Export', 'The project must be saved before exporting a national extract.');
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

  public applyAudienceSelection() : void {
    const audiences = Array.from(this.audienceMap.values());
    const shadingAudience = audiences.filter(a => a.showOnMap);
    const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
    this.unsubEverything();
    this.clearShadingData();
    this.varService.clearAll(selectedAudiences.length === 0);
    if (shadingAudience.length > 1) {
      this.messagingService.showGrowlError('Selected Audience Error', 'Only 1 Audience can be selected to shade the map by.');
    } else if (shadingAudience.length === 1) {
      // pre-load the mapping data
      // combineLatest(this.appStateService.analysisLevel$, this.currentVisibleGeos$).subscribe(
      //   ([analysisLevel, geos]) => this.getShadingData(analysisLevel, geos, shadingAudience[0]));
      // set up a map watch process
      this.shadingSub = combineLatest(this.appStateService.analysisLevel$, this.newVisibleGeos$).subscribe(
        ([analysisLevel, geos]) => this.getShadingData(analysisLevel, geos, shadingAudience[0])
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
        const ids = selectedAudiences.filter(a => this.createKey(a.audienceSourceType, a.audienceSourceName) === s).map(a => a.audienceIdentifier);
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
      err => console.error('There was an error retrieving audience data', err),
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
}
