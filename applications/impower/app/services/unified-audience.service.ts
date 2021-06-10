import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dictionary } from '@ngrx/entity';
import { Store } from '@ngrx/store';
import { arrayToSet, isConvertibleToNumber, isEmpty, isNil, isNotNil, mapByExtended } from '@val/common';
import { EsriService, firstTimeShaderDataLoadComplete } from '@val/esri';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { BehaviorSubject, combineLatest, merge, Observable, Subscription } from 'rxjs';
import { concatMap, debounceTime, filter, map, pairwise, startWith, switchMap, take, withLatestFrom } from 'rxjs/operators';
import * as XLSX from 'xlsx';
import { AppConfig } from '../app.config';
import { AudienceFetchService } from '../impower-datastore/services/audience-fetch.service';
import { AddAudience } from '../impower-datastore/state/transient/audience/audience.actions';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import {
  allAudiences,
  getAudiencesInExtract,
  getFetchableAudiencesInFootprint,
  getFetchableAudiencesInGrid,
  getMaxAssignedPk,
  getMaxSortOrder
} from '../impower-datastore/state/transient/audience/audience.selectors';
import { allCustomVarEntities } from '../impower-datastore/state/transient/custom-vars/custom-vars.selectors';
import { DynamicVariable, mergeVariablesToEntity } from '../impower-datastore/state/transient/dynamic-variable.model';
import { ClearGeoVars, FetchGeoVars } from '../impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { ClearMapVars, FetchMapVars } from '../impower-datastore/state/transient/map-vars/map-vars.actions';
import { CacheGeos, GeoTransactionType } from '../impower-datastore/state/transient/transactions/transactions.actions';
import { geoTransactionId, mapTransactionId } from '../impower-datastore/state/transient/transactions/transactions.reducer';
import { getFetchableMappedAudiences, getFirstTimeShadedAudiences } from '../impower-datastore/state/transient/transient.selectors';
import { AudienceDataDefinition, OnlineBulkDownloadDataResponse } from '../models/audience-data.model';
import { FullAppState } from '../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { FileService } from '../val-modules/common/services/file.service';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class UnifiedAudienceService {

  private listenerSubs: Subscription;
  private maxCurrentPk$ = new BehaviorSubject(0);
  private maxCurrentSortOrder$ = new BehaviorSubject(-1);
  private nationalAudiences$ = new BehaviorSubject<Audience[]>([]);

  constructor(private logger: AppLoggingService,
              private appStateService: AppStateService,
              private fetchService: AudienceFetchService,
              private esriService: EsriService,
              private domainFactory: ImpDomainFactoryService,
              private restService: RestDataService,
              private store$: Store<FullAppState>,
              private config: AppConfig,
              private http: HttpClient) {}

  public setupAudienceListeners() : void {
    this.listenerSubs = new Subscription();

    const pkSub = this.store$.select(getMaxAssignedPk).subscribe(this.maxCurrentPk$);
    this.listenerSubs.add(pkSub);

    const sortSub = this.store$.select(getMaxSortOrder).subscribe(this.maxCurrentSortOrder$);
    this.listenerSubs.add(sortSub);

    const audienceSub = this.store$.select(allAudiences).pipe(
      withLatestFrom(this.appStateService.currentProject$),
      filter(([audiences, project]) => !isEmpty(audiences) && isNotNil(project))
    ).subscribe(([audiences, project]) => {
      // no need for a project var service any more since nobody listens for changes there
      project.impProjectVars = audiences.map(a => this.domainFactory.createProjectVar(project, Number(a.audienceIdentifier), a));
    });
    this.listenerSubs.add(audienceSub);

    const natSub = this.store$.select(getAudiencesInExtract).subscribe(this.nationalAudiences$);
    this.listenerSubs.add(natSub);

    // set up transaction handler for GFP geos
    const geoCacheSub = this.appStateService.uniqueIdentifiedGeocodeSet$.pipe(debounceTime(250))
      .subscribe(geos => this.store$.dispatch(CacheGeos({ geos, geoType: GeoTransactionType.Geofootprint })));
    this.listenerSubs.add(geoCacheSub);

    // set up transaction handler for Map geos
    const mapCacheSub = this.esriService.visibleFeatures$.pipe(
      debounceTime(250)
    ).subscribe(features => {
      const geos = arrayToSet(features, f => isNotNil(f?.attributes?.geocode), f => f.attributes.geocode);
      this.store$.dispatch(CacheGeos({ geos, geoType: GeoTransactionType.Map }));
    });
    this.listenerSubs.add(mapCacheSub);

    const gridSub = combineLatest([this.store$.select(geoTransactionId), this.store$.select(getFetchableAudiencesInGrid)])
      .subscribe(([txId, audiences]) => {
      if (isNotNil(txId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchGeoVars({ audiences, txId }));
      } else {
        this.store$.dispatch(new ClearGeoVars());
      }
    });
    this.listenerSubs.add(gridSub);

    const mapAudienceSub = this.store$.select(getFetchableMappedAudiences).pipe(
      startWith([] as Audience[]),
      pairwise(),
      filter(([p, c]) => p.length !== c.length),
      map(([, c]) => c),
      withLatestFrom(this.store$.select(mapTransactionId), this.store$.select(mapTransactionId))
    ).subscribe(([audiences, mapTxId, geoTxId]) => {
      if (isNotNil(mapTxId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchMapVars({ audiences, txId: mapTxId }));
      }
      if (isNotNil(geoTxId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchMapVars({ audiences, txId: geoTxId }));
      }
      if (isEmpty(audiences)) {
        this.store$.dispatch(new ClearMapVars());
      }
    });
    this.listenerSubs.add(mapAudienceSub);

    const mapTxSub = this.store$.select(mapTransactionId).pipe(
      withLatestFrom(this.store$.select(getFetchableMappedAudiences))
    ).subscribe(([txId, audiences]) => {
      if (isNotNil(txId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchMapVars({ audiences, txId }));
      }
    });
    this.listenerSubs.add(mapTxSub);

    const mapGeoSub = this.store$.select(geoTransactionId).pipe(
      withLatestFrom(this.store$.select(getFetchableMappedAudiences))
    ).subscribe(([txId, audiences]) => {
        if (isNotNil(txId) && !isEmpty(audiences)) {
          this.store$.dispatch(new FetchMapVars({ audiences, txId }));
        }
      });
    this.listenerSubs.add(mapGeoSub);

    const layerCreationSub = this.store$.select(getFirstTimeShadedAudiences).pipe(
      withLatestFrom(this.store$.select(mapTransactionId), this.store$.select(geoTransactionId))
    ).subscribe(([audiences, mapTxId, geoTxId]) => {
      if (isNotNil(mapTxId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchMapVars({ audiences, txId: mapTxId }));
      }
      if (isNotNil(geoTxId) && !isEmpty(audiences)) {
        this.store$.dispatch(new FetchMapVars({ audiences, txId: geoTxId }));
      }
      if (!isEmpty(audiences)) {
        this.store$.dispatch(firstTimeShaderDataLoadComplete({ dataKeys: audiences.map(a => a.audienceIdentifier) }));
      }
    });
    this.listenerSubs.add(layerCreationSub);
  }

  public teardownAudienceListeners() : void {
    if (this.listenerSubs) this.listenerSubs.unsubscribe();
    this.maxCurrentPk$.next(0);
    this.maxCurrentSortOrder$.next(-1);
  }

  public getNextVarPk() : number {
    return this.maxCurrentPk$.getValue() + 1;
  }

  public addAudience(audienceData: AudienceDataDefinition) : void {
    const audience: Audience = {
      ...audienceData,
      audienceIdentifier: audienceData.audienceIdentifier ?? `${this.getNextVarPk()}`,
      sortOrder: audienceData.sortOrder ?? this.maxCurrentSortOrder$.getValue() + 1
    };
    this.store$.dispatch(new AddAudience({ audience }));
  }

  public requestGeofootprintExportData(analysisLevel: string) : Observable<Dictionary<DynamicVariable>> {
    return this.store$.select(geoTransactionId).pipe(
      withLatestFrom(this.store$.select(allAudiences), this.store$.select(getFetchableAudiencesInFootprint)),
      switchMap(([txId, audiences, gfpAudiences]) => this.fetchService.getCachedAudienceData(gfpAudiences, audiences, analysisLevel, txId, false)),
      concatMap((fetchedVars) => this.store$.select(allCustomVarEntities).pipe(
        take(1),
        map(customEntity => mergeVariablesToEntity(customEntity, fetchedVars))
        )
      )
    );
  }

  public requestNationalExtractData(project: ImpProject) : void {
    const notificationTitle = 'National Extract Export';
    const audiences = this.nationalAudiences$.getValue();
    if (isEmpty(audiences)) {
      this.store$.dispatch(new ErrorNotification({
        notificationTitle,
        message: 'A variable must be selected for a national extract before exporting.'
      }));
    } else if (isEmpty(project.methAnalysis)) {
      this.store$.dispatch(new ErrorNotification({
        notificationTitle,
        message: 'An Analysis Level must be selected for a national extract before exporting.'
      }));
    } else if (isNil(project.projectId)) {
      this.store$.dispatch(new ErrorNotification({
        notificationTitle,
        message: 'The project must be saved before exporting a national extract.'
      }));
    } else {
      const analysisLevel = project.methAnalysis;
      const projectId = project.projectId;
      const convertedData: any[] = [];
      const reqInput = [];
      const key = 'NATIONAL_EXTRACT';
      this.store$.dispatch(new StartBusyIndicator({key, message: 'Downloading National Data'}));
      if (analysisLevel === 'PCR') {
        audiences.forEach(audience => {
          const numericId = Number(audience.audienceIdentifier);
          const duplicateCategories = reqInput.filter(inputMap => inputMap['source'] == audience.audienceSourceName);
          if (duplicateCategories.length > 0) {
            duplicateCategories[0]['digCategoryIds'].push(numericId);
          } else {
            reqInput.push({
              geoType: analysisLevel,
              source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
              geocodes: ['*'],
              digCategoryIds: [numericId],
              varType: ['ALL']
            });
          }
        });
        const headers = new HttpHeaders({
          'Accept': 'blob'
        });

        const uri = `${this.config.valServiceBase}v1/targeting/base/geoinfo/digitallookuppcr`;
        this.http.post(uri, reqInput,
          { responseType: 'blob',
            headers: headers
          }).subscribe((data: any) => {
            const filename = `${projectId}_PCR_NationalData.csv`;
            //FileService.downloadFile(filename, data);
            FileService.downLoadCsvFile(filename, data);
            this.store$.dispatch(new StopBusyIndicator({ key }));
        });
      } else {
        this.getNationalData(audiences, analysisLevel).subscribe(
          data => convertedData.push(...data),
          err => {
            this.logger.error.log('There was an error processing the National Extract', err);
            this.store$.dispatch(new StopBusyIndicator({key}));
          },
          () => {
            try {
              const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
              const fileName = `NatlExtract_${analysisLevel}_${projectId}_${fmtDate}.xlsx`.replace(/\//g, '_');
              const workbook = XLSX.utils.book_new();
              const worksheet = XLSX.utils.json_to_sheet(convertedData);
              const sheetName = projectId.toString();
              XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
              XLSX.writeFile(workbook, fileName);
              const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName.replace('~', ':') + '~' + audiences[0].audienceSourceName + '~' + analysisLevel;
              this.store$.dispatch(new CreateAudienceUsageMetric('online', 'export', metricText, convertedData.length));
            } finally {
              this.store$.dispatch(new StopBusyIndicator({key}));
            }
          }
        );
      }
    }
  }

  private getNationalData(audiences: Audience[] , analysisLevel: string) : Observable<any[]> {
    const sourceNameGen = (a: Audience) => a.audienceSourceName.replace(/-/g, '_');
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
            result[newKey] = isConvertibleToNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
          } else if (natAudiences.has(key.toLowerCase())) {
            const audience = natAudiences.get(key.toLowerCase());
            const newKey = `${audience.audienceName} (${sourceNameGen(audience)} - National)`;
            result[newKey] = isConvertibleToNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
          } else {
            result[key] = Math.round(Number(d.attrs[key]));
          }
        }
        return result;
      }))
    );
  }

  private nationalRefreshDownload(audiences: Audience[], analysisLevel: string) : Observable<OnlineBulkDownloadDataResponse[]>[] {
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
      observables.push( this.restService.post<{ rows: OnlineBulkDownloadDataResponse[] }>('v1/targeting/base/geoinfo/digitallookup', reqInput).pipe(
       map(response => response.payload.rows)
     ));
    }
    return observables;
  }
}
