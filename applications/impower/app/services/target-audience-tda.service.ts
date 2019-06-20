import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
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
    this.stateService.applicationIsReady$.subscribe(ready => this.onLoadProject(ready));
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

  private onLoadProject(ready: boolean) {
    if (!ready) return; // loading will be false when the load is actually done
    this.rehydrateAudience();
  }
/*
  private createGeofootprintVars(geocode: string, attrs: Map<string, string>, geoCache: Map<string, ImpGeofootprintGeo[]>, isForShading: boolean) : ImpGeofootprintVar[] {
    const results: ImpGeofootprintVar[] = [];
    attrs.forEach((value: string, key: string) => {
      const varPk: number = parseInt(key, 10); // value: string
      const rawData: TdaVariableResponse = this.rawAudienceData.get(key);
      const fullId = `Offline/TDA/${varPk}`;
      const numberAttempt = value == null ? null : Number(value.trim());
      let fieldDescription: string;
      let fieldValue: string | number;
      if (rawData != null) {
        fieldDescription = rawData.fielddescr;
      }
      if (numberAttempt == null) {
        fieldValue = null;
      } else if (Number.isNaN(numberAttempt)) {
        fieldValue = value.trim();
      } else {
        fieldValue = numberAttempt;
      }
      if (isForShading) {
        // TODO: Not efficient - this is creating shading data that already exists as geodata, but it's the fastest way to fix defects 2299 and 2300
        if (results.findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk) === -1) {
          const currentResult = this.domainFactory.createGeoVar(null, geocode, varPk, fieldValue, fullId, fieldDescription);
          results.push(currentResult);
        }
      } else {
        if (geoCache.has(geocode)) {
          geoCache.get(geocode).forEach(geo => {
            if (this.varService.get().findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1
                          && results.findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1) {
              const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, varPk, fieldValue, fullId, fieldDescription);
              results.push(currentResult);
            }
          });
        }
      }
    });
    return results;
  }*/

  public addAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte);
console.log('### target-audience-tda - adding audience:', model);
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

/*
  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, transactionId: number) : Observable<ImpGeofootprintVar[]> {
  console.log('### audienceRefreshCallback Old - fired');
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const observables: Observable<OfflineFuseResponse[]>[] = [];
    let c: number = 0;

//    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: 'tda',
//      geocodes: chunk,
        categoryIds: numericIds,
        transactionId: transactionId,
        chunks: this.config.geoInfoQueryChunks
      };
//      if (inputData.geocodes.length > 0 && inputData.categoryIds.length > 0) {
      if (inputData.categoryIds.length > 0) {
        c++;
        const chunkNum: number = c;
        this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now());
        observables.push(
          this.restService.post('v1/targeting/base/geoinfo/tdalookup', [inputData]).pipe(
            tap(response => this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now() - this.audienceService.timingMap.get('(' + inputData.source.toLowerCase() + ')'))),
            map(response => this.validateFuseResponseOld(response, identifiers, isForShading)),
            catchError( () => {
                console.error('Error posting to v1/targeting/base/geoinfo/tdalookup with payload:');
                console.error('payload:\n{\n ' +
                              '   geoType:      ', inputData.geoType, '\n',
                              '   source:       ', inputData.source, '\n',
//                            '   geocodes:     ', inputData.geocodes.toString(), '\n',
                              '   transactionId:', inputData.transactionId, '\n',
                              '   chunks:       ', inputData.chunks, '\n',
                              '   categoryIds:  ', inputData.categoryIds.toString(), '\n}'
                             );
                return throwError('No Data was returned for the selected audiences'); })
          ));
        }
//    }

    const currentProject = this.stateService.currentProject$.getValue();
    const geoCache = groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
    return merge(...observables, 4).pipe(
      filter(data => data != null),
//      map(bulkData => simpleFlatten(bulkData.map(b => {this.createGeofootprintVar(b.geocode, Number(b.variablePk), b.score, this.rawAudienceData.get(b.variablePk), geoCache, isForShading))))
      map(bulkData => {
        const geoVars: ImpGeofootprintVar[] = [];
         //let rows = bulkData["rows"];
       for (let i = 0; i < bulkData.length; i++)
       {
          // console.log("bulk geocode: ", bulkData[i].geocode, ", attrs: ", bulkData[i].attrs);
          geoVars.push(...this.createGeofootprintVars(bulkData[i].geocode, bulkData[i].attrs, geoCache, isForShading));
       }
       return geoVars;
      })
    );

//    console.log("### apioDataRefresh pushing ", observables.length, "observables for ", geocodes.length, "geocodes in ", chunks.length, "chunks, ids:", identifiers);
//    return observables;
  }*/

  public offlineVarRefresh(source: OfflineSourceTypes, analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number) : Observable<OfflineBulkDataResponse[]> {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const currentProject = this.stateService.currentProject$.getValue();

    console.log('### offlineVarRefresh:', source, 'ids:', numericIds, 'geocodes:', geocodes, 'transactionId:', transactionId);

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
    console.log('### tda validateFuseResponse NEW - response.length:', responseArray.length);

    // Simulate no variables being returned
    // response.payload.counts['1016'] = 0;

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

/*
  private validateFuseResponseOld(response: RestResponse, identifiers: string[], isForShading: boolean) {
    const responseArray: OfflineFuseResponse[] = response.payload.rows;
    console.log('### tda validateFuseResponse OLD - response.length:', responseArray.length);
    for (let r = 0; r < responseArray.length; r++)
    {
      const vars: Map<string, string> = new Map<string, string>();
      for (let i = 0; i < identifiers.length; i++)
        if (responseArray[r].attrs.hasOwnProperty(identifiers[i]))
           vars.set(identifiers[i], responseArray[r].attrs[identifiers[i]]);
      responseArray[r].attrs = vars;
    }
    // console.log("response.payload.counts:", response.payload.counts); // DEBUG see the REST response counts
    const missingCategoryIds: number[] = [];
    // let varCounts: Map<string, number> = new Map<string, number>();
    // for (let i=0; i < identifiers.length; i++)
    //    varCounts.set(identifiers[i], response.payload.counts.hasOwnProperty(identifiers[i]) ? response.payload.counts[identifiers[i]]:0);
    // vs
    // let varCounts: Map<string, number> = new Map<string, number>(Object.entries(response.payload.counts));
    // console.log("varCountsNew:", varCounts);

    const emptyAudiences = Object.entries(response.payload.counts)
      .filter((entry) => (entry[1] === 0 || entry[1] == null) && this.rawAudienceData.has(entry[0]))
      .map(e => this.rawAudienceData.get(e[0]).fielddescr);

    if (emptyAudiences.length > 0 && !isForShading)
      this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + emptyAudiences.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));
    return responseArray;
  }*/

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('offline', checkType, metricText));
  }
}
