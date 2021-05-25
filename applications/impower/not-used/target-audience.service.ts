/* tslint:disable:max-line-length */
import { Injectable, OnDestroy } from '@angular/core';
// import { Store } from '@ngrx/store';
// import { accumulateArrays, dedupeSimpleSet, formatMilli, groupByExtended, isConvertibleToNumber, mapByExtended } from '@val/common';
// import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
// import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
// import { ClearAudiences, DeleteAudience, UpsertAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
// import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
// import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
// import { ClearMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.actions';
// import { EnvironmentData } from 'environments/environment';
// import { BehaviorSubject, concat, merge, Observable, Subscription } from 'rxjs';
// import { debounceTime, filter, map, mergeMap, pairwise, reduce, startWith, tap } from 'rxjs/operators';
// import * as XLSX from 'xlsx';
// import { AppConfig } from '../app.config';
// import { ClearGeoVars } from '../impower-datastore/state/transient/geo-vars/geo-vars.actions';
// import { AudienceDataDefinition } from '../models/audience-data.model';
// import { RestResponse } from '../models/RestResponse';
// import { LocalAppState } from '../state/app.interfaces';
// import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
// import { LoggingService } from '../val-modules/common/services/logging.service';
// import { RestDataService } from '../val-modules/common/services/restdata.service';
// import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
// import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
// import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
// import { AppStateService } from './app-state.service';

// export type audienceSource = (analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, transactionId: number, audience?: AudienceDataDefinition) => Observable<ImpGeofootprintVar[]>;
// export type nationalSource = (analysisLevel: string, identifier: string, transactionId: number) => Observable<any[]>;
//
// interface OnlineBulkDownloadDataResponse {
//   geocode: string;
//   dmaScore: string;
//   nationalScore: string;
//   digCategoryId: string;
//   attrs: Map<string, string>;
// }

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceService {
  // public readonly spinnerKey: string = 'TargetAudienceServiceKey';
  //
  // public newSelectedGeos$: Observable<string[]>;
  //
  // private nationalSources = new Map<string, nationalSource>();
  // private audienceSources = new Map<string, audienceSource>();
  // public  audienceMap: Map<string, AudienceDataDefinition> = new Map<string, AudienceDataDefinition>();
  // private audiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  // private deletedAudiences: BehaviorSubject<AudienceDataDefinition[]> = new BehaviorSubject<AudienceDataDefinition[]>([]);
  // private selectedSub: Subscription;
  //
  // public  allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  // private natExportAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  //
  // constructor(private appStateService: AppStateService,
  //             private varService: ImpGeofootprintVarService,
  //             private restService: RestDataService,
  //             private config: AppConfig,
  //             private domainFactory: ImpDomainFactoryService,
  //             private logger: LoggingService,
  //             private store$: Store<LocalAppState>) {
  //
  //   this.newSelectedGeos$ = this.appStateService.uniqueIdentifiedGeocodes$.pipe(
  //     map(geos => new Set(geos)),
  //     startWith(new Set<string>()),
  //     pairwise(),
  //     map(([previous, current]) => dedupeSimpleSet(current, previous)),
  //     filter(result => result.size > 0),
  //     map(geoSet => Array.from(geoSet))
  //   );
  //
  //   // Subscribe to store selectors
  //   this.store$.select(fromAudienceSelectors.allAudiences).subscribe(this.allAudiencesBS$);
  //   this.store$.select(fromAudienceSelectors.getAudiencesInExtract).subscribe(this.natExportAudiencesBS$);
  // }
  //
  // public createKey = (...values: string[]) => values.join('/');
  //
  // public ngOnDestroy() : void {
  //   this.unsubEverything();
  // }
  //
  // public clearAll() : void {
  //   this.audienceMap.clear();
  //   this.audienceSources.clear();
  //   this.nationalSources.clear();
  //   this.store$.dispatch( new ClearMapVars());
  //   this.store$.dispatch( new ClearGeoVars());
  //   this.store$.dispatch( new ClearAudiences());
  //   this.audiences.next([]);
  // }
  //
  // public addAudience(audience: AudienceDataDefinition, nationalRefresh?: nationalSource, isReload: boolean = false) : void {
  //   if (audience == null) {
  //     this.logger.error.log('Attempt to add a null audience');
  //     return;
  //   }
  //
  //   const sourceId = this.createKey(audience.audienceSourceType, audience.audienceSourceName);
  //   const audienceId = this.createKey(sourceId, audience.audienceIdentifier);
  //
  //   this.logger.debug.log('addAudience - seq:', audience.sortOrder, ', sourceId:', sourceId, ', audienceName:', audience.audienceName, ', audienceSourceName: ', audience.audienceSourceName);
  //
  //   if (audience.audienceSourceName === 'Audience-TA')
  //     this.audienceMap.set(`/${sourceId}-${audience.secondaryId}`, audience);
  //   else
  //     this.audienceMap.set(audienceId, audience);
  //
  //   if (audience.audienceSourceType === 'Custom' && audience.fieldconte === null)
  //     audience.fieldconte = FieldContentTypeCodes.Char;
  //
  //   // Check to see if this is an update to protect the sequence
  //   const existingAudience = (this.allAudiencesBS$.getValue() != null) ? this.allAudiencesBS$.getValue().find(aud => aud.audienceIdentifier === audience.audienceIdentifier) : null;
  //
  //   // If necessary assign a new seq value (audience sort order)
  //   if (audience.sortOrder == null) {
  //     if (existingAudience != null && existingAudience.sortOrder != null) {
  //       audience.sortOrder = existingAudience.sortOrder;
  //     }
  //     else {
  //       audience.sortOrder = this.allAudiencesBS$.value.length;
  //     }
  //   }
  //   else
  //     if (!isReload && (audience.sortOrder < this.allAudiencesBS$.value.length))
  //       audience.sortOrder = this.allAudiencesBS$.value.length;
  //
  //   this.store$.dispatch(new UpsertAudience({ audience: audience }));
  // }
  //
  // public removeAudience(sourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite', sourceName: string, audienceIdentifier: string) : void {
  //   this.store$.dispatch(new DeleteAudience ({ id: audienceIdentifier }));
  //
  //   const sourceId = this.createKey(sourceType, sourceName);
  //   const audienceId = this.createKey(sourceId, audienceIdentifier);
  //   if (this.audienceMap.has(audienceId)) {
  //     this.audienceMap.delete(audienceId);
  //     const remainingAudiences = Array.from(this.audienceMap.values());
  //     if (this.audienceSources.has(sourceId) && remainingAudiences.filter(a => a.audienceSourceType === sourceType && a.audienceSourceName === sourceName).length === 0) {
  //       this.audienceSources.delete(sourceId);
  //     }
  //     this.audiences.next(Array.from(this.audienceMap.values()));
  //   }
  // }
  //
  // public addDeletedAudience(sourceType: 'Online' | 'Offline' | 'Custom' | 'Combined' | 'Converted' | 'Combined/Converted' | 'Composite', sourceName: string, audienceIdentifier: string) : void {
  //   const sourceId = this.createKey(sourceType, sourceName);
  //   const audienceId = this.createKey(sourceId, audienceIdentifier);
  //   if (this.audienceMap.has(audienceId)) {
  //     this.deletedAudiences.next([this.audienceMap.get(audienceId)]);
  //   }
  // }
  //
  // public exportNationalExtract(analysisLevel: string, projectId: number) : void {
  //   const key = 'NATIONAL_EXTRACT';
  //   const reqInput = [];
  //   const audiences = this.natExportAudiencesBS$.value;
  //   if (audiences.length > 0 && analysisLevel != null && analysisLevel.length > 0 && projectId != null) {
  //     const convertedData: any[] = [];
  //     this.store$.dispatch(new StartBusyIndicator({ key, message: 'Downloading National Data' }));
  //     if (analysisLevel === 'PCR'){
  //       let originalFileName = '';
  //       audiences.forEach(audience => {
  //         let inputData;
  //         const numericId = Number(audience.audienceIdentifier);
  //         const duplicateCategorys = reqInput.length > 0 ? reqInput.filter( inputMap => inputMap['source'] == audience.audienceSourceName) : [];
  //         if (duplicateCategorys.length > 0){
  //           duplicateCategorys[0]['digCategoryIds'].push(numericId);
  //         } else {
  //            inputData = {
  //             geoType: analysisLevel,
  //             source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
  //             geocodes: ['*'],
  //             digCategoryIds: [numericId],
  //             varType: ['ALL']
  //           };
  //           reqInput.push(inputData);
  //         }
  //       });
  //       this.restService.post('v1/targeting/base/geoinfo/digitallookuppcr', reqInput)
  //         .subscribe({
  //           next: res => {
  //             const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
  //             const fileName = `NatlExtract_${analysisLevel}_${projectId}_${fmtDate}.csv`.replace(/\//g, '_');
  //             const downloadUrl = `${EnvironmentData.impowerBaseUrl}nationalextract/${res.payload}`;
  //             originalFileName = res.payload;
  //             const element = window.document.createElement('a');
  //             document.body.appendChild(element);
  //             element.href = downloadUrl;
  //
  //             element['download'] = fileName;
  //             element.target = '_blank';
  //
  //             element.click();
  //           },
  //           complete: () => {
  //             this.store$.dispatch(new StopBusyIndicator({ key }));
  //             this.restService.get(`v1/targeting/base/geoinfo/deletefile/${originalFileName}`).subscribe(res => {
  //               this.logger.debug.log(res.payload);
  //             });
  //           }
  //         });
  //     } else {
  //       this.getNationalData(audiences, analysisLevel).subscribe(
  //         data => convertedData.push(...data),
  //         err => {
  //           this.logger.error.log('There was an error processing the National Extract', err);
  //           this.store$.dispatch(new StopBusyIndicator({ key }));
  //         },
  //         () => {
  //           try {
  //             const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
  //             const fileName = `NatlExtract_${analysisLevel}_${projectId}_${fmtDate}.xlsx`.replace(/\//g, '_');
  //             const workbook = XLSX.utils.book_new();
  //             const worksheet = XLSX.utils.json_to_sheet(convertedData);
  //             const sheetName = projectId.toString();
  //             //audiences[0].audienceName.replace(/\//g, '_').substr(0, 31); // magic number == maximum number of chars allowed in an Excel tab name
  //             XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  //             XLSX.writeFile(workbook, fileName);
  //             const metricText = audiences[0].audienceIdentifier + '~' + audiences[0].audienceName.replace('~', ':') + '~' + audiences[0].audienceSourceName + '~' + analysisLevel;
  //             this.store$.dispatch(new CreateAudienceUsageMetric('online', 'export', metricText, convertedData.length));
  //           } finally {
  //             this.store$.dispatch(new StopBusyIndicator({ key }));
  //           }
  //         }
  //       );
  //     }
  //   } else {
  //     const notificationTitle = 'National Extract Export';
  //     if (audiences.length === 0) {
  //       this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'A variable must be selected for a national extract before exporting.' }));
  //     } else if (analysisLevel == null || analysisLevel.length === 0) {
  //       this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'An Analysis Level must be selected for a national extract before exporting.' }));
  //     } else {
  //       this.store$.dispatch(new ErrorNotification({ notificationTitle, message: 'The project must be saved before exporting a national extract.' }));
  //     }
  //   }
  // }
  //
  // public getAudiences(identifier?: string | string[]) : AudienceDataDefinition[] {
  //   if (identifier != null) {
  //     let identifiers: string[];
  //     if (!Array.isArray(identifier)) {
  //       identifiers = [identifier];
  //     } else {
  //       identifiers = identifier;
  //     }
  //     const result: AudienceDataDefinition[] = [];
  //     identifiers.forEach(id => result.push(this.audienceMap.get(id)));
  //     return result;
  //   }
  //   return this.audiences.getValue();
  // }
  //
  // public clearVars() {
  //   const project = this.appStateService.currentProject$.getValue();
  //   const tas = (project != null) ? project.getImpGeofootprintTradeAreas() : [];
  //
  //   for (const ta of tas) {
  //     ta.impGeofootprintVars = [];
  //   }
  //   this.varService.clearAll();
  // }
  //
  // public syncProjectVarOrder()
  // {
  //   const project = this.appStateService.currentProject$.getValue();
  //   this.allAudiencesBS$.value.forEach(audience => {
  //     const updatedPv = this.domainFactory.createProjectVar(this.appStateService.currentProject$.getValue(), Number(audience.audienceIdentifier), audience);
  //     const hierPv = project.impProjectVars.find(pv => pv.varPk.toString() === audience.audienceIdentifier);
  //     hierPv.sortOrder = updatedPv.sortOrder;
  //   });
  // }
  //
  // // This is a temporary helper method to ensure the legacy audienceMap is in alignment with the new NgRx store
  // private setAudienceMapFromStore()
  // {
  //   this.audienceMap.clear();
  //   this.allAudiencesBS$.value.forEach(audience => {
  //     const audKey = audience.audienceSourceType + '/' + audience.audienceSourceName + '/' + audience.audienceIdentifier;
  //     this.audienceMap.set(audKey, audience);
  //   });
  // }
  //
  // public applyAudienceSelection() : void {
  //   this.setAudienceMapFromStore();
  //
  //   const audiences = Array.from(this.allAudiencesBS$.value);
  //   const selectedAudiences = audiences.filter(a => a.exportInGeoFootprint || a.showOnGrid);
  //   this.logger.info.log('applyAudienceSelection fired - # Audiences:', audiences.length, ', selectedAudiences.length:', selectedAudiences.length, ', audiences:', audiences);
  //   this.unsubEverything();
  //   this.clearVars();
  //
  //   if (audiences.length > 0) {
  //     this.store$.dispatch(new ApplyAudiences({analysisLevel: this.appStateService.analysisLevel$.getValue()}));
  //   }
  //
  //   if (selectedAudiences.length > 0) {
  //     // set up a watch process
  //     this.selectedSub = this.newSelectedGeos$.pipe(debounceTime(500))
  //       .subscribe(
  //         geos => {
  //           if (geos.length > 0)
  //           {
  //             this.logger.debug.log('applyAudienceSelection observable: analysisLevel:', this.appStateService.analysisLevel$.getValue(), ' - geos.count', geos.length);
  //             this.getGeoData(this.appStateService.analysisLevel$.getValue(), geos, selectedAudiences);
  //           }
  //         }
  //       );
  //   }
  // }
  //
  // public unsubEverything() {
  //   if (this.selectedSub) this.selectedSub.unsubscribe();
  // }
  //
  // private getGeoData(analysisLevel: string, geos: string[], selectedAudiences: AudienceDataDefinition[]) {
  //   const key = this.spinnerKey;
  //   const notificationTitle = 'Audience Error';
  //   const errorMessage = 'There was an error retrieving audience data';
  //   const nonCachedAudiences = selectedAudiences.filter(a => !a.requiresGeoPreCaching);
  //   const preCachedAudiences = selectedAudiences.filter(a => a.requiresGeoPreCaching);
  //   const observables: Observable<ImpGeofootprintVar[]>[] = [];
  //
  //   if (selectedAudiences.length > 0) {
  //     this.store$.dispatch(new StartBusyIndicator({ key, message: 'Retrieving audience data' }));
  //   }
  //
  //   if (nonCachedAudiences.length > 0) {
  //     observables.push(this.getDataForNonCachedGeos(analysisLevel, nonCachedAudiences, geos));
  //   }
  //
  //   if (preCachedAudiences.length > 0) {
  //     const startTransaction: number = performance.now();
  //     observables.push(
  //       this.cacheGeosOnServer(geos, startTransaction).pipe(
  //         mergeMap(txId => concat(this.getDataForCachedGeos(analysisLevel, preCachedAudiences, txId, startTransaction),
  //                                 this.removeServerGeoCache(txId, startTransaction)
  //                                 ))
  //     ));
  //   }
  //
  //   merge(...observables, 4).subscribe(vars => {
  //     if (vars != null && vars.length > 0) {
  //       this.varService.add(vars);
  //     }
  //   }, err => {
  //     this.logger.error.log('There was an error retrieving data from the server. Additional info:', err);
  //     this.store$.dispatch(new StopBusyIndicator({ key }));
  //     this.store$.dispatch(new ErrorNotification({ notificationTitle, message: errorMessage }));
  //   }, () => {
  //     this.store$.dispatch(new StopBusyIndicator({ key }));
  //   });
  // }
  //
  // private cacheGeosOnServer(geocodes: string[], txStartTime: number) : Observable<number> {
  //   const chunks = this.config.geoInfoQueryChunks;
  //   this.logger.info.log('Populating', geocodes.length, 'geo chunks on server');
  //   return this.restService.post('v1/targeting/base/chunkedgeos/populateChunkedGeos', [{chunks, geocodes}]).pipe(
  //     tap(response => this.logger.info.log('populateChunkedGeos took ', formatMilli(performance.now() - txStartTime), ', Response:', response)),
  //     map(response => response.payload.transactionId)
  //   );
  // }
  //
  // private getDataForCachedGeos(analysisLevel: string, selectedAudiences: AudienceDataDefinition[], transactionId: number, txStartTime: number) : Observable<ImpGeofootprintVar[]> {
  //   const observables: Observable<ImpGeofootprintVar[]>[] = [];
  //   const audiencesBySource = groupByExtended(selectedAudiences, a => this.createKey(a.audienceSourceType, a.audienceSourceName));
  //   const isolatedGetStart = performance.now();
  //
  //   audiencesBySource.forEach((audiences, source) => {
  //     const refreshCallback = this.audienceSources.get(source);
  //     if (refreshCallback != null) {
  //       const ids = audiences.map(a => a.audienceIdentifier);
  //       observables.push(
  //         refreshCallback(analysisLevel, ids, [], false, transactionId).pipe(
  //           tap(response => this.logger.info.log(`Retrieve GeoVar data for "${source}" took`, formatMilli(performance.now() - isolatedGetStart), ', Count:', response.length)),
  //         )
  //       );
  //     }
  //   });
  //
  //   return merge(...observables, 4).pipe(
  //     reduce((a, c) => accumulateArrays(a, c), []),
  //     tap(response => this.logger.info.log('Total GeoVar data retrieval took', formatMilli(performance.now() - isolatedGetStart), ', Total:', response.length)),
  //     tap(() => this.logger.info.log('Total Populate & Retrieve time', formatMilli(performance.now() - txStartTime))),
  //   );
  // }
  //
  // private getDataForNonCachedGeos(analysisLevel: string, selectedAudiences: AudienceDataDefinition[], geos: string[]) : Observable<ImpGeofootprintVar[]> {
  //   const observables: Observable<ImpGeofootprintVar[]>[] = [];
  //   const audiencesBySource = groupByExtended(selectedAudiences, a => this.createKey(a.audienceSourceType, a.audienceSourceName));
  //   audiencesBySource.forEach((audiences, source) => {
  //     const refreshCallback = this.audienceSources.get(source);
  //     const ids = audiences.map(a => a.audienceIdentifier);
  //     if (refreshCallback != null) {
  //       observables.push(refreshCallback(analysisLevel, ids, geos, false, null, audiences[0]));
  //     }
  //   });
  //   return merge(...observables, 4).pipe(
  //     reduce((a, c) => accumulateArrays(a, c), [])
  //   );
  // }
  //
  // private removeServerGeoCache(transactionId: number, txStartTime: number) : Observable<any> {
  //   const deleteStartTime = performance.now();
  //   return this.restService.delete('v1/targeting/base/chunkedgeos/deleteChunks/', transactionId).pipe(
  //     tap(response => this.logger.info.log('deleteChunks took ', formatMilli(performance.now() - deleteStartTime), ', Response:', response)),
  //     tap(() => this.logger.info.log('Total Transaction time', formatMilli(performance.now() - txStartTime))),
  //     map(() => null) // just to make sure it doesn't try to stuff this into the varService
  //   );
  // }
  //
  // private getNationalData(audiences: AudienceDataDefinition[] , analysisLevel: string) : Observable<any[]> {
  //   const sourceNameGen = (a: AudienceDataDefinition) => a.audienceSourceName.replace(/-/g, '_');
  //   const dmaAudiences = mapByExtended(audiences, a => `${a.audienceIdentifier}_${sourceNameGen(a)}_DMA`.toLowerCase());
  //   const natAudiences = mapByExtended(audiences, a => `${a.audienceIdentifier}_${sourceNameGen(a)}_NAT`.toLowerCase());
  //   const observables: Observable<any[]>[] = this.nationalRefreshDownload(audiences , analysisLevel);
  //   return merge(...observables, 4).pipe(
  //     map(data => data.map(d => {
  //       const result = { Geocode: d.geocode };
  //       for (const key of Object.keys(d.attrs)) {
  //         if (dmaAudiences.has(key.toLowerCase())) {
  //           const audience = dmaAudiences.get(key.toLowerCase());
  //           const newKey = `${audience.audienceName} (${sourceNameGen(audience)} - DMA)`;
  //           result[newKey] = isConvertibleToNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
  //         } else if (natAudiences.has(key.toLowerCase())) {
  //           const audience = natAudiences.get(key.toLowerCase());
  //           const newKey = `${audience.audienceName} (${sourceNameGen(audience)} - National)`;
  //           result[newKey] = isConvertibleToNumber(d.attrs[key]) ? Math.round(Number(d.attrs[key])) : d.attrs[key];
  //         } else {
  //           result[key] = Math.round(Number(d.attrs[key]));
  //         }
  //       }
  //       return result;
  //     }))
  //   );
  // }
  //
  // public nationalRefreshDownload(audiences: AudienceDataDefinition[], analysisLevel: string) : Observable<any[]>[] {
  //   const reqInput = [];
  //   const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
  //   audiences.forEach(audience => {
  //     let inputData;
  //     const numericId = Number(audience.audienceIdentifier);
  //     const duplicateCategorys = reqInput.length > 0 ? reqInput.filter( inputMap => inputMap['source'] == audience.audienceSourceName) : [];
  //     if (duplicateCategorys.length > 0){
  //       duplicateCategorys[0]['digCategoryIds'].push(numericId);
  //     } else {
  //        inputData = {
  //         geoType: serviceAnalysisLevel,
  //         source: audience.audienceSourceName === 'In-Market' ? 'In_Market' : audience.audienceSourceName,
  //         geocodes: ['*'],
  //         digCategoryIds: [numericId],
  //         varType: ['ALL']
  //       };
  //       reqInput.push(inputData);
  //     }
  //   });
  //   const observables: Observable<OnlineBulkDownloadDataResponse[]>[] = [];
  //   if (reqInput.length > 0) {
  //     observables.push( this.restService.post('v1/targeting/base/geoinfo/digitallookup', reqInput).pipe(
  //      map(response => this.convertFuseResponse(response))
  //    ));
  //   }
  //   return observables;
  // }
  //
  // public convertFuseResponse(response: RestResponse) {
  //   const responseArray: OnlineBulkDownloadDataResponse[] = response.payload.rows;
  //   return responseArray;
  // }
}
