import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { catchError, filter, map, shareReplay } from 'rxjs/operators';
import { EMPTY, forkJoin, merge, Observable, throwError } from 'rxjs';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { AppLoggingService } from './app-logging.service';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { WarningNotification } from '../messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { chunkArray, groupBy, simpleFlatten } from '@val/common';

interface OnlineCategoryResponse {
  categoryId: string;
  digCategoryId: string;
  source: string;
  categoryName: string;
  categoryDescr: string;
  taxonomy: string;
  isActive: 0 | 1;
}

interface OnlineBulkDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
}

export enum SourceTypes {
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
  private fuseSourceMapping: Map<SourceTypes, string>;
  private audienceSourceMap = new Map<SourceTypes, Observable<OnlineCategoryResponse[]>>();
  private audienceCache$ = new Map<string, Observable<OnlineAudienceDescription[]>>();
  private audDescription = {};

  constructor(private config: AppConfig,
    private restService: RestDataService,
    private audienceService: TargetAudienceService,
    private domainFactory: ImpDomainFactoryService,
    private appStateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {
    this.fuseSourceMapping = new Map<SourceTypes, string>([
      [SourceTypes.Interest, 'interest'],
      [SourceTypes.InMarket, 'in_market'],
      [SourceTypes.VLH, 'vlh'],
      [SourceTypes.Pixel, 'pixel']
    ]);

    this.appStateService.applicationIsReady$.subscribe(ready => {
      this.onLoadProject(ready);
    });
  }

  private static createDataDefinition(source: SourceTypes, name: string, pk: number, digId: number) : AudienceDataDefinition {
   TargetAudienceService.audienceCounter++;
   const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: `${digId}`,
      audienceSourceType: 'Online',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false,
      allowNationalExport: true,
      exportNationally: false,
      selectedDataSet: 'nationalScore',
      dataSetOptions: [{ label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' }],
      secondaryId: digId.toLocaleString(),
      audienceCounter: TargetAudienceService.audienceCounter
    };
    return audience;
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return; // loading will be false when the load is actually done
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
            audienceCounter: projectVar.sortOrder,
            secondaryId: projectVar.varPk.toString()
          };
          if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
          if (projectVar.source.toLowerCase().match('interest')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.Interest, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.Interest, al, pk), null);
          } else if (projectVar.source.toLowerCase().match('in-market')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.InMarket, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.InMarket, al, pk), null);
          } else if (projectVar.source.toLowerCase().match('vlh')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.VLH, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.VLH, al, pk), null);
          } else {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.Pixel, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.Pixel, al, pk), null);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  private createGeofootprintVar(response: OnlineBulkDataResponse, source: SourceTypes, descriptionMap: Map<string, AudienceDataDefinition>, geoCache: Map<string, ImpGeofootprintGeo[]>, isForShading: boolean) : ImpGeofootprintVar[] {
    const description = descriptionMap.get(response.digCategoryId);
    if (description == null) throw new Error(`A Fuse category was not found for the category id ${response.digCategoryId}`);

    const fullId = `Online/${source}/${response.digCategoryId}`;
    const results: ImpGeofootprintVar[] = [];
    const numberAttempt = Number(response[description.selectedDataSet]);
    const fieldDescription: string = `${description.audienceName} (${source})`;
    const matchingAudience = this.audienceService.getAudiences()
      .find(a => description.audienceSourceType === a.audienceSourceType && description.audienceSourceName === a.audienceSourceName && description.audienceName === a.audienceName);
    const varPk = Number(response.digCategoryId);
    let fieldType: FieldContentTypeCodes;
    let fieldValue: string | number;
    if (Number.isNaN(numberAttempt)) {
      fieldValue = response[description.selectedDataSet];
      fieldType = FieldContentTypeCodes.Char;
    } else {
      fieldValue = numberAttempt;
      fieldType = FieldContentTypeCodes.Index;
    }
    if (isForShading) {
      const currentResult = this.domainFactory.createGeoVar(null, response.geocode, varPk, fieldValue, fullId, fieldDescription, fieldType);
      if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
      results.push(currentResult);
    } else {
      if (geoCache.has(response.geocode)) {
        geoCache.get(response.geocode).forEach(geo => {
          const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, response.geocode, varPk, fieldValue, fullId, fieldDescription, fieldType);
          if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
          results.push(currentResult);
        });
      }
    }
    return results;
  }

  public addAudience(audience: OnlineAudienceDescription, source: SourceTypes) {
    this.usageMetricCheckUncheckApio('checked', audience, source);
    const model = TargetAudienceOnlineService.createDataDefinition(source, audience.categoryName, audience.categoryId, audience.digLookup.get(this.fuseSourceMapping.get(source)));
    console.log('Adding Audience', model);
    this.audienceService.addAudience(
      model,
      (al, pks, geos, shading) => this.apioRefreshCallback(source, al, pks, geos, shading),
      (al, pk) => this.nationalRefreshCallback(source, al, pk)
    );
  }

  public removeAudience(audience: OnlineAudienceDescription, source: SourceTypes) {
    this.usageMetricCheckUncheckApio('unchecked', audience, source);
    this.audienceService.removeAudience('Online', source, audience.digLookup.get(this.fuseSourceMapping.get(source)).toString());
  }

  public getAudienceDescriptions(sources: SourceTypes[]) : Observable<OnlineAudienceDescription[]> {
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

  private apioRefreshCallback(source: SourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean) : Observable<ImpGeofootprintVar[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const numericIds = identifiers.map(i => Number(i));
    if (numericIds.filter(n => Number.isNaN(n)).length > 0)
      return throwError({ identifiers, msg: `Some identifiers were passed into the Apio ${source} Refresh function that weren't numeric pks` });
    const fullIds = identifiers.map(id => `Online/${source}/${id}`);
    const observables = this.apioDataRefresh(source, analysisLevel, identifiers, geocodes, isForShading);
    const descriptionMap = new Map(this.audienceService.getAudiences(fullIds).map<[string, AudienceDataDefinition]>(a => [a.audienceIdentifier, a]));
    console.log('Description Maps', descriptionMap);
    descriptionMap.forEach(id => this.audDescription[id.audienceIdentifier] = id.audienceName);
    const currentProject = this.appStateService.currentProject$.getValue();
    const geoCache = groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
    return merge(...observables, 4).pipe(
      filter(data => data != null),
      map(bulkData => simpleFlatten(bulkData.map(b => this.createGeofootprintVar(b, source, descriptionMap, geoCache, isForShading))))
    );
  }

  private nationalRefreshCallback(source: SourceTypes, analysisLevel: string, identifier: string) : Observable<any[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifier == null || identifier.length === 0)
      return EMPTY;
    const numericId = Number(identifier);
    if (Number.isNaN(numericId))
      return throwError({ identifier, msg: `An identifier was passed into the Apio National Extract Refresh function that wasn't a numeric pk` });
    const observables = this.apioDataRefresh(source, analysisLevel, [identifier], ['*'], false);
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

  private apioDataRefresh(source: SourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean) : Observable<OnlineBulkDataResponse[]>[] {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<OnlineBulkDataResponse[]>[] = [];
    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: this.fuseSourceMapping.get(source),
        geocodes: chunk,
        digCategoryIds: numericIds
      };
      if (inputData.geocodes.length > 0 && inputData.digCategoryIds.length > 0) {
        
        observables.push(
            this.restService.post('v1/targeting/base/geoinfo/digitallookup', inputData).pipe(
              map(response => this.validateFuseResponse(inputData, response, isForShading)),
              catchError( () => throwError('No Data was returned for the selected audiences'))
          ));
        }
    }
    return observables;
  }

  private validateFuseResponse(inputData: any, response: RestResponse, isForShading: boolean) {
    const responseArray: OnlineBulkDataResponse[] = response.payload.rows;
    // if (responseArray.length > 0){
    const audData = new Set(responseArray.map(val => val.digCategoryId));
    const missingCategoryIds = new Set(inputData.digCategoryIds.filter(id => !audData.has(id.toString())));
    if (missingCategoryIds.size > 0) {
      this.logger.info('Category Ids missing data::', missingCategoryIds);
      const audience = [];
      missingCategoryIds.forEach(id => {
        audience.push(this.audDescription[id.toString()]);
      });
      if (!isForShading){
         this.store$.dispatch(new WarningNotification({ message: 'No data was returned within your geofootprint for the following selected online audiences: ' + audience.join(' , \n'), notificationTitle: 'Selected Audience Warning'}));
      }
    }
  // }
    this.logger.info('Online Audience Response:::', responseArray);
    return responseArray;
  }

  private usageMetricCheckUncheckApio(checkType: string, audience: OnlineAudienceDescription, source: SourceTypes) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    let metricText = null;
    if (source === SourceTypes.Pixel)
      metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.categoryName + '~' + source + '~' + currentAnalysisLevel;
    else
      metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.taxonomyParsedName.replace('~', ':') + '~' + source + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('online', checkType, metricText));
  }
}
