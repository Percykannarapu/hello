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
import { CommonSort } from '@val/common';

export interface VarSpecs {
  id: number;
  pct: number;
  base?: string;
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
  private audienceSourceTypes = ['combined', 'converted', 'combined/converted', 'composite'];

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
                                projectVar.source.split('_')[0].toLowerCase() === 'combined/converted' ? 'Combined/Converted' :
                                projectVar.source.split('_')[0].toLowerCase() === 'composite' ? 'Composite' : 'Converted',
            audienceSourceName: 'TDA',
            exportInGeoFootprint: projectVar.isIncludedInGeofootprint,
            showOnGrid: projectVar.isIncludedInGeoGrid,
            showOnMap: projectVar.isShadedOnMap,
            exportNationally: false,
            allowNationalExport: false,
            selectedDataSet: projectVar.indexBase,
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: true,
            seq: projectVar.sortOrder,
            isCombined: projectVar.source.split('_')[0].toLowerCase() === 'combined' ||
                        projectVar.source.split('_')[0].toLowerCase() === 'combined/converted' ? true : false,
            isComposite: projectVar.source.split('_')[0].toLowerCase() === 'composite' ? true : false,
            combinedAudiences: projectVar.source.split('_')[0].toLowerCase() === 'combined' || projectVar.source.split('_')[0].toLowerCase() === 'combined/converted' ? groupedAudiences : [],
            combinedVariableNames: projectVar.customVarExprDisplay,
            compositeSource: projectVar.source.split('_')[0].toLowerCase() === 'converted' ||
                             projectVar.source.split('_')[0].toLowerCase() === 'composite' ? groupedAudiences : []
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
          if (projectVar.source.toLowerCase().match('composite')) {
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

  public getAllVars(source: string, audienceList: Audience[], analysisLevel: string, identifiers: string[], geocodes: string[], isForShading: boolean[], transactionId: number): Observable<UnifiedBulkResponse[]> {
    let requiredVars: Audience[] = [];
    let dependentVar: Audience;
    const sourceTypes = ['Combined', 'Converted', 'Combined/Converted', 'Composite'];
    const serviceAnalysisLevel = analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel;
    let requestVars: Array<VarList> = [];
    const serviceURL = 'v1/targeting/base/geoinfo/varlookup';
    requiredVars = audienceList;
    audienceList.map(audience => {
      if (audience.combinedAudiences.length > 0) {
        audience.combinedAudiences.forEach(id => {
          if (this.selectedAudiences$ != null && this.selectedAudiences$.getValue().length > 0) {
            dependentVar = this.selectedAudiences$.getValue().find(aud => aud.audienceIdentifier === id);
            requiredVars.push(dependentVar);
            if (dependentVar != null && sourceTypes.includes(dependentVar.audienceSourceType) && dependentVar.combinedAudiences.length > 0) {
              dependentVar.combinedAudiences.forEach(item => {
                requiredVars.push(this.selectedAudiences$.getValue().find(aud => aud.audienceIdentifier === item));
              });
            }
          }
        });
      }
      if (audience.compositeSource.length > 0) {
        audience.compositeSource.forEach(variable => {
          if (this.selectedAudiences$ != null && this.selectedAudiences$.getValue().length > 0) {
            dependentVar = this.selectedAudiences$.getValue().find(a => a.audienceIdentifier === variable.id.toString());
            requiredVars.push(dependentVar);
            if (dependentVar != null && sourceTypes.includes(dependentVar.audienceSourceType)) {
              if (dependentVar.combinedAudiences != null && dependentVar.combinedAudiences.length > 0) {
                dependentVar.combinedAudiences.forEach(aud => {
                  requiredVars.push(this.selectedAudiences$.getValue().find(a => a.audienceIdentifier === aud));
                  if(!identifiers.includes(dependentVar.audienceIdentifier))
                      identifiers.push(dependentVar.audienceIdentifier);
                });
              }
              if (dependentVar.compositeSource != null && dependentVar.compositeSource.length > 0) {
                dependentVar.compositeSource.forEach(row => {
                  requiredVars.push(this.selectedAudiences$.getValue().find(a => a.audienceIdentifier === row.id.toString()));
                });
              }
            }
          }
        });
      }
    });

    const uniqueAudienceList = Array.from(new Set(requiredVars));

    requestVars = uniqueAudienceList.map(aud => {
      return ({
        id: Number(aud.audienceIdentifier),
        desc: aud.audienceName,
        source: sourceTypes.includes(aud.audienceSourceType) && aud.compositeSource.length === 0 ? 'combine' :
          aud.compositeSource != null && aud.compositeSource.length > 0 ? 'composite' : aud.audienceSourceType,
        base: aud.selectedDataSet != null ? aud.selectedDataSet : '',
        combineSource: aud.combinedAudiences != null && aud.combinedAudiences.length > 0 ? aud.combinedAudiences.map(a => Number(a)) : [],
        compositeSource: aud.compositeSource != null && aud.compositeSource.length > 0 ? aud.compositeSource : []
      });
    });

    requestVars.forEach(v => {
      if (v.source !== 'combine' && v.source !== 'composite') {
        v.base = 'SRC';
        delete v.combineSource;
        delete v.compositeSource;
      }
      if (v.source === 'combine')
        delete v.compositeSource;
      if (v.source === 'composite')
        delete v.combineSource;
      if (v.base === '' && !identifiers.includes(v.id.toString()))
        identifiers.push(v.id.toString());
    });
    const inputData = {
      geoType: serviceAnalysisLevel,
      geocodes: geocodes,
      transactionId: transactionId,
      deleteTransaction: false,
      chunks: this.config.geoInfoQueryChunks,
      vars: requestVars
    };
    if (requestVars.length > 0) {
      return this.restService.post(serviceURL, [inputData])
        .pipe(
          map(response => this.validateFuseResponse(response, identifiers.sort(CommonSort.StringsAsNumbers), isForShading)),
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
    this.logger.warn.log('getAllVars had no variables to process.');
    return EMPTY;
  }

  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean[]) {
    const validatedResponse: UnifiedBulkResponse[] = [];
    const responseArray: UnifiedFuseResponse[] = response.payload.rows;
    if (responseArray.length > 0) {
      for (let r = 0; r < responseArray.length; r++) {
        const responseVars = Object.keys(responseArray[r].variables);
        if (responseVars.length > 0) {
          for (let i = 0; i < identifiers.length; i++) {
            if (identifiers.includes(responseVars[i].substring(0, responseVars[i].indexOf('_', 1)))) {
              validatedResponse.push({
                geocode: responseArray[r].geocode, id: identifiers[i],
                score: responseArray[r].variables[responseVars[i]]
              });
            }
          }
        }
      }
    }
    if (response.payload.issues != null && response.payload.issues.ERROR.length > 0) {
      this.logger.error.log(response.payload.issues);
      this.store$.dispatch(new WarningNotification({ message: 'There was an error retrieving data for one or more audience variables', notificationTitle: 'Selected Audience Warning' }));
    }
    return validatedResponse;
  }
}
