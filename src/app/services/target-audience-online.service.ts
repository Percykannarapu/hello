import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { map, shareReplay } from 'rxjs/operators';
import { EMPTY, merge, Observable, forkJoin, throwError } from 'rxjs';
import { chunkArray } from '../app.utils';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { UsageService } from './usage.service';
import { AppStateService } from './app-state.service';
import { simpleFlatten } from '../val-modules/common/common.utils';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectVarService } from '../val-modules/targeting/services/ImpProjectVar.service';

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

  constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService,
              private usageService: UsageService, private appStateService: AppStateService, private varService: ImpGeofootprintVarService,
              private tradeAreaService: ImpGeofootprintTradeAreaService, private projectVarService: ImpProjectVarService) {
    this.fuseSourceMapping = new Map<SourceTypes, string>([
      [SourceTypes.Interest, 'interest'],
      [SourceTypes.InMarket, 'in_market'],
      [SourceTypes.VLH, 'vlh'],
      [SourceTypes.Pixel, 'pixel']
    ]);

    this.appStateService.projectIsLoading$.subscribe(isLoading => {
      this.onLoadProject(isLoading);
    });
  }

  private static createDataDefinition(source: SourceTypes, name: string, pk: number, digId: number) : AudienceDataDefinition {
    return {
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
      dataSetOptions: [ { label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' } ],
      secondaryId: digId.toLocaleString()
    };
  }

  private onLoadProject(loading: boolean) {
    if (loading) return; // loading will be false when the load is actually done
    try {
      const project = this.appStateService.currentProject$.getValue();
      if (project && project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online').length > 0) {
        this.projectVarService.clearAll();
        this.projectVarService.add(project.impProjectVars);
        for (const projectVar of project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'online')) {
          console.log('AARON: ', projectVar.source.split('_')[0].toLowerCase());
          let sourceType = projectVar.source.split('~')[0].split('_')[0];
          const sourceNamePieces = projectVar.source.split('~')[0].split('_');
          delete sourceNamePieces[0];
          const sourceName = sourceNamePieces.join();
          const audienceIdentifier = projectVar.source.split('~')[1];
          if (sourceType.toLowerCase().match('online')) sourceType = 'Online';
          if (sourceType.toLowerCase().match('offline')) sourceType = 'Offline';
          if (sourceType.toLowerCase().match('custom')) sourceType = 'Custom';
          const audience: AudienceDataDefinition = {
            allowNationalExport: true,
            exportNationally: projectVar.isNationalExtract,
            audienceIdentifier: audienceIdentifier,
            audienceName: projectVar.fieldname,
            audienceSourceName: sourceName.replace(new RegExp('^,'), ''),
            audienceSourceType: 'Online',
            dataSetOptions: [ { label: 'National', value: 'nationalScore' }, { label: 'DMA', value: 'dmaScore' } ],
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            selectedDataSet: 'nationalScore',
          };
          if (projectVar.source.toLowerCase().match('interest')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.Interest, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.Interest, al, pk), null);
          } else if (projectVar.source.toLowerCase().match('in-market')){
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.apioRefreshCallback(SourceTypes.InMarket, al, pks, geos, shading), (al, pk) => this.nationalRefreshCallback(SourceTypes.InMarket, al, pk), null);
          } else if (projectVar.source.toLowerCase().match('vlh')){
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

  /**
   * Build a cache of geos that can be used for quick
   * lookup while building geofootprint vars
   */
  private buildGeoCache() : Map<number, Map<string, ImpGeofootprintGeo>> {
    let count = 0;
    const geoCache = new Map<number, Map<string, ImpGeofootprintGeo>>();
    for (const ta of this.tradeAreaService.get()) {
      const geoMap = new Map<string, ImpGeofootprintGeo>();
      for (const geo of ta.impGeofootprintGeos) {
        geoMap.set(geo.geocode, geo);
        geoCache.set(count, geoMap);
      }
      count++;
    }
    return geoCache;
  }

  private createGeofootprintVar(response: OnlineBulkDataResponse, source: SourceTypes, descriptionMap: Map<string, AudienceDataDefinition>, geoCache: Map<number, Map<string, ImpGeofootprintGeo>>, isForShading: boolean) : ImpGeofootprintVar {
    const fullId = `Online/${source}/${response.digCategoryId}`;
    const description = descriptionMap.get(response.digCategoryId);
    const result = new ImpGeofootprintVar({
      geocode: response.geocode,
      varPk: Number(response.digCategoryId),
      customVarExprQuery: fullId,
      isString: false,
      isNumber: false,
      isActive: true,
      isCustom: false
    });
    if (!isForShading) {
      for (const ta of Array.from(geoCache.keys())) {
        const geoMap: Map<string, ImpGeofootprintGeo> = geoCache.get(ta);
        if (geoMap.has(response.geocode)) {
          result.impGeofootprintTradeArea = geoMap.get(response.geocode).impGeofootprintTradeArea;
          geoMap.get(response.geocode).impGeofootprintTradeArea.impGeofootprintVars.push(result);
        }
      }
    }
    // this is the full category description object that comes from Fuse
    if (description != null) {
      result.customVarExprDisplay = `${description.audienceName} (${source})`;
      if (Number.isNaN(Number(response[description.selectedDataSet]))) {
        result.valueString = response[description.selectedDataSet];
        result.fieldconte = 'CHAR';
        result.isString = true;
      } else {
        result.valueNumber = Number(response[description.selectedDataSet]);
        result.indexValue = result.valueNumber;
        result.fieldconte = 'INDEX';
        result.isNumber = true;
      }
    }
    return result;
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
        result$ = forkJoin(...individualRequests).pipe(
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
    const observables = this.apioDataRefresh(source, analysisLevel, identifiers, geocodes);
    const fullIds = identifiers.map(id => `Online/${source}/${id}`);
    const descriptionMap = new Map(this.audienceService.getAudiences(fullIds).map<[string, AudienceDataDefinition]>(a => [a.audienceIdentifier, a]));
    console.log('Description Maps', descriptionMap);
    const geoCache = this.buildGeoCache();
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => this.createGeofootprintVar(b, source, descriptionMap, geoCache, isForShading)))
    );
  }

  private nationalRefreshCallback(source: SourceTypes, analysisLevel: string, identifier: string) : Observable<any[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifier == null || identifier.length === 0)
      return EMPTY;
    const numericId = Number(identifier);
    if (Number.isNaN(numericId))
      return throwError({ identifier, msg: `An identifier was passed into the Apio National Extract Refresh function that wasn't a numeric pk` });
    const observables = this.apioDataRefresh(source, analysisLevel, [identifier], ['*']);
    const fullId = `Online/${source}/${identifier}`;
    const description = this.audienceService.getAudiences(fullId)[0];
    if (description == null)
      return throwError({ fullId, msg: `A fullId was passed into the Apio National Extract Refresh function that couldn't be found in the description list` });

    return merge(...observables, 4).pipe(
      map(data => data.map(d => {
        const result = { Geocode: d.geocode };
        result[`${description.audienceName}_DMA`] = Math.round(Number(d.dmaScore));
        result[`${description.audienceName}_National`] = Math.round(Number(d.nationalScore));
        return result;
      }))
    );
  }

  private apioDataRefresh(source: SourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[])  : Observable<OnlineBulkDataResponse[]>[] {
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
            map(response => response.payload.rows as OnlineBulkDataResponse[])
          )
        );
      }
    }
    return observables;
  }

  private usageMetricCheckUncheckApio(checkType: string, audience: OnlineAudienceDescription, source: SourceTypes) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: checkType });
    let metricText = null;
    if (source === SourceTypes.Pixel)
        metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.categoryName + '~' + source + '~' + currentAnalysisLevel;
    else
        metricText = audience.digLookup.get(this.fuseSourceMapping.get(source)) + '~' + audience.taxonomyParsedName + '~' + source + '~' + currentAnalysisLevel;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }
}
