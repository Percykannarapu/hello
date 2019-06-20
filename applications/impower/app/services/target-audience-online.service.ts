/* tslint:disable:max-line-length */
import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { catchError, filter, map, shareReplay, tap } from 'rxjs/operators';
import { EMPTY, forkJoin, merge, Observable, throwError } from 'rxjs';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppLoggingService } from './app-logging.service';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { simpleFlatten, mapBy } from '@val/common';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

interface OnlineCategoryResponse {
  categoryId: string;
  digCategoryId: string;
  source: string;
  categoryName: string;
  categoryDescr: string;
  taxonomy: string;
  isActive: 0 | 1;
}

export interface OnlineBulkDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
}

export enum OnlineSourceTypes {
  InMarket = 'In-Market',
  Interest = 'Interest',
  VLH = 'VLH',
  Pixel = 'Pixel'
}

export class OnlineAudienceDescription {
  private childMap: Map<string, OnlineAudienceDescription> = new Map<string, OnlineAudienceDescription>();
  isLeaf: boolean;
  categoryId: number;
  digLookup: Map<string, number> = new Map<string, number>();
  categoryName: string;
  taxonomyParsedName: string;
  categoryDescription: string;
  taxonomy: string;
  fieldconte: FieldContentTypeCodes;
  get children() : OnlineAudienceDescription[] {
    return Array.from(this.childMap.values());
  }

  constructor(categories?: OnlineCategoryResponse[]) {
    if (categories != null) {
      for (const category of categories) {
        let pathItems: string[] = [];
        if (category.categoryName.includes('/') && category.taxonomy.endsWith(category.categoryName)) {
          const currentTaxonomy = category.taxonomy.replace(category.categoryName, '');
          pathItems = currentTaxonomy.split('/').filter(s => s != null && s.length > 0);
          pathItems.push(category.categoryName);
        } else {
          pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
        }
        this.createSubTree(pathItems, category);
      }
    }
  }

  createSubTree(treeItems: string[], response: OnlineCategoryResponse) {
    const currentCategory = treeItems.shift();
    const child = new OnlineAudienceDescription();
    child.taxonomyParsedName = currentCategory;
    if (treeItems.length === 0) {
      // we're at the bottom of the taxonomy chain
      if (this.childMap.has(response.categoryId)) {
        // this category has already been added once - just need to append the source
        const localCategory = this.childMap.get(response.categoryId);
        localCategory.digLookup.set(response.source, Number(response.digCategoryId));
      } else {
        child.isLeaf = true;
        child.categoryId = Number(response.categoryId);
        child.digLookup.set(response.source, Number(response.digCategoryId));
        child.categoryDescription = response.categoryDescr;
        child.categoryName = response.categoryName;
        child.taxonomy = response.taxonomy;
        this.childMap.set(response.categoryId, child);
      }
    } else {
      // we're still at a folder level of the taxonomy
      if (!this.childMap.has(currentCategory)) {
        // if the folder doesn't exist, create it as a child
        child.isLeaf = false;
        this.childMap.set(currentCategory, child);
      }
      this.childMap.get(currentCategory).createSubTree(treeItems, response);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceOnlineService {
  public  fuseSourceMapping: Map<OnlineSourceTypes, string>;
  private audienceSourceMap = new Map<OnlineSourceTypes, Observable<OnlineCategoryResponse[]>>();
  private audienceCache$ = new Map<string, Observable<OnlineAudienceDescription[]>>();
  private audDescription = {};
  private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);

  constructor(private config: AppConfig,
    private restService: RestDataService,
    private audienceService: TargetAudienceService,
    private domainFactory: ImpDomainFactoryService,
    private appStateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {
    this.fuseSourceMapping = new Map<OnlineSourceTypes, string>([
      [OnlineSourceTypes.Interest, 'interest'],
      [OnlineSourceTypes.InMarket, 'in_market'],
      [OnlineSourceTypes.VLH, 'vlh'],
      [OnlineSourceTypes.Pixel, 'pixel']
    ]);

    this.appStateService.applicationIsReady$.subscribe(ready => {
      this.onLoadProject(ready);
    });

    this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(this.allAudiencesBS$);
  }

  private static createDataDefinition(source: OnlineSourceTypes, name: string, pk: number, digId: number) : AudienceDataDefinition {
   const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: `${digId}`,
      audienceSourceType: 'Online',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: false,
      showOnMap: false,
      allowNationalExport: true,
      exportNationally: false,
      selectedDataSet: 'nationalScore',
      dataSetOptions: [{ label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' }],
      secondaryId: digId.toLocaleString(),
      fieldconte: FieldContentTypeCodes.Index,
      requiresGeoPreCaching: true,
      seq: null
    };
    return audience;
  }

  public rehydrateAudience() {
    try {
      const project = this.appStateService.currentProject$.getValue();
      let projectVars = project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online');
      projectVars = projectVars.filter(v => !v.source.split('_')[1].toLowerCase().includes('audience'));
      if (projectVars.length > 0) {
        for (const projectVar of projectVars) {
          const audience: AudienceDataDefinition = {
            allowNationalExport: true,
            exportNationally: projectVar.isNationalExtract,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceName: projectVar.fieldname,
            audienceSourceName: projectVar.source.replace(/^Online_/, ''),
            audienceSourceType: 'Online',
            dataSetOptions: [{ label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' }],
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            selectedDataSet: projectVar.indexBase,
            secondaryId: projectVar.varPk.toString(),
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: true,
            seq: projectVar.sortOrder
          };

          // console.log('### target-audience-online - onLoadProject - adding audience:', audience);
          if (projectVar.source.toLowerCase().match('interest')) {
            this.audienceService.addAudience(audience, (al, pk) => this.nationalRefreshCallback(OnlineSourceTypes.Interest, al, pk, -1), true);
          } else if (projectVar.source.toLowerCase().match('in-market')) {
            this.audienceService.addAudience(audience, (al, pk) => this.nationalRefreshCallback(OnlineSourceTypes.InMarket, al, pk, -1), true);
          } else if (projectVar.source.toLowerCase().match('vlh')) {
            this.audienceService.addAudience(audience, (al, pk) => this.nationalRefreshCallback(OnlineSourceTypes.VLH, al, pk, -1), true);
          } else {
            this.audienceService.addAudience(audience, (al, pk) => this.nationalRefreshCallback(OnlineSourceTypes.Pixel, al, pk, -1), true);
          }
        }
      }
    }
    catch (error) {
      console.error(error);
    }
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return; // loading will be false when the load is actually done
    this.rehydrateAudience();
  }

  public createGeofootprintVar(response: OnlineBulkDataResponse, source: OnlineSourceTypes, descriptionMap: Map<string, AudienceDataDefinition>, geoCache: Map<string, ImpGeofootprintGeo[]>, isForShading: boolean) : ImpGeofootprintVar[] {
    const description = descriptionMap.get(response.digCategoryId);
    if (description == null) throw new Error(`A Fuse category was not found for the category id ${response.digCategoryId}`);
    const fullId = `Online/${source}/${response.digCategoryId}`;
    const results: ImpGeofootprintVar[] = [];
    const value = response[description.selectedDataSet];
    const numberAttempt = value == null ? null : Number(value);
    const fieldDescription: string = `${description.audienceName} (${source})`;
    const varPk = Number(response.digCategoryId);
    let fieldValue: string | number;
    if (Number.isNaN(numberAttempt)) {
      fieldValue = value;
    } else {
      fieldValue = numberAttempt;
    }
    if (isForShading) {
      const currentResult = this.domainFactory.createGeoVar(null, response.geocode, varPk, fieldValue, fullId, fieldDescription);
      results.push(currentResult);
    } else {
      if (geoCache.has(response.geocode)) {
        geoCache.get(response.geocode).forEach(geo => {
          const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, response.geocode, varPk, fieldValue, fullId, fieldDescription);
          results.push(currentResult);
        });
      }
    }
    return results;
  }

  public addAudience(audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
    this.usageMetricCheckUncheckApio('checked', audience, source);
    const model = TargetAudienceOnlineService.createDataDefinition(source, audience.categoryName, audience.categoryId, audience.digLookup.get(this.fuseSourceMapping.get(source)));
console.log('### target-audience-online - adding audience:', model);
    this.audienceService.addAudience(
      model,
//      (al, pks, geos, shading, transactionId) => this.OLDapioRefreshCallback(source, al, pks, geos, shading, transactionId),
//    null, //(al, pks, geos, shading, transactionId) => this.apioRefreshCallback(source, al, pks, geos, shading, transactionId),
      (al, pk, transactionId) => this.nationalRefreshCallback(source, al, pk, transactionId)
    );
  }

  public removeAudience(audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
    this.usageMetricCheckUncheckApio('unchecked', audience, source);
    this.audienceService.removeAudience('Online', source, audience.digLookup.get(this.fuseSourceMapping.get(source)).toString());
  }

  public getAudienceDescriptions(sources: OnlineSourceTypes[]) : Observable<OnlineAudienceDescription[]> {
    if (sources == null || sources.length === 0) return EMPTY;
    const resultKey = sources.join('-');
    if (!this.audienceCache$.has(resultKey)) {
      const individualRequests: Observable<OnlineCategoryResponse[]>[] = [];
      sources.forEach(source => {
        if (!this.audienceSourceMap.has(source)) {
          const fuseKey = this.fuseSourceMapping.get(source);
          const currentRequest = this.restService.get(`v1/targeting/base/impdigcategory/search?q=impdigcategory&source=${fuseKey}`).pipe(
            map(response => response.payload.rows as OnlineCategoryResponse[]),
            map(categories => categories.filter(c => c.isActive === 1)),
            shareReplay()
          );
          individualRequests.push(currentRequest);
        } else {
          individualRequests.push(this.audienceSourceMap.get(source));
        }
      });
      let result$: Observable<OnlineCategoryResponse[]>;
      if (individualRequests.length > 1) {
        result$ = forkJoin(individualRequests).pipe(
          map(requests => simpleFlatten(requests)),
        );
      } else {
        result$ = individualRequests[0];
      }
      this.audienceCache$.set(resultKey, result$.pipe(
        map(categories => (new OnlineAudienceDescription(categories)).children),
        shareReplay()
      ));
    }

    return this.audienceCache$.get(resultKey);
  }

  //TODO Use ID instead of audienceName
  private nationalRefreshCallback(source: OnlineSourceTypes, analysisLevel: string, identifier: string, transactionId: number) : Observable<any[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifier == null || identifier.length === 0)
      return EMPTY;
    const numericId = Number(identifier);
    if (Number.isNaN(numericId))
      return throwError({ identifier, msg: `An identifier was passed into the Apio National Extract Refresh function that wasn't a numeric pk` });
    const observables = this.apioDataRefresh(source, analysisLevel, [identifier], ['*'], false, transactionId);
    const fullId = `Online/${source}/${identifier}`;
    const description = this.audienceService.getAudiences(fullId)[0];
    if (description == null)
      return throwError({ fullId, msg: `A fullId was passed into the Apio National Extract Refresh function that couldn't be found in the description list` });

    return merge(...observables, 4).pipe(
      map(data => data.map(d => {
        const result = { Geocode: d.geocode };
        result[`${description.audienceName}_${source}_DMA`] = Math.round(Number(d.dmaScore));
        result[`${description.audienceName}_${source}_National`] = Math.round(Number(d.nationalScore));
        return result;
      }))
    );
  }

  public apioDataRefresh(source: OnlineSourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, transactionId: number) : Observable<OnlineBulkDataResponse[]>[] {
console.log('### apiDataRefresh - Fired');
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const observables: Observable<OnlineBulkDataResponse[]>[] = [];
    const currentProject = this.appStateService.currentProject$.getValue();

    const varTypes: string[] = [];
    identifiers.forEach(id => {
      const pv = currentProject.impProjectVars.filter(v => v.varPk.toString() === id);
      if (varTypes != null)
         varTypes.push((pv[0].indexBase.toUpperCase() == 'NATIONALSCORE') ? 'NATIONAL' : 'DMA');
    });

      const inputData = {
        geoType: serviceAnalysisLevel,
        source: this.fuseSourceMapping.get(source),
        // geocodes: chunk,
        digCategoryIds: numericIds,
        varType: varTypes,
        transactionId: transactionId,
        chunks: this.config.geoInfoQueryChunks
      };
      if (inputData.digCategoryIds.length > 0) {
        this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now());
        observables.push(
          this.restService.post('v1/targeting/base/geoinfo/digitallookup', [inputData]).pipe(
              tap(response => this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now() - this.audienceService.timingMap.get('(' + inputData.source.toLowerCase() + ')'))),
              map(response => this.validateFuseResponseOld(inputData, response, isForShading)),
              catchError( () => {
                console.error('Error posting to v1/targeting/base/geoinfo/digitallookup with payload:');
                console.error('payload:', inputData);
                console.error('payload:\n{\n' +
                              '   geoType: ', inputData.geoType, '\n',
                              '   source:  ', inputData.source, '\n',
                              '   geocodes: ', geocodes.toString(), '\n',
                              '   digCategoryIds:', inputData.digCategoryIds.toString(), '\n}'
                             );
                return throwError('No Data was returned for the selected audiences'); })
          ));
        }
    // console.debug("### apioDataRefresh pushing ", observables.length, "observables for ", geocodes.length, "geocodes in ", chunks.length, "chunks, ids:", identifiers);
    return observables;
  }

  // NOTE: This is going to be the new digital var refresh method
  public onlineVarRefresh(source: OnlineSourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number) : Observable<OnlineBulkDataResponse[]> {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const observables: Observable<OnlineBulkDataResponse[]> = null;
    const currentProject = this.appStateService.currentProject$.getValue();

    console.log('### onlineVarRefresh:', source, 'ids:', numericIds, 'geocodes:', geocodes, 'transactionId:', transactionId);
    const varTypes: string[] = [];
    identifiers.forEach(id => {
      const pv = currentProject.impProjectVars.filter(v => v.varPk.toString() === id);
      if (varTypes != null)
        varTypes.push(pv[0].indexBase != null ? (pv[0].indexBase.toUpperCase() == 'NATIONALSCORE' ? 'NAT' : 'DMA') : 'ALL');
    });

    const inputData = {
      geoType: serviceAnalysisLevel.toUpperCase(),
      source: this.fuseSourceMapping.get(source),
      geocodes: geocodes,
      digCategoryIds: numericIds,
      varType: varTypes,
      transactionId: transactionId,
      chunks: this.config.geoInfoQueryChunks
    };

    // Simulate error
    // if (inputData.source === 'vlh')
    //   return throwError('No Data was returned for the selected audiences');

    if (inputData.digCategoryIds.length > 0) {
      this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now());
      return this.restService.post('v1/targeting/base/geoinfo/digitallookup', [inputData])
        .pipe(
          //tap(response => console.log('###', inputData.source, 'response:', response)),
          tap(response => this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now() - this.audienceService.timingMap.get('(' + inputData.source.toLowerCase() + ')'))),
          map(response => this.validateFuseResponse(inputData, response, isForShading)),
          tap(response => (response)),
          catchError( (err) => {
            console.error('Error posting to v1/targeting/base/geoinfo/digitallookup');
            console.error('payload:', inputData);
            console.error('payload:\n{\n' +
                          '   geoType: ', inputData.geoType, '\n',
                          '   source:  ', inputData.source, '\n',
                          '   geocodes: ', geocodes.toString(), '\n',
                          '   digCategoryIds:', inputData.digCategoryIds.toString(), '\n}'
                          );
            console.error(err);
            return throwError('No Data was returned for the selected audiences'); })
          );
    }
    console.warn('onlineVarRefresh had no ids to process.');
    return EMPTY;
  }

  private validateFuseResponse(inputData: any, response: RestResponse, isForShading: boolean[]) {
    const newArray = this.audienceService.convertFuseResponse(response);
    const audiences: Audience[] = this.allAudiencesBS$.value;

    audiences.filter(row => row.audienceIdentifier);
    const audMap = mapBy(audiences, 'audienceIdentifier');
    const responseArray = [];
    const emptyAudiences: string[] = [];

    inputData.digCategoryIds.forEach(id => {
      const audience = audMap.get(id.toString());
      const sourceName = audience.audienceSourceName != null && audience.audienceSourceName.toLowerCase() === 'in-market' ? 'in_market' : audience.audienceSourceName;
   // const dmaKey = `${audience.audienceName}_${sourceName.toLowerCase()}_DMA`;
   // const nationalKey = `${audience.audienceName}_${sourceName.toLowerCase()}_NATIONAL`;
      const dmaKey = `${id}_${sourceName.toLowerCase()}_DMA`;
      const nationalKey = `${id}_${sourceName.toLowerCase()}_NAT`;
      newArray.forEach(row => {
        responseArray.push({
            geocode : row.geocode,
            dmaScore : row.attrs[dmaKey],
            nationalScore: row.attrs[nationalKey],
            digCategoryId: id.toString()
          });
      });
    });

    // DEBUG: Simulate no variables being returned
    // response.payload.counts['31934'] = 0;
    // response.payload.counts['31068'] = 0;

    // Look for variables that did not have data
    const identifiers = inputData.digCategoryIds;
    for (let i = 0; i < identifiers.length; i++)
      if (isForShading[i] === false && response.payload.counts.hasOwnProperty(identifiers[i]) && response.payload.counts[identifiers[i]] === 0)
        emptyAudiences.push(audMap.has(identifiers[i].toString()) ? audMap.get(identifiers[i].toString()).audienceName : identifiers[i].toString());

    if (emptyAudiences.length > 0)
      this.store$.dispatch(new WarningNotification({ message: 'No data was returned within your geofootprint for the following selected online audiences: \n' + emptyAudiences.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));

    return responseArray;
  }

  private validateFuseResponseOld(inputData: any, response: RestResponse, isForShading: boolean) {
    const newArray = this.audienceService.convertFuseResponse(response);
    const audiences = Array.from(this.audienceService.audienceMap.values());
    audiences.filter(roe => roe.audienceIdentifier);
    const audMap = mapBy(audiences, 'audienceIdentifier');
    const responseArray = [];

    inputData.digCategoryIds.forEach(id => {
      const audience = audMap.get(id.toString());
      const sourceName = audience.audienceSourceName != null && audience.audienceSourceName.toLowerCase() === 'in-market' ? 'in_market' : audience.audienceSourceName;
      // const dmaKey = `${audience.audienceName}_${sourceName.toLowerCase()}_DMA`;
      // const nationalKey = `${audience.audienceName}_${sourceName.toLowerCase()}_NATIONAL`;
      const dmaKey = `${id}_${sourceName.toLowerCase()}_DMA`;
      const nationalKey = `${id}_${sourceName.toLowerCase()}_NAT`;
      newArray.forEach(row => {
        responseArray.push({
            geocode : row.geocode,
            dmaScore : row.attrs[dmaKey],
            nationalScore: row.attrs[nationalKey],
            digCategoryId: id.toString()
          });
      });
    });

    const audData = new Set(responseArray.map(val => val.digCategoryId));

    const emptyAudiences = new Set(Object.entries(response.payload.counts)
      .filter((entry) => (entry[1] === 0 || entry[1] == null) && audData.has(entry[0]))
      .map(e => e[0]));

    const missingCategoryIds = new Set(inputData.digCategoryIds.filter(id => !audData.has(id.toString()) || emptyAudiences.has(id.toString()) ));
    if (missingCategoryIds.size > 0) {
      this.logger.info.log('Category Ids missing data::', missingCategoryIds);
      const audience = [];
      missingCategoryIds.forEach(id => {
        audience.push(this.audDescription[id.toString()]);
      });
      if (!isForShading){
         this.store$.dispatch(new WarningNotification({ message: 'No data was returned within your geofootprint for the following selected online audiences: \n' + audience.join(' , \n'), notificationTitle: 'Selected Audience Warning'}));
      }
    }
    //console.debug('Online Audience Response:::', chunk, "/", maxChunks, 'Chunks', responseArray.length, "rows"); // , responseArray); // See response
    return responseArray;
  }

  private usageMetricCheckUncheckApio(checkType: string, audience: OnlineAudienceDescription, source: OnlineSourceTypes) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    let metricText = null;
    if (source === OnlineSourceTypes.Pixel)
      metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.categoryName + '~' + source + '~' + currentAnalysisLevel;
    else
      metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.taxonomyParsedName.replace('~', ':') + '~' + source + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('online', checkType, metricText));
  }
}
