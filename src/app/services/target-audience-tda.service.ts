import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { map, mergeAll, mergeMap, tap } from 'rxjs/operators';
import { Observable, EMPTY, throwError, merge } from 'rxjs';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { UsageService } from './usage.service';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';

interface TdaCategoryResponse {
  '@ref': number;
  'pk': number;
  'tablename': string;
  'tabledesc': string;
  'sort': number;
  'accessType': string;
}

function isCategory(r: any) : r is TdaCategoryResponse {
  return r.hasOwnProperty('tablename') && r.hasOwnProperty('tabledesc') && r.hasOwnProperty('sort');
}

interface TdaVariableResponse {
  '@ref': number;
  'tablename': string;
  'fieldnum': string;
  'fieldname': string;
  'fielddescr': string;
  'fieldtype': string;
  'fieldconte': string;
  'decimals': string;
  'source': string;
  'userAccess': string;
  'varFormat': string;
  'natlAvg': string;
  'avgType': string;
  'pk': string;
  'includeInCb': string;
  'includeInDatadist': string;
}

interface TdaBulkDataResponse {
  variablePk: string;
  geocode: string;
  score: string;
}

export class TdaAudienceDescription {
  identifier: string;
  displayName: string;
  additionalSearchField: string;
  sortOrder: number;
  children: TdaAudienceDescription[];
  constructor(response: TdaCategoryResponse | TdaVariableResponse) {
    if (isCategory(response)) {
      this.displayName = response.tabledesc;
      this.identifier = response.tablename;
      this.sortOrder = response.sort;
      this.children = [];
    } else {
      this.displayName = response.fielddescr;
      this.identifier = response.pk;
      this.additionalSearchField = response.fieldname;
      this.sortOrder = 0;
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceTdaService {

  private rawAudienceData: Map<string, TdaVariableResponse> = new Map<string, TdaVariableResponse>();

  constructor(private config: AppConfig, private restService: RestDataService, private usageService: UsageService,
              private audienceService: TargetAudienceService, private stateService: AppStateService,
              private tradeAreaService: ImpGeofootprintTradeAreaService) { }

  /**
   * Build a cache of geos that can be used for quick
   * lookup while building geofootprint vars
   */
  private buildGeoCache() : Map<number, Map<string, ImpGeofootprintGeo>> {
    let count = 0;
    const geoCache = new Map<number, Map<string, ImpGeofootprintGeo>>();
    for (const ta of this.tradeAreaService.get()) {
      const geoMap = new Map<string, ImpGeofootprintGeo>();
      for(const geo of ta.impGeofootprintGeos) {
        geoMap.set(geo.geocode, geo);
        geoCache.set(count, geoMap);
      }
      count++;
    }
    return geoCache;
  }

  private createGeofootprintVar(geocode: string, varPk: number, value: string, rawData: TdaVariableResponse, geoCache: Map<number, Map<string, ImpGeofootprintGeo>>) : ImpGeofootprintVar {
    const fullId = `Offline/TDA/${varPk}`;
    const result = new ImpGeofootprintVar({ geocode, varPk, customVarExprQuery: fullId, isString: false, isNumber: false, isActive: true });
    if (Number.isNaN(Number(value))) {
      result.valueString = value;
      result.fieldconte = 'INDEX';
      result.isString = true;
    } else {
      result.valueNumber = Number(value);
      result.fieldconte = 'INDEX';
      result.isNumber = true;
    }
    if (rawData != null) {
      result.customVarExprDisplay = rawData.fielddescr;
      result.fieldname = rawData.fieldname;
      result.natlAvg = rawData.natlAvg;
      result.fieldconte = rawData.fieldconte;
    }
    result.isCustom = false;
    for(const ta of Array.from(geoCache.keys())) {
      const geoMap: Map<string, ImpGeofootprintGeo> = geoCache.get(ta);
      if(geoMap.has(geocode)) {
        result.impGeofootprintTradeArea = geoMap.get(geocode).impGeofootprintTradeArea;
        geoMap.get(geocode).impGeofootprintTradeArea.impGeofootprintVars.push(result);
      }
    }
    return result;
  }

  private static createDataDefinition(name: string, pk: string) : AudienceDataDefinition {
    return {
      audienceName: name,
      audienceIdentifier: pk,
      audienceSourceType: 'Offline',
      audienceSourceName: 'TDA',
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false,
      exportNationally: false,
      allowNationalExport: false
    };
  }

  public addAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier);
      this.audienceService.addAudience(model, (al, pks, geos) => this.audienceRefreshCallback(al, pks, geos));
      this.usageMetricCheckUncheckOffline('checked', model);
    }
  }

  public removeAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      this.audienceService.removeAudience('Offline', 'TDA', audience.identifier);
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier);
      this.usageMetricCheckUncheckOffline('unchecked', model);
    }
  }

  public getAudienceDescriptions() : Observable<TdaAudienceDescription> {
    return this.restService.get('v1/targeting/base/amtabledesc/search?q=amtabledesc').pipe(
      map(result => result.payload.rows as TdaCategoryResponse[]),
      map(data => data.map(d => new TdaAudienceDescription(d))),
      mergeMap(audience => audience.map(a => this.getAudienceVariables(a)), 4),
      mergeAll()
    );
  }

  private getAudienceVariables(currentParent: TdaAudienceDescription) : Observable<TdaAudienceDescription> {
    return this.restService.get(`v1/targeting/base/cldesctab/search?q=cldesctab&tablename=${currentParent.identifier}`).pipe(
      map(result => result.payload.rows as TdaVariableResponse[]),
      tap(data => data.forEach(d => this.rawAudienceData.set(d.pk, d))),
      map(data => data.map(d => new TdaAudienceDescription(d))),
      map(variables => {
        currentParent.children.push(...variables);
        return currentParent;
      })
    );
  }

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[]) : Observable<ImpGeofootprintVar[]> {
    if (analysisLevel == null || analysisLevel.length === 0 || identifiers == null || identifiers.length === 0 || geocodes == null || geocodes.length === 0)
      return EMPTY;
    const numericIds = identifiers.map(i => Number(i));
    if (numericIds.filter(n => Number.isNaN(n)).length > 0)
      return throwError({ identifiers, msg: `Some identifiers were passed into the Tda Refresh function that weren't numeric pks` });
    const chunks = chunkArray(geocodes, this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<TdaBulkDataResponse[]>[] = [];
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        geocodes: chunk,
        variablePks: numericIds
      };
      if (inputData.geocodes.length > 0 && inputData.variablePks.length > 0) {
        observables.push(
          this.restService.post('v1/mediaexpress/base/geoinfo/bulklookup', inputData).pipe(
            map(response => response.payload as TdaBulkDataResponse[])
          )
        );
      }
    }
    const geoCache = this.buildGeoCache()
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => this.createGeofootprintVar(b.geocode, Number(b.variablePk), b.score, this.rawAudienceData.get(b.variablePk), geoCache)))
    );
  }

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'offline', action: checkType });
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }
}
