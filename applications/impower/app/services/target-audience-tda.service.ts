import { Injectable } from '@angular/core';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { catchError, filter, map, mergeAll, mergeMap, tap } from 'rxjs/operators';
import { EMPTY, merge, Observable, throwError } from 'rxjs';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { TargetAudienceService } from './target-audience.service';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { AppConfig } from '../app.config';
import { AppStateService } from './app-state.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpDomainFactoryService } from '../val-modules/targeting/services/imp-domain-factory.service';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { chunkArray, groupBy, simpleFlatten } from '@val/common';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';

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

// TODO Strip out the dma / national scores, digCategoryId
interface TdaBulkDataResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
  attrs: Map<string, string>;
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
    private domainFactory: ImpDomainFactoryService,
    private varService: ImpGeofootprintVarService,
    private stateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {
    this.stateService.applicationIsReady$.subscribe(ready => this.onLoadProject(ready));
  }

  private static createDataDefinition(name: string, pk: string, fieldconte: FieldContentTypeCodes) : AudienceDataDefinition {
   TargetAudienceService.audienceCounter++;
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
      audienceCounter: TargetAudienceService.audienceCounter,
      fieldconte: fieldconte
    };
    return audience;
  }

  private onLoadProject(ready: boolean) {
    if (!ready) return; // loading will be false when the load is actually done
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
            audienceCounter: projectVar.sortOrder,
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte)
          };
          if (projectVar.sortOrder > TargetAudienceService.audienceCounter) TargetAudienceService.audienceCounter = projectVar.sortOrder++;
          if (projectVar.source.toLowerCase().match('tda')) {
            this.audienceService.addAudience(audience, (al, pks, geos, shading) => this.audienceRefreshCallback(al, pks, geos, shading, -1), null, null);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  private createGeofootprintVars(geocode: string, attrs: Map<string, string>, geoCache: Map<string, ImpGeofootprintGeo[]>, isForShading: boolean) : ImpGeofootprintVar[] {
    let results: ImpGeofootprintVar[] = [];
    attrs.forEach((value: string, key: string) => {
      let varPk: number = parseInt(key);//, value: string
      let rawData: TdaVariableResponse = this.rawAudienceData.get(key);

      const fullId = `Offline/TDA/${varPk}`;
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
      }
      else {
        fieldValue = numberAttempt;
        if (fieldType == null) fieldType = FieldContentTypeCodes.Index;
      }
      if (isForShading) {
        if (this.varService.get().findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk) === -1
                      && results.findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk) === -1) {
          const currentResult = this.domainFactory.createGeoVar(null, geocode, varPk, fieldValue, fullId, fieldDescription, fieldType, fieldName, natlAvg);
          //if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
          results.push(currentResult);
        }
      }
      else {
        if (geoCache.has(geocode)) {
          geoCache.get(geocode).forEach(geo => {
            if (this.varService.get().findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1
                          && results.findIndex(gvar => gvar.geocode === geocode && gvar.varPk === varPk && gvar.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber) === -1) {
              const currentResult = this.domainFactory.createGeoVar(geo.impGeofootprintTradeArea, geocode, varPk, fieldValue, fullId, fieldDescription, fieldType, fieldName, natlAvg);
              //if (matchingAudience != null) currentResult.varPosition = matchingAudience.audienceCounter;
              results.push(currentResult);
            }
          });
        }
      }
    });
    return results;
  }

  public addAudience(audience: TdaAudienceDescription) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte);
      this.audienceService.addAudience(model, (al, pks, geos, shading, transactionId) => this.audienceRefreshCallback(al, pks, geos, shading, transactionId));
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

  private audienceRefreshCallback(analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean, transactionId: number) : Observable<ImpGeofootprintVar[]> {
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
//  const chunks = chunkArray(geocodes, 999999/*geocodes.length / 4*/); //this.config.maxGeosPerGeoInfoQuery);
    const observables: Observable<TdaBulkDataResponse[]>[] = [];
    let c:number = 0;

//    for (const chunk of chunks) {
      const inputData = {
        geoType: serviceAnalysisLevel,
        source: "tda",
//      geocodes: chunk,
        categoryIds: numericIds,
        transactionId: (transactionId != -1) ? transactionId : this.audienceService.geoTransactionId,
        chunks: this.config.geoInfoQueryChunks
      };
//      if (inputData.geocodes.length > 0 && inputData.categoryIds.length > 0) {
      if (inputData.categoryIds.length > 0) {
        c++;
        const chunkNum: number = c;
        this.audienceService.timingMap.set("("+inputData.source.toLowerCase()+")", performance.now());
        observables.push(
          this.restService.post('v1/targeting/base/geoinfo/tdalookup', [inputData]).pipe(
            tap(response => this.audienceService.timingMap.set("("+inputData.source.toLowerCase()+")", performance.now()-this.audienceService.timingMap.get("("+inputData.source.toLowerCase()+")"))),
            map(response => this.validateFuseResponse(response, identifiers, isForShading)),
            catchError( () => {
                console.error('Error posting to v1/targeting/base/geoinfo/tdalookup with payload:');
                console.error('payload:\n{\n '+
                              '   geoType:      ', inputData.geoType, '\n',
                              '   source:       ', inputData.source, '\n',
//                            '   geocodes:     ', inputData.geocodes.toString(), '\n',
                              '   transactionId:', inputData.transactionId, '\n',
                              '   chunks:       ', inputData.chunks, '\n',
                              '   categoryIds:  ', inputData.categoryIds.toString(), '\n}'
                             );
                return throwError('No Data was returned for the selected audiences');})
          ));
        }
//    }

    const currentProject = this.stateService.currentProject$.getValue();
    const geoCache = groupBy(currentProject.getImpGeofootprintGeos(), 'geocode');
    return merge(...observables, 4).pipe(
      filter(data => data != null),
//      map(bulkData => simpleFlatten(bulkData.map(b => {this.createGeofootprintVar(b.geocode, Number(b.variablePk), b.score, this.rawAudienceData.get(b.variablePk), geoCache, isForShading))))
      map(bulkData => {
        let geoVars: ImpGeofootprintVar[] = [];
         //let rows = bulkData["rows"];
       for (let i=0; i < bulkData.length; i++)
       {
          // console.log("bulk geocode: ", bulkData[i].geocode, ", attrs: ", bulkData[i].attrs);
          geoVars.push(...this.createGeofootprintVars(bulkData[i].geocode, bulkData[i].attrs, geoCache, isForShading));
       }
       return geoVars;
      })
    );

//    console.log("### apioDataRefresh pushing ", observables.length, "observables for ", geocodes.length, "geocodes in ", chunks.length, "chunks, ids:", identifiers);
//    return observables;
}

  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean) {
    const responseArray: TdaBulkDataResponse[] = response.payload.rows;

    for (let r=0; r < responseArray.length; r++)
    {
      let vars: Map<string, string> = new Map<string, string>();
      for (let i=0; i < identifiers.length; i++)
        if (responseArray[r].attrs.hasOwnProperty(identifiers[i]))
           vars.set(identifiers[i], responseArray[r].attrs[identifiers[i]]);
      responseArray[r].attrs = vars;
    }
    // console.log("response.payload.counts:", response.payload.counts); // DEBUG see the REST response counts
    let missingCategoryIds: number[] = [];
    // let varCounts: Map<string, number> = new Map<string, number>();
    // for (let i=0; i < identifiers.length; i++)
    //    varCounts.set(identifiers[i], response.payload.counts.hasOwnProperty(identifiers[i]) ? response.payload.counts[identifiers[i]]:0);
    // vs
    // let varCounts: Map<string, number> = new Map<string, number>(Object.entries(response.payload.counts));
    // console.log("varCountsNew:", varCounts);

    const emptyAudiences = Object.entries(response.payload.counts)
      .filter((entry) => (entry[1] === 0 || entry[1] == null) && this.rawAudienceData.has(entry[0]))
      .map(e => this.rawAudienceData.get(e[0]).fielddescr);

    if (emptyAudiences.length >0 && !isForShading)
      this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + emptyAudiences.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));
/*
      const missingCategoryIds = new Set(responseArray.filter(id => id.score === 'undefined'));
      const audience = [];
      if (missingCategoryIds.size > 0) {
        missingCategoryIds.forEach(id => {
          if (this.rawAudienceData.has(id.variablePk)) {
            audience.push(this.rawAudienceData.get(id.variablePk).fielddescr);
          }
        });
        if (!isForShading){
            this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + audience.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));
        }
      }*/
    //this.logger.info("Offline Audience Response::: ", responseArray.length, " rows"); // , responseArray);
    return responseArray;
  }

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('offline', checkType, metricText));
  }
}
