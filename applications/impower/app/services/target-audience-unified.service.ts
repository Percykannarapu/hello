import { Injectable } from '@angular/core';
import { AppConfig } from 'app/app.config';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { TargetAudienceService } from './target-audience.service';
import { AppStateService } from './app-state.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import { AppLoggingService } from './app-logging.service';
import { filter, tap, map, catchError } from 'rxjs/operators';
import { AudienceDataDefinition } from 'app/models/audience-data.model';
import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { RestResponse } from 'app/models/RestResponse';
import { WarningNotification } from '@val/messaging';
import { EMPTY, throwError, Observable, BehaviorSubject } from 'rxjs';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

export interface VarSpecs {
  id: number;
  pct: number;
}

export interface UnifiedBulkResponse {
  geocode: string;
  id: string;
  score: string;
}

export interface VarList {
  id: number;
  desc: string;
  source: string;
  base: string;
  // source: 'Interest' | 'In-Market' | 'Vlh' | 'Pixel' | 'Offline' |'Combined' | 'Composite' | 'Convert';
  // base: 'DMA' | 'NAT' | 'ALL' ;
  combineSource?: number[];
  compositeSource?: Array<VarSpecs>;
}

export interface UnifiedFuseResponse {
  geocode: string;
  // dmaScore: string;
  // nationalScore: string;
  // digCategoryId: string;
  variables: Map<string, string>;
}

export enum OtherSourceTypes {
  COMBINE = 'combine',
  COMPOSITE = 'composite'
}
@Injectable({
  providedIn: 'root'
})
export class TargetAudienceUnifiedService {


  public selectedAudiences$ = new BehaviorSubject<Audience[]>([]);
  // private rawAudienceData: Map<string, TdaVariableResponse> = new Map<string, TdaVariableResponse>();
  private audienceSourceTypes = ['combined', 'converted', 'combined/converted'] ;


  constructor(private config: AppConfig,
    private restService: RestDataService,
    private audienceService: TargetAudienceService,
    private stateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {

    this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadProject());
    this.store$.select(fromAudienceSelectors.allAudiences).subscribe(this.selectedAudiences$);
  }

  public rehydrateAudience() {
    try {
      const project = this.stateService.currentProject$.getValue();
      if (project && project.impProjectVars.filter(v => this.audienceSourceTypes.includes(v.source.split('_')[0].toLowerCase()))) {
        for (const projectVar of project.impProjectVars.filter(v => this.audienceSourceTypes.includes(v.source.split('_')[0].toLowerCase()))) {
          const groupedAudiences = JSON.parse(projectVar.customVarExprQuery);
          const audience: AudienceDataDefinition = {
            audienceName: projectVar.fieldname,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceSourceType: projectVar.source.split('_')[0].toLowerCase() === 'combined' ? 'Combined' :
                                projectVar.source.split('_')[0].toLowerCase() === 'combined/converted' ? 'Combined/Converted' : 'Converted',
            audienceSourceName: 'TDA',
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            exportNationally: false,
            allowNationalExport: false,
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: true,
            seq: projectVar.sortOrder,
            isCombined: projectVar.indexBase != null ? false : true,
            combinedAudiences: projectVar.indexBase == null ? groupedAudiences : [] ,
            combinedVariableNames: projectVar.customVarExprDisplay,
            compositeSource: projectVar.indexBase != null ? groupedAudiences : [] 
          };

          if (projectVar.source.toLowerCase().match('combined')) {
            this.audienceService.addAudience(audience, null, true);
          }
          if (projectVar.source.toLowerCase().match('converted')) {
            this.audienceService.addAudience(audience, null, true);
          }
          if (projectVar.source.toLowerCase().match('combined/converted')) {
            this.audienceService.addAudience(audience, null, true);
          }
        }

      }

    }
    catch (error) {
      this.logger.error.log(error);
    }
  }

  private onLoadProject() {
    this.rehydrateAudience();
  }

  public getAllVars(source: string, audienceList: Audience[], analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number) : Observable<UnifiedBulkResponse[]> {
    const combinedVars: Audience[] = [];
    const sourceTypes = ['Combined', 'Converted', 'Combined/Converted'] ;
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    let requestVars: Array<VarList> = [];
    const sourceIDs: Map<number, number[]> = new Map<number, number[]>();
    const serviceURL = 'v1/targeting/base/geoinfo/varlookup';
    audienceList.map(audience => {
      combinedVars.push(audience);
      if (audience.combinedAudiences.length > 0){
        sourceIDs.set(Number(audience.audienceIdentifier), audience.combinedAudiences.map(a => Number(a)));
        audience.combinedAudiences.forEach(id => {
        if (this.selectedAudiences$ != null && this.selectedAudiences$.getValue().length > 0)
          combinedVars.push(this.selectedAudiences$.getValue().find(aud => aud.audienceIdentifier === id));
        });
      }
      if (audience.compositeSource.length > 0){
        sourceIDs.set(Number(audience.audienceIdentifier), audience.compositeSource.map(a => Number(a)));
        audience.compositeSource.forEach(id => {
        if (this.selectedAudiences$ != null && this.selectedAudiences$.getValue().length > 0)
          combinedVars.push(this.selectedAudiences$.getValue().find(aud => aud.audienceIdentifier === id));
        });
      }
    });

    const uniqueAudList =  Array.from(new Set(combinedVars));
    requestVars = uniqueAudList.map(aud => {
       return ({
      id: Number(aud.audienceIdentifier),
      desc: aud.audienceName, 
      source: sourceTypes.includes(aud.audienceSourceType) &&  aud.compositeSource.length === 0  ? 'combine' :  
              aud.compositeSource != null && aud.compositeSource.length > 0 ? 'composite' : aud.audienceSourceType,
      base: aud.selectedDataSet != null ? aud.selectedDataSet : '', 
      combineSource: sourceIDs.has(Number(aud.audienceIdentifier)) ? sourceIDs.get(Number(aud.audienceIdentifier)) : [],
      compositeSource : aud.selectedDataSet != null && sourceIDs.has(Number(aud.audienceIdentifier)) ?
                               [{id: Number(sourceIDs.get(Number(aud.audienceIdentifier))), pct: 100.0}] : []
    });
  });

    requestVars.forEach(v => {
      if (v.source !== 'combine' && v.source !== 'composite') {
        v.base = 'SRC';
        delete v.combineSource;
      }
      if (v.source !== 'combine' && v.base !== 'SRC')
       delete v.combineSource;

      if (v.base == null || v.base === 'SRC' || v.source === 'combine'){
        delete v.compositeSource;
      }
    });

    const inputData = {
      geoType: serviceAnalysisLevel,
      geocodes: geocodes,
      transactionId: transactionId,
      deleteTransaction: false,
      chunks: this.config.geoInfoQueryChunks,
      vars: requestVars
    };
    this.logger.info.log('unified request payload::', inputData);

    if (sourceIDs.size > 0) {
      return this.restService.post(serviceURL, [inputData])
        .pipe(
          tap(response => this.logger.info.log('unified response payload::', response)),
          map(response => this.validateFuseResponse(response,  identifiers.map(id => id.toString()), isForShading)),
          tap(response => (response)),
          catchError(() => {
            this.logger.error.log('Error posting to', serviceURL, 'with payload:');
            this.logger.error.log('payload:', inputData);
            this.logger.error.log('payload:\n{\n' +
              '   geoType: ', inputData.geoType, '\n',
              '   geocodes: ', geocodes.toString(), '\n',
            );
            return throwError('No data was returned for the selected audiences');
          })
        );
    }

    this.logger.warn.log('getAllVars had no ids to process.');
    return EMPTY;
  }
  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean[]) {
    const validatedResponse: UnifiedBulkResponse[] = [];
    const responseArray: UnifiedFuseResponse[] = response.payload.rows;

    const emptyAudiences: string[] = [];
    for (let r = 0; r < responseArray.length; r++){
      const responseVars = Object.keys(responseArray[r].variables);
      for (let i = 0; i < identifiers.length; i++){
        if (responseVars[i] != null && identifiers.includes(responseVars[i].substring(0, 1)))
          validatedResponse.push ({ geocode: responseArray[r].geocode, id: identifiers[i], 
                              score: responseArray[r].variables[responseVars[i]] });
      }
    }
  return validatedResponse;

  }
}