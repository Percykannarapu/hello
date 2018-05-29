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

interface ApioCategoryResponse {
  categoryId: string;
  digitalInternalId: string;
  digCategoryId: string;
  source: string;
  categoryName: string;
  categoryDescription: string;
  taxonomy: string;
  isActive: 0 | 1;
}

interface ApioBulkDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  categoryId: string;
}

export enum SourceTypes {
  InMarket = 'In-Market',
  Interest = 'Interest'
}

export class ApioAudienceDescription {
  private childMap: Map<string, ApioAudienceDescription> = new Map<string, ApioAudienceDescription>();
  isLeaf: boolean;
  categoryId: number;
  digCategoryId: number;
  digitalInternalId: number;
  source: string;
  categoryName: string;
  categoryDescription: string;
  taxonomy: string;
  get children() : ApioAudienceDescription[] {
    return Array.from(this.childMap.values());
  }

  constructor(categories?: ApioCategoryResponse[]) {
    if (categories != null) {
      for (const category of categories) {
        const pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
        this.createSubTree(pathItems, category);
      }
    }
  }

  createSubTree(treeItems: string[], response: ApioCategoryResponse) {
    const currentCategory = treeItems.shift();
    const child = new ApioAudienceDescription();
    child.categoryName = currentCategory;
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
        child.digitalInternalId = Number(response.digitalInternalId);
        child.source = response.source;
        child.categoryDescription = response.categoryDescription;
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
export class TargetAudienceApioService {
  private fuseSourceMapping: Map<SourceTypes, string> = new Map<SourceTypes, string>();
  private audienceDescriptions$: Observable<ApioAudienceDescription[]>;

  constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService,
              private usageService: UsageService) {
    this.fuseSourceMapping.set(SourceTypes.Interest, 'interest');
    this.fuseSourceMapping.set(SourceTypes.InMarket, 'in_market');
  }

  private static createDataDefinition(source: SourceTypes, name: string, pk: number, digId: number) : AudienceDataDefinition {
    return {
      audienceName: name,
      audienceIdentifier: `${pk}`,
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

  private static createGeofootprintVar(response: ApioBulkDataResponse, source: SourceTypes, descriptionMap: Map<string, AudienceDataDefinition>) : ImpGeofootprintVar {
    const fullId = `Online/${source}/${response.categoryId}`;
    const result = new ImpGeofootprintVar({
      geocode: response.geocode,
      varPk: Number(response.categoryId),
      customVarExprQuery: fullId,
      isString: 0,
      isNumber: 0,
      isActive: 1
    });
    const description = descriptionMap.get(response.categoryId);
    if (description != null) {
      result.customVarExprDisplay = `${description.audienceName} (${source})`;
      if (Number.isNaN(Number(response[description.selectedDataSet]))) {
        result.valueString = response[description.selectedDataSet];
        result.isString = 1;
      } else {
        result.valueNumber = Number(response[description.selectedDataSet]);
        result.isNumber = 1;
      }
    }
    return result;
  }

  public addAudience(audience: ApioAudienceDescription, source: SourceTypes) {
    this.usageMetricCheckUncheckApio('checked', audience);
    const model = TargetAudienceApioService.createDataDefinition(source, audience.categoryName, audience.categoryId, audience.digCategoryId);
    this.audienceService.addAudience(
      model,
      (al, pks, geos) => this.apioRefreshCallback(source, al, pks, geos),
      (al, pk) => this.nationalRefreshCallback(source, al, pk)
      );
  }

  public removeAudience(audience: ApioAudienceDescription, source: SourceTypes) {
    this.usageMetricCheckUncheckApio('unchecked', audience);
    this.audienceService.removeAudience('Online', source, audience.categoryId.toString());
  }

  public getAudienceDescriptions() : Observable<ApioAudienceDescription[]> {
    if (this.audienceDescriptions$ == null) {
      const interest$ = this.restService.get('v1/targeting/base/impdigcategory/search?q=impdigcategory&source=interest').pipe(
        map(response => response.payload.rows as ApioCategoryResponse[]),
        map(categories => categories.filter(c => c.isActive === 1))
      );
      const inMarket$ = this.restService.get('v1/targeting/base/impdigcategory/search?q=impdigcategory&source=in_market').pipe(
        map(response => response.payload.rows as ApioCategoryResponse[]),
        map(categories => categories.filter(c => c.isActive === 1))
      );
      this.audienceDescriptions$ = forkJoin(interest$, inMarket$).pipe(
        map(([interest, inMarket]) => interest.concat(inMarket)),
        map(categories => (new ApioAudienceDescription(categories)).children),
        shareReplay()
      );
    }
    return this.audienceDescriptions$;
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
      map(bulkData => bulkData.map(b => TargetAudienceApioService.createGeofootprintVar(b, source, descriptionMap)))
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

  private apioDataRefresh(source: SourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[])  : Observable<ApioBulkDataResponse[]>[] {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<ApioBulkDataResponse[]>[] = [];
    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: this.fuseSourceMapping.get(source),
        geocodes: chunk,
        categoryIds: numericIds
      };
      if (inputData.geocodes.length > 0 && inputData.categoryIds.length > 0) {
        observables.push(
          this.restService.post('v1/targeting/base/geoinfo/digitallookup', inputData).pipe(
            map(response => response.payload.rows as ApioBulkDataResponse[])
          )
        );
      }
    }
    return observables;
  }

  private usageMetricCheckUncheckApio(checkType: string, audience: ApioAudienceDescription){
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: checkType });
      const metricText = audience.categoryId + '~' + audience.categoryName + '~' + audience.source;
      this.usageService.createCounterMetric(usageMetricName, metricText, null);

  }
}
