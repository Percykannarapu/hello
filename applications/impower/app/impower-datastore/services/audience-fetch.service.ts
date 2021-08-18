import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { convertKeys, isEmpty, isNotNil, isStringArray, mapByExtended, toNullOrNumber } from '@val/common';
import { WarningNotification } from '@val/messaging';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FullState } from '../../../../cpq-maps/src/app/cpq-map/state/index';
import { AppConfig } from '../../app.config';
import { AudienceDataDefinition, UnifiedPayload, UnifiedResponse, VarListItem } from '../../models/audience-data.model';
import { createAudienceVarListItem, createCombinedVarListItem, createCompositeVarListItem } from '../../models/audience-factories';
import { AppLoggingService } from '../../services/app-logging.service';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { Audience } from '../state/transient/audience/audience.model';
import { DynamicVariable } from '../state/transient/dynamic-variable.model';

@Injectable({
  providedIn: 'root'
})
export class AudienceFetchService {

  private combinedSourceTypes = new Set(['Combined', 'Converted', 'Combined/Converted', 'Composite']);

  constructor(private config: AppConfig,
              private logger: AppLoggingService,
              private restService: RestDataService,
              private store$: Store<FullState>) { }

  public getCachedAudienceData(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txId: number, silent: boolean) : Observable<DynamicVariable[]>;
  public getCachedAudienceData(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, geocodes: string[], silent: boolean) : Observable<DynamicVariable[]>;
  public getCachedAudienceData(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txIdOrGeos: number | string[], silent: boolean) : Observable<DynamicVariable[]> {
    if (isNotNil(txIdOrGeos) && !isEmpty(txIdOrGeos) && !isEmpty(audiences)) {
      const requestPayload = this.convertAudiencesToUnifiedPayload(audiences, allAudiences, analysisLevel, txIdOrGeos);
      return this.restService.post<UnifiedResponse>(this.config.serviceUrlFragments.unifiedAudienceUrl, [requestPayload]).pipe(
        map(response => response.payload),
        tap(payload => {
          let notify = false;
          if (!isEmpty(payload?.issues?.ERROR)) {
            this.logger.error.groupCollapsed('Additional Audience Fetch Error Info');
            this.logger.error.log(payload.issues.ERROR);
            this.logger.error.groupEnd();
            notify = true;
          }
          if (!isEmpty(payload?.issues?.WARN)) {
            notify = true;
            if (payload.issues.WARN[0] === 'No variable values were found') {
              const notificationTitle = payload.issues.WARN.shift();
              const message = payload.issues.WARN.join('\n');
              this.store$.dispatch(WarningNotification({ notificationTitle, message }));
            } else {
              this.logger.warn.toggleLevelIgnore(); // ensures warnings get logged in production
              this.logger.warn.groupCollapsed('Additional Audience Fetch Warning Info');
              this.logger.warn.log(payload.issues.WARN);
              this.logger.warn.groupCollapsed();
              this.logger.warn.toggleLevelIgnore();
            }
          }
          if (notify && !silent) {
            this.store$.dispatch(WarningNotification({ message: 'There was an issue pulling audience data, please check to ensure you have all the data you need.' }));
          }
        }),
        map(payload => payload.rows.map(r => ({geocode: r.geocode, ...convertKeys(r.variables, k => k.split('_')[0])})))
      );
    } else {
      return of([]);
    }
  }

  private convertAudiencesToUnifiedPayload(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txIdOrGeocodes: number | string[]) : UnifiedPayload {
    const existingIds = new Set<number>(audiences.map(a => Number(a.audienceIdentifier)));
    const rootIds = new Set<number>(existingIds);
    const allAudienceMap = mapByExtended(allAudiences, (a) => Number(a.audienceIdentifier));
    const vars = this.createVarListItems(audiences, existingIds, allAudienceMap, rootIds);
    const result: UnifiedPayload = {
      geoType: analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel,
      deleteTransaction: false,
      chunks: this.config.geoInfoQueryChunks,
      vars
    };
    if (isStringArray(txIdOrGeocodes)) {
      result.geocodes = txIdOrGeocodes;
    } else {
      result.transactionId = txIdOrGeocodes;
    }
    return result;
  }

  private createVarListItems(audiencesToProcess: Audience[], existingIds: Set<number>, allAudienceMap: Map<number, Audience>, rootIds: Set<number>) : VarListItem[] {
    const additionalAudiences: Audience[] = [];
    const result: VarListItem[] = audiencesToProcess.map(a => {
      let currentListItem: VarListItem;
      if (this.combinedSourceTypes.has(a.audienceSourceType)) {
        if (!isEmpty(a.combinedAudiences)) {
          currentListItem = createCombinedVarListItem(a as AudienceDataDefinition, rootIds.has(Number(a.audienceIdentifier)));
          currentListItem.combineSource.forEach(id => {
            if (!existingIds.has(id)) {
              existingIds.add(id);
              additionalAudiences.push(allAudienceMap.get(id));
            }
          });
        } else if (!isEmpty(a.compositeSource)) {
          currentListItem = createCompositeVarListItem(a as AudienceDataDefinition, rootIds.has(Number(a.audienceIdentifier)));
          currentListItem.compositeSource.forEach(spec => {
            const specId = toNullOrNumber(spec.id);
            if (!existingIds.has(specId)) {
              existingIds.add(specId);
              additionalAudiences.push(allAudienceMap.get(specId));
            }
          });
        }
      } else {
        currentListItem = createAudienceVarListItem(a as AudienceDataDefinition, rootIds.has(Number(a.audienceIdentifier)));
      }
      return currentListItem;
    });
    if (additionalAudiences.length > 0) {
      return [...result, ...this.createVarListItems(additionalAudiences, existingIds, allAudienceMap, rootIds)];
    } else {
      return result;
    }
  }
}
