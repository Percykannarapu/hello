import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { catchError, map, mergeMap, tap, filter } from 'rxjs/operators';
import { merge, Observable, throwError, EMPTY } from 'rxjs';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { TargetAudienceService } from './target-audience.service';
import { AppConfig } from '../app.config';
import { AppStateService } from './app-state.service';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';

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

export interface OfflineFuseResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
  attrs: Map<string, string>;
}

export interface OfflineBulkDataResponse {
  geocode: string;
  id: string;
  score: string;
}

export enum OfflineSourceTypes {
  TDA = 'tda'
}

export class TdaAudienceDescription {
  identifier: string;
  displayName: string;
  fieldconte: FieldContentTypeCodes;
  additionalSearchField: string;
  sortOrder: number;
  children: TdaAudienceDescription[];
  constructor(response: TdaCategoryResponse | TdaVariableResponse) {
    if (isCategory(response)) {
      this.displayName = response.tabledesc;
      this.identifier = response.tablename;
      this.sortOrder = response.sort;
      this.fieldconte = FieldContentTypeCodes.Char;
      this.children = [];
    } else {
      this.displayName = response.fielddescr;
      this.identifier = response.pk;
      this.fieldconte = FieldContentTypeCodes.parse(response.fieldconte);
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
    private audienceService: TargetAudienceService,
    private stateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {
    this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadProject());
  }

  private static createDataDefinition(name: string, pk: string, fieldconte: FieldContentTypeCodes) : AudienceDataDefinition {
   const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: pk,
      audienceSourceType: 'Offline',
      audienceSourceName: 'TDA',
      exportInGeoFootprint: true,
      showOnGrid: false,
      showOnMap: false,
      exportNationally: false,
      allowNationalExport: false,
      fieldconte: fieldconte,
      requiresGeoPreCaching: true,
      seq: null
    };
    return audience;
  }

  public rehydrateAudience() {
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
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: true,
            seq: projectVar.sortOrder
          };

          if (projectVar.source.toLowerCase().match('tda')) {
            this.audienceService.addAudience(audience, null, true);
          }
        }
      }
    }
    catch (error) {
      console.error(error);
    }
  }

  private onLoadProject() {
    this.rehydrateAudience();
  }

  public addAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte);
      this.audienceService.addAudience(model, null);
      this.usageMetricCheckUncheckOffline('checked', model);
    }
  }

  public removeAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      this.audienceService.removeAudience('Offline', 'TDA', audience.identifier);
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte);
      this.usageMetricCheckUncheckOffline('unchecked', model);
    }
  }

  public getAudienceDescriptions() : Observable<TdaAudienceDescription> {
    return this.restService.get('v1/targeting/base/amtabledesc/search?q=amtabledesc').pipe(
      map(result => result.payload.rows as TdaCategoryResponse[]),
      map(data => data.map(d => new TdaAudienceDescription(d))),
      mergeMap(data => this.getAudienceVariables(data))
    );
  }

  private getAudienceVariables(allParents: TdaAudienceDescription[]) : Observable<TdaAudienceDescription> {
    const allObservables: Observable<TdaAudienceDescription>[] = [];
    for (const currentParent of allParents) {
      const currentObservable$ =
        this.restService.get(`v1/targeting/base/cldesctab/search?q=cldesctab&tablename=${currentParent.identifier}`).pipe(
          map(result => result.payload.rows as TdaVariableResponse[]),
          tap(data => data.forEach(d => this.rawAudienceData.set(d.pk, d))),
          map(data => data.map(d => new TdaAudienceDescription(d))),
          map(variables => {
            currentParent.children.push(...variables);
            return currentParent;
          })
        );
      allObservables.push(currentObservable$);
    }
    return merge(...allObservables, 4);
  }

  public offlineVarRefresh(source: OfflineSourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number) : Observable<OfflineBulkDataResponse[]> {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const serviceURL = 'v1/targeting/base/geoinfo/tdalookup';
    const inputData = {
      geoType: serviceAnalysisLevel,
      source: source,
      geocodes: geocodes,
      categoryIds: numericIds,
      transactionId: transactionId,
      chunks: this.config.geoInfoQueryChunks
    };

    // Simulate error
    // if (inputData.source === 'tda')
    //   return throwError('No Data was returned for the selected audiences');

    if (inputData.categoryIds.length > 0) {
      this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now());
      return this.restService.post(serviceURL, [inputData])
        .pipe(
          tap(response => this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now() - this.audienceService.timingMap.get('(' + inputData.source.toLowerCase() + ')'))),
          map(response => this.validateFuseResponse(response, inputData.categoryIds.map(id => id.toString()), isForShading)),
          tap(response => (response)),
          catchError( () => {
            console.error('Error posting to', serviceURL, 'with payload:');
            console.error('payload:', inputData);
            console.error('payload:\n{\n' +
                          '   geoType: ', inputData.geoType, '\n',
                          '   source:  ', inputData.source, '\n',
                          '   geocodes: ', geocodes.toString(), '\n',
                          '   categoryIds:', inputData.categoryIds.toString(), '\n}'
                          );
            return throwError('No data was returned for the selected audiences'); })
          );
    }
    console.warn('offlineVarRefresh had no ids to process.');
    return EMPTY;
  }

  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean[]) {
    const validatedResponse: OfflineBulkDataResponse[] = [];
    const responseArray: OfflineFuseResponse[] = response.payload.rows;
    const emptyAudiences: string[] = [];
    //console.log('### tda validateFuseResponse - response.length:', responseArray.length);

    // Validate and transform the response
    for (let r = 0; r < responseArray.length; r++)
      for (let i = 0; i < identifiers.length; i++)
        if (responseArray[r].attrs.hasOwnProperty(identifiers[i]))
          validatedResponse.push ({ geocode: responseArray[r].geocode, id: identifiers[i], score: responseArray[r].attrs[identifiers[i]] });

    // Look for variables that did not have data
    for (let i = 0; i < identifiers.length; i++)
      if (isForShading[i] === false && response.payload.counts.hasOwnProperty(identifiers[i]) && response.payload.counts[identifiers[i]] === 0)
        emptyAudiences.push((this.rawAudienceData.has(identifiers[i]) ? this.rawAudienceData.get(identifiers[i]).fielddescr : identifiers[i]));

    if (emptyAudiences.length > 0)
      this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + emptyAudiences.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));

    return validatedResponse;
  }

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('offline', checkType, metricText));
  }
}
