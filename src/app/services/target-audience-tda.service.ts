import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { map, mergeAll, mergeMap, tap } from 'rxjs/operators';
import { Observable, EMPTY, throwError, merge } from 'rxjs';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { chunkArray } from '../app.utils';
import { AppConfig } from '../app.config';

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

  constructor(private config: AppConfig, private restService: RestDataService, private audienceService: TargetAudienceService) { }

  private static createGeofootprintVar(geocode: string, varPk: number, value: string, rawData: TdaVariableResponse) : ImpGeofootprintVar {
    const fullId = `Offline/TDA/${varPk}`;
    const result = new ImpGeofootprintVar({ geocode, varPk, customVarExprQuery: fullId, isString: 0, isNumber: 0, isActive: 1 });
    if (Number.isNaN(Number(value))) {
      result.valueString = value;
      result.isString = 1;
    } else {
      result.valueNumber = Number(value);
      result.isNumber = 1;
    }
    if (rawData != null) {
      result.customVarExprDisplay = rawData.fielddescr;
      result.fieldname = rawData.fieldname;
      result.natlAvg = rawData.natlAvg;
      result.fieldconte = rawData.fieldconte;
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
    }
  }

  public removeAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      this.audienceService.removeAudience('Offline', 'TDA', audience.identifier);
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
    return merge(...observables, 4).pipe(
      map(bulkData => bulkData.map(b => TargetAudienceTdaService.createGeofootprintVar(b.geocode, Number(b.variablePk), b.score, this.rawAudienceData.get(b.variablePk))))
    );
  }
}
