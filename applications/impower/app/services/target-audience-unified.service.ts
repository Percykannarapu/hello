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

export interface UnifiedResponse {
  id: string;
  score: string;
}

export interface UnifiedFuseResponse {
  geocode: string;
  dmaScore: string;
  nationalScore: string;
  digCategoryId: string;
  attrs: Map<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceUnifiedService {


  public selectedAudiences$ = new BehaviorSubject<Audience[]>([]);
  // private rawAudienceData: Map<string, TdaVariableResponse> = new Map<string, TdaVariableResponse>();

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

      if (project && project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'combined')) {
        for (const projectVar of project.impProjectVars.filter(v => v.source.split('_')[0].toLowerCase() === 'combined')) {
          const groupedAudiences = JSON.parse(projectVar.customVarExprQuery);
          const audience: AudienceDataDefinition = {
            audienceName: projectVar.fieldname,
            audienceIdentifier: projectVar.varPk.toString(),
            audienceSourceType: 'Combined',
            audienceSourceName: 'TDA',
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            exportNationally: false,
            allowNationalExport: false,
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: false,
            seq: projectVar.sortOrder,
            isCombined: true,
            combinedAudiences: groupedAudiences,
            combinedVariableNames: projectVar.customVarExprDisplay
          };

          if (projectVar.source.toLowerCase().match('combined')) {
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

  public getAllVars(source: string, audienceList: Audience[], analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number) : Observable<UnifiedBulkResponse[]> {
    console.log('selected audiences', audienceList);

    const combinedVars: Audience[] = [];
    let requestVars: Array<VarList> = [];

    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    const numericIds = identifiers.map(i => Number(i));
    const serviceURL = 'v1/targeting/base/geoinfo/varlookup';
    const varIDs = audienceList[0].combinedAudiences.map(a => Number(a));

    audienceList[0].combinedAudiences.forEach(id => {
      if (this.selectedAudiences$ != null)
        combinedVars.push(this.selectedAudiences$.getValue().find(aud => aud.audienceIdentifier === id));
    });

    combinedVars.push(audienceList[0]);
    requestVars = combinedVars.map(aud => ({
      id: Number(aud.audienceIdentifier), desc: aud.audienceName, source: aud.audienceSourceType.toLocaleLowerCase(),
      base: aud.selectedDataSet != null ? aud.selectedDataSet : '', combineSource: identifiers[0] === aud.audienceIdentifier ? varIDs : []
    }));

    requestVars.forEach(v => {
      if (v.source !== 'combine') {
        // v.base = 'SOURCE';
        delete v.combineSource;
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
    console.log('unified payload::', inputData);

    if (identifiers.length > 0) {
      return this.restService.post(serviceURL, [inputData])
        .pipe(
          tap(response => console.log('response payload::', response)),
          map(response => this.validateFuseResponse(response, identifiers.map(id => id.toString()), isForShading)),
          tap(response => (response)),
          catchError(() => {
            console.error('Error posting to', serviceURL, 'with payload:');
            console.error('payload:', inputData);
            console.error('payload:\n{\n' +
              '   geoType: ', inputData.geoType, '\n',
              '   geocodes: ', geocodes.toString(), '\n',
            );
            return throwError('No data was returned for the selected audiences');
          })
        );
    }
    console.warn('getAllVars had no ids to process.');
    return EMPTY;
  }
  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean[]) {
    console.log('response from unified:::', response);
    const validatedResponse: UnifiedBulkResponse[] = [];
    const responseArray: UnifiedFuseResponse[] = response.payload.rows;
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
          // emptyAudiences.push((this.rawAudienceData.has(identifiers[i]) ? this.rawAudienceData.get(identifiers[i]).fielddescr : identifiers[i]));

          if (emptyAudiences.length > 0)
            this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + emptyAudiences.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));

    return validatedResponse;
  }


}
