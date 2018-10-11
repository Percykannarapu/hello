import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { map, mergeAll, mergeMap, tap } from 'rxjs/operators';
import { EMPTY, merge, Observable, throwError } from 'rxjs';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { UsageService } from './usage.service';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { groupBy, simpleFlatten } from '../val-modules/common/common.utils';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';

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

  constructor(private config: AppConfig,
              private restService: RestDataService,
              private usageService: UsageService,
              private audienceService: TargetAudienceService,
              private domainFactory: ImpDomainFactoryService,
              private stateService: AppStateService) {
    this.stateService.applicationIsReady$.subscribe(ready => {
      this.onLoadProject(ready);
    });
  }

  private static createDataDefinition(name: string, pk: string) : AudienceDataDefinition {
    const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: pk,
      audienceSourceType: 'Offline',
      audienceSourceName: 'TDA',
      exportInGeoFootprint: true,
      showOnGrid: true,
      showOnMap: false,
      exportNationally: false,
      allowNationalExport: false,
      audienceCounter: TargetAudienceService.audienceCounter
    };
    TargetAudienceService.audienceCounter++;
    return audience;
  }

  private onLoadProject(loading: boolean) {
    if (!loading) return; // loading will be false when the load is actually done
    try {
      const project = this.stateService.currentProject$.getValue();
      if (project && project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'offline')) {
        for (const projectVar of project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'offline')) {
          const audience: AudienceDataDefinition = {
            audienceName: projectVar.fieldname,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceSourceType: 'Offline',
            audienceSourceName: 'TDA',
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            exportNationally: false,
            allowNationalExport: false,
            audienceCounter: projectVar.sortOrder
          };
          if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
          if (projectVar.source.toLowerCase().match('tda')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.audienceRefreshCallback(al, pks, geos, shading), null, null);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  private createGeofootprintVar(geocode: string, varPk: number, value: string, rawData: TdaVariableResponse, geoCache: Map<string, ImpGeofootprintGeo[]>, isForShading: boolean) : ImpGeofootprintVar[] {
    const fullId = `Offline/TDA/${varPk}`;
    const results: ImpGeofootprintVar[] = [];
    const numberAttempt = Number(value);
    let fieldType: FieldContentTypeCodes;
    let fieldName: string;
    let fieldDescription: string;
    let natlAvg: string;
    let fieldValue: string | number;
    if (rawData != null) {
      fieldDescription = rawData.fielddescr;
      fieldName = rawData.fieldname;
      natlAvg = rawData.natlAvg;
      fieldType = FieldContentTypeCodes.parse(rawData.fieldconte);
    }
    const matchingAudience = this.audienceService.getAudiences().find(a => a.audienceName === fieldDescription && a.audienceSourceName === 'TDA');
    if (Number.isNaN(numberAttempt)) {
      fieldValue = value;
      if (fieldType == null) fieldType = FieldContentTypeCodes.Char;
    } else {
      fieldValue = numberAttempt;
      if (fieldType == null) fieldType = FieldContentTypeCodes.Index;
    }
    if (isForShading) {
      const currentResult = this.domainFactory.createGeoVar(null, geocode, varPk, fieldValue, fullId, fieldDescription, fieldType, fieldName, natlAvg);
      if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
      results.push(currentResult);
    } else {
      if (geoCache.has(geocode)) {
        geoCache.get(geocode).forEach(geo => {
          const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, varPk, fieldValue, fullId, fieldDescription, fieldType, fieldName, natlAvg);
          if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
          results.push(currentResult);
        });
      }
    }
    return results;
  }

  public addAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier);
      this.audienceService.addAudience(model, (al, pks, geos, shading) => this.audienceRefreshCallback(al, pks, geos, shading));
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

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean) : Observable<ImpGeofootprintVar[]> {
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
    const currentProject = this.stateService.currentProject$.getValue();
    const geoCache = groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
    return merge(...observables, 4).pipe(
      map(bulkData => simpleFlatten(bulkData.map(b => this.createGeofootprintVar(b.geocode, Number(b.variablePk), b.score, this.rawAudienceData.get(b.variablePk), geoCache, isForShading))))
    );
  }

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'offline', action: checkType });
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }
}
