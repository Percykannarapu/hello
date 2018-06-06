import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, merge } from 'rxjs';
import { distinctUntilChanged, filter, map, mergeMap, switchMap, take, tap } from 'rxjs/operators';
import { UsageService } from './usage.service';
import { ValGeoService } from './app-geo.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { AppMessagingService } from './app-messaging.service';
import { AppConfig } from '../app.config';
import { MapDispatchService } from './map-dispatch.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import * as XLSX from 'xlsx';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';

export type audienceSource = (analysisLevel: string, identifiers: string[], geocodes: string[]) => Observable<ImpGeofootprintVar[]>;
export type nationalSource = (analysisLevel: string, identifier: string) => Observable<any[]>;

@Injectable()
export class TargetAudienceService implements OnDestroy {
  private readonly spinnerKey: string = 'TargetAudienceServiceKey';

  private newSelectedGeos$: Observable<string[]>;
  private newVisibleGeos$: Observable<string[]>;
  private currentVisibleGeos$: Observable<string[]>;
  private analysisLevel$: Observable<string>;

  private nationalSources = new Map<string, nationalSource>();
  private audienceSources = new Map<string, audienceSource>();
  private audienceMap: Map<string, AudienceDataDefinition> = new Map<string, AudienceDataDefinition>();
  private audiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  private shadingData: BehaviorSubject<Map<string, ImpGeofootprintVar>> = new BehaviorSubject<Map<string, ImpGeofootprintVar>>(new Map<string, ImpGeofootprintVar>());
  private shadingSub: Subscription;
  private selectedSub: Subscription;

  private currentAnalysisLevel: string; // only used for National Extract

  public shadingData$: Observable<Map<string, ImpGeofootprintVar>> = this.shadingData.asObservable();
  public audiences$: Observable<AudienceDataDefinition[]> = this.audiences.asObservable();

  constructor(private geoService: ValGeoService, private discoveryService: ImpDiscoveryService,
              private varService: ImpGeofootprintVarService, private projectService: ImpProjectService,
              private usageService: UsageService, private messagingService: AppMessagingService,
              private config: AppConfig, private mapDispatchService: MapDispatchService) {
    this.analysisLevel$ = this.discoveryService.storeObservable.pipe(
      filter(disc => disc != null && disc.length > 0 && disc[0].analysisLevel != null && disc[0].analysisLevel !== ''),
      map(disc => disc[0].analysisLevel),
      distinctUntilChanged(),
      tap(al => this.currentAnalysisLevel = al)
    );

    this.newVisibleGeos$ = this.analysisLevel$.pipe(
      map(al => this.config.getLayerIdForAnalysisLevel(al)),     // convert it to a layer id
      tap(() => this.clearShadingData()),   // and clear the data cache
      switchMap(layerId => this.mapDispatchService.geocodesInViewExtent(layerId)), // set up sub on map-visible geocodes
      map(geos => geos.filter(geo => !this.shadingData.getValue().has(geo))) // and return any that aren't in the cache
    );

    this.currentVisibleGeos$ = this.analysisLevel$.pipe(
      map(al => this.config.getLayerIdForAnalysisLevel(al)),
      mergeMap(layerId => this.mapDispatchService.geocodesInViewExtent(layerId, true).pipe(take(1)))
    );

    this.newSelectedGeos$ = this.geoService.uniqueSelectedGeocodes$.pipe(
      map(geos => {
        const varGeos = new Set(this.varService.get().map(gv => gv.geocode));
        return geos.filter(g => !varGeos.has(g));
      })
    );
  }

  private createKey = (...values: string[]) => values.join('/');

  public ngOnDestroy() : void {
    this.unsubEverything();
  }

  public addAudience(audience: AudienceDataDefinition, sourceRefresh: audienceSource, nationalRefresh?: nationalSource) : void {
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const audienceId = this.createKey(sourceId, audience.audienceIdentifier);
    this.audienceSources.set(sourceId, sourceRefresh);
    this.audienceMap.set(audienceId, audience);
    if (nationalRefresh != null) this.nationalSources.set(sourceId, nationalRefresh);
    this.audiences.next(Array.from(this.audienceMap.values()));
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
      this.audiences.next(Array.from(this.audienceMap.values()));
    }
  }

  public exportNationalExtract() : void {
    const spinnerId = 'NATIONAL_EXTRACT';
    const audiences = Array.from(this.audienceMap.values()).filter(a => a.exportNationally === true);
    const projects = this.projectService.get();
    if (audiences.length > 0 && this.currentAnalysisLevel != null && this.currentAnalysisLevel.length > 0 && projects.length > 0 && projects[0].projectId != null) {
      const convertedData: any[] = [];
      this.messagingService.startSpinnerDialog(spinnerId, 'Downloading National Data');
      this.getNationalData(audiences[0]).subscribe(
        data => convertedData.push(...data),
        err => {
          console.error('There was an error processing the National Extract', err);
          this.messagingService.stopSpinnerDialog(spinnerId);
        },
        () => {
          try {
            const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'export' });
            const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName + '~' + audiences[0].audienceSourceName + '~' + this.discoveryService.get()[0].analysisLevel;
            this.usageService.createCounterMetric(usageMetricName, metricText, convertedData.length);
            const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
            const fileName = `NatlExtract_${this.currentAnalysisLevel}_${audiences[0].audienceIdentifier}_${fmtDate}.xlsx`;
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
      } else if (this.currentAnalysisLevel == null || this.currentAnalysisLevel.length === 0) {
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
      combineLatest(this.analysisLevel$, this.currentVisibleGeos$).subscribe(
        ([analysisLevel, geos]) => this.getShadingData(analysisLevel, geos, shadingAudience[0]));
      // set up a map watch process
      this.shadingSub = combineLatest(this.analysisLevel$, this.newVisibleGeos$).subscribe(
        ([analysisLevel, geos]) => this.getShadingData(analysisLevel, geos, shadingAudience[0])
      );
    }
    if (selectedAudiences.length > 0) {
      // pre-load selection data
      combineLatest(this.analysisLevel$, this.geoService.uniqueSelectedGeocodes$).pipe(
        take(1),
      ).subscribe(
        ([analysisLevel, geos]) => this.persistGeoVarData(analysisLevel, geos, selectedAudiences)
      );
      // set up a watch process
      this.selectedSub = combineLatest(this.analysisLevel$, this.newSelectedGeos$).subscribe(
        ([analysisLevel, geos]) => this.persistGeoVarData(analysisLevel, geos, selectedAudiences)
      );
    }
  }

  private unsubEverything() {
    if (this.shadingSub) this.shadingSub.unsubscribe();
    if (this.selectedSub) this.selectedSub.unsubscribe();
  }

  private clearShadingData() : void {
    console.log('clearing shading data cache');
    const current = this.shadingData.getValue();
    current.clear();
    this.shadingData.next(current);
  }

  private getShadingData(analysisLevel: string, geos: string[], audience: AudienceDataDefinition) {
    console.log('get shading data called');
    const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    const source = this.audienceSources.get(sourceId);
    if (source != null) {
      const currentShadingData = this.shadingData.getValue();
      // this is an http call, no need for an unsub
      source(analysisLevel, [audience.audienceIdentifier], geos).subscribe(
        data => data.forEach(gv => currentShadingData.set(gv.geocode, gv)),
        err => console.error('There was an error retrieving audience data for map shading', err),
        () => this.shadingData.next(currentShadingData)
      );
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
        observables.push(sourceRefresh(analysisLevel, ids, geos));
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

  private getNationalData(audience: AudienceDataDefinition) : Observable<any[]> {
    const sourceKey = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
    return this.nationalSources.get(sourceKey)(this.currentAnalysisLevel, audience.audienceIdentifier);
  }
}
