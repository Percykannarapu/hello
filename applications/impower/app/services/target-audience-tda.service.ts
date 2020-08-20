import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { WarningNotification } from '@val/messaging';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, filter, map, tap } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { OfflineAudienceDefinition } from '../models/audience-categories.model';
import { AudienceDataDefinition } from '../models/audience-data.model';
import { RestResponse } from '../models/RestResponse';
import { LocalAppState } from '../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../state/usage/targeting-usage.actions';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { FieldContentTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';
import { UnifiedAudienceDefinitionService } from './unified-audience-definition.service';

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

@Injectable({
  providedIn: 'root'
})
export class TargetAudienceTdaService {

  constructor(private config: AppConfig,
    private restService: RestDataService,
    private audienceService: TargetAudienceService,
    private definitionService: UnifiedAudienceDefinitionService,
    private stateService: AppStateService,
    private store$: Store<LocalAppState>,
    private logger: AppLoggingService) {
    this.stateService.applicationIsReady$.pipe(filter(ready => ready)).subscribe(() => this.onLoadProject());
  }

  private static createDataDefinition(name: string, pk: string, fieldconte: FieldContentTypeCodes, presetExportFlag: boolean) : AudienceDataDefinition {
   const audience: AudienceDataDefinition = {
      audienceName: name,
      audienceIdentifier: pk,
      audienceSourceType: 'Offline',
      audienceSourceName: 'TDA',
      exportInGeoFootprint: presetExportFlag,
      showOnGrid: false,
      exportNationally: false,
      allowNationalExport: false,
      fieldconte: fieldconte,
      requiresGeoPreCaching: true,
      sortOrder: null
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
            exportNationally: false,
            allowNationalExport: false,
            fieldconte: FieldContentTypeCodes.parse(projectVar.fieldconte),
            requiresGeoPreCaching: true,
            sortOrder: projectVar.sortOrder
          };

          if (projectVar.source.toLowerCase().match('tda')) {
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

  public addAudience(audience: OfflineAudienceDefinition, manuallyAdded: boolean = true) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte, manuallyAdded);
      this.audienceService.addAudience(model, null);
      this.usageMetricCheckUncheckOffline('checked', model);
    }
  }

  public removeAudience(audience: OfflineAudienceDefinition) {
    const isValidAudience = !Number.isNaN(Number(audience.identifier));
    if (isValidAudience) {
      this.audienceService.removeAudience('Offline', 'TDA', audience.identifier);
      const model = TargetAudienceTdaService.createDataDefinition(audience.displayName, audience.identifier, audience.fieldconte, true);
      this.usageMetricCheckUncheckOffline('unchecked', model);
    }
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

    if (inputData.categoryIds.length > 0) {
      this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now());
      return this.restService.post(serviceURL, [inputData])
        .pipe(
          tap(response => this.audienceService.timingMap.set('(' + inputData.source.toLowerCase() + ')', performance.now() - this.audienceService.timingMap.get('(' + inputData.source.toLowerCase() + ')'))),
          map(response => this.validateFuseResponse(response, inputData.categoryIds.map(id => id.toString()), isForShading)),
          tap(response => (response)),
          catchError( () => {
            this.logger.error.log('Error posting to', serviceURL, 'with payload:');
            this.logger.error.log('payload:', inputData);
            this.logger.error.log('payload:\n{\n' +
                          '   geoType: ', inputData.geoType, '\n',
                          '   source:  ', inputData.source, '\n',
                          '   geocodes: ', geocodes.toString(), '\n',
                          '   categoryIds:', inputData.categoryIds.toString(), '\n}'
                          );
            return throwError('No data was returned for the selected audiences'); })
          );
    }
    this.logger.warn.log('offlineVarRefresh had no ids to process.');
    return EMPTY;
  }

  private validateFuseResponse(response: RestResponse, identifiers: string[], isForShading: boolean[]) {
    const validatedResponse: OfflineBulkDataResponse[] = [];
    const responseArray: OfflineFuseResponse[] = response.payload.rows;
    const emptyAudiences: string[] = [];

    //this.logger.debug.log('### tda validateFuseResponse - response.length:', responseArray.length);

    // Validate and transform the response
    for (let r = 0; r < responseArray.length; r++)
      for (let i = 0; i < identifiers.length; i++)
        if (responseArray[r].attrs.hasOwnProperty(identifiers[i]))
          validatedResponse.push ({ geocode: responseArray[r].geocode, id: identifiers[i], score: responseArray[r].attrs[identifiers[i]] });

    // Look for variables that did not have data
    for (let i = 0; i < identifiers.length; i++)
      if (isForShading[i] === false && response.payload.counts.hasOwnProperty(identifiers[i]) && response.payload.counts[identifiers[i]] === 0)
        emptyAudiences.push(identifiers[i]);

    if (emptyAudiences.length > 0) {
      this.definitionService.getRawTdaDefinition(emptyAudiences).pipe(
        map(definitions => definitions.map(def => def.fielddescr)),
      ).subscribe(fieldNames => {
        this.store$.dispatch(new WarningNotification({ message: 'No data was returned for the following selected offline audiences: \n' + fieldNames.join(' , \n'), notificationTitle: 'Selected Audience Warning' }));
      });
    }

    return validatedResponse;
  }

  private usageMetricCheckUncheckOffline(checkType: string, audience: AudienceDataDefinition){
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('offline', checkType, metricText));
  }
}
