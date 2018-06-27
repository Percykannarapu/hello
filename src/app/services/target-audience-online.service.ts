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
  digCategoryId: number;
  source: string;
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
        const pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
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
        const sources = localCategory.source.split('/');
        sources.push(response.source);
        sources.sort();
        localCategory.source = sources.join('/');
      } else {
        child.isLeaf = true;
        child.categoryId = Number(response.categoryId);
        child.digCategoryId = Number(response.digCategoryId);
        child.source = response.source;
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
              private usageService: UsageService, private appStateService: AppStateService) {
    this.fuseSourceMapping = new Map<SourceTypes, string>([
      [SourceTypes.Interest, 'interest'],
      [SourceTypes.InMarket, 'in_market'],
      [SourceTypes.VLH, 'vlh'],
      [SourceTypes.Pixel, 'pixel']
    ]);
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

  private createGeofootprintVar(response: OnlineBulkDataResponse, source: SourceTypes, descriptionMap: Map<string, AudienceDataDefinition>) : ImpGeofootprintVar {
    const fullId = `Online/${source}/${response.digCategoryId}`;
    const description = descriptionMap.get(response.digCategoryId);
    const newVarPk = Number(description.audienceIdentifier);
    const result = new ImpGeofootprintVar({
      geocode: response.geocode,
      varPk: Number.isNaN(newVarPk) ? -1 : newVarPk,
      customVarExprQuery: fullId,
      isString: false,
      isNumber: false,
      isActive: true
    });
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
    this.usageMetricCheckUncheckApio('checked', audience, source.toString());
    const model = TargetAudienceOnlineService.createDataDefinition(source, audience.categoryName, audience.categoryId, audience.digCategoryId);
    this.audienceService.addAudience(
      model,
      (al, pks, geos) => this.apioRefreshCallback(source, al, pks, geos),
      (al, pk) => this.nationalRefreshCallback(source, al, pk)
      );
  }

  public removeAudience(audience: OnlineAudienceDescription, source: SourceTypes) {
    this.usageMetricCheckUncheckApio('unchecked', audience, source.toString());
    this.audienceService.removeAudience('Online', source, audience.digCategoryId.toString());
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

  private apioRefreshCallback(source: SourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const numericIds = identifiers.map(i => Number(i));
    if (numericIds.filter(n => Number.isNaN(n)).length > 0)
      return throwError({ identifiers, msg: `Some identifiers were passed into the Apio ${source} Refresh function that weren't numeric pks` });
    const observables = this.apioDataRefresh(source, analysisLevel, identifiers, geocodes);
    const fullIds = identifiers.map(id => `Online/${source}/${id}`);
    const descriptionMap = new Map(this.audienceService.getAudiences(fullIds).map<[string, AudienceDataDefinition]>(a => [a.audienceIdentifier, a]));
    console.log('Description Maps', descriptionMap);
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => this.createGeofootprintVar(b, source, descriptionMap)))
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

  private usageMetricCheckUncheckApio(checkType: string, audience: OnlineAudienceDescription, source?: string) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: checkType });
    let metricText = null;
    if (source === 'Pixel')
        metricText = audience.digCategoryId + '~' + audience.categoryName + '~' + source + '~' + currentAnalysisLevel;
    else
        metricText = audience.digCategoryId + '~' + audience.taxonomyParsedName + '~' + source + '~' + currentAnalysisLevel;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }
}
