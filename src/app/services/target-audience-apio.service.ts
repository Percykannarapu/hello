import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { map, tap } from 'rxjs/operators';
import { EMPTY, merge, Observable, forkJoin, throwError } from 'rxjs/index';
import { chunkArray } from '../app.utils';

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
  private rawAudienceData: Map<string, ApioCategoryResponse> = new Map<string, ApioCategoryResponse>();

  constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService) { }

  private static createGeofootprintVar(geocode: string, varPk: number, value: string, rawData: ApioCategoryResponse, source: string) : ImpGeofootprintVar {
    const fullId = `Online/${source}/${varPk}`;
    const result = new ImpGeofootprintVar({ geocode, varPk, customVarExprQuery: fullId, isString: 0, isNumber: 0, isActive: 1 });
    if (Number.isNaN(Number(value))) {
      result.valueString = value;
      result.isString = 1;
    } else {
      result.valueNumber = Number(value);
      result.isNumber = 1;
    }
    if (rawData != null) {
      result.customVarExprDisplay = `${rawData.categoryName} (${source})`;
    }
    return result;
  }

  private static createDataDefinition(source: 'Interest' | 'In Market', name: string, pk: number) : AudienceDataDefinition {
    return {
      audienceName: name,
      audienceIdentifier: `${pk}`,
      audienceSourceType: 'Online',
      audienceSourceName: source,
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false
    };
  }

  public addAudience(audience: ApioAudienceDescription, source: 'Interest' | 'In Market') {
    const model = TargetAudienceApioService.createDataDefinition(source, audience.categoryName, audience.categoryId);
    if (source === 'Interest') {
      this.audienceService.addAudience(model, (al, pks, geos) => this.interestRefreshCallback(al, pks, geos));
    } else {
      this.audienceService.addAudience(model, (al, pks, geos) => this.inMarketRefreshCallback(al, pks, geos));
    }
  }

  public removeAudience(audience: ApioAudienceDescription, source: 'Interest' | 'In Market') {
    this.audienceService.removeAudience('Online', source, audience.categoryId.toString());
  }

  public getAudienceDescriptions() : Observable<ApioAudienceDescription[]> {
    const interest$ = this.restService.get('v1/targeting/base/impdigcategory/search?q=impdigcategory&source=interest').pipe(
      map(response => response.payload.rows as ApioCategoryResponse[]),
      map(categories => categories.filter(c => c.isActive === 1))
    );
    const inMarket$ = this.restService.get('v1/targeting/base/impdigcategory/search?q=impdigcategory&source=in_market').pipe(
      map(response => response.payload.rows as ApioCategoryResponse[]),
      map(categories => categories.filter(c => c.isActive === 1)),
    );

    return forkJoin(interest$, inMarket$).pipe(
      map(([interest, inMarket]) => interest.concat(inMarket)),
      tap(data => data.forEach(d => this.rawAudienceData.set(d.categoryId.toString(), d))),
      map(categories => this.buildObjectTree(categories)),
    );
  }

  private buildObjectTree(categories: ApioCategoryResponse[]) : ApioAudienceDescription[] {
    const root = new ApioAudienceDescription();
    for (const category of categories) {
      const pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
      root.createSubTree(pathItems, category);
    }
    return root.children;
  }

  private interestRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    if (numericIds.filter(n => Number.isNaN(n)).length > 0)
      return throwError({ identifiers, msg: `Some identifiers were passed into the Apio Interest Refresh function that weren't numeric pks` });
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<ApioBulkDataResponse[]>[] = [];
    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: 'interest',
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
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => TargetAudienceApioService.createGeofootprintVar(b.geocode, Number(b.categoryId), b.nationalScore, this.rawAudienceData.get(b.categoryId), 'Interest')))
    );
  }

  private inMarketRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    if (numericIds.filter(n => Number.isNaN(n)).length > 0)
      return throwError({ identifiers, msg: `Some identifiers were passed into the Apio Interest Refresh function that weren't numeric pks` });
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<ApioBulkDataResponse[]>[] = [];
    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: 'in_market',
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
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => TargetAudienceApioService.createGeofootprintVar(b.geocode, Number(b.categoryId), b.nationalScore, this.rawAudienceData.get(b.categoryId), 'In Market')))
    );
  }
}
