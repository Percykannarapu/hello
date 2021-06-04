import { Injectable } from '@angular/core';
import { convertKeys, isEmpty, mapByExtended, toNullOrNumber } from '@val/common';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AudienceDataDefinition, UnifiedPayload, UnifiedResponse, VarListItem } from '../../models/audience-data.model';
import { createAudienceVarListItem, createCombinedVarListItem, createCompositeVarListItem } from '../../models/audience-factories';
import { AppMessagingService } from '../../services/app-messaging.service';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { Audience } from '../state/transient/audience/audience.model';
import { DynamicVariable } from '../state/transient/dynamic-variable.model';

@Injectable({
  providedIn: 'root'
})
export class AudienceFetchService {

  private combinedSourceTypes = new Set(['Combined', 'Converted', 'Combined/Converted', 'Composite']);

  constructor(private config: AppConfig,
              private notificationService: AppMessagingService,
              private restService: RestDataService) { }

  public getCachedAudienceData(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txId: number, silent: boolean) : Observable<DynamicVariable[]> {
    if (txId != null && !isEmpty(audiences)) {
      const requestPayload = this.convertAudiencesToUnifiedPayload(audiences, allAudiences, analysisLevel, txId);
      return this.restService.post<UnifiedResponse>(this.config.serviceUrlFragments.unifiedAudienceUrl, [requestPayload]).pipe(
        map(response => response.payload),
        tap(payload => {
          let notify = false;
          if (!isEmpty(payload?.issues?.ERROR)) {
            console.groupCollapsed('%cAdditional Audience Fetch Error Info', 'color: red');
            console.error(payload.issues.ERROR);
            console.groupEnd();
            notify = true;
          }
          if (!isEmpty(payload?.issues?.WARN)) {
            console.groupCollapsed('%cAdditional Audience Fetch Error Info', 'color: yellow');
            console.warn(payload.issues.WARN);
            console.groupEnd();
            notify = true;
          }
          if (notify && !silent) {
            this.notificationService.showWarningNotification('There was an issue pulling audience data, please check your grid to ensure it has all the data you need.');
          }
        }),
        map(payload => payload.rows.map(r => ({geocode: r.geocode, ...convertKeys(r.variables, k => k.split('_')[0])})))
      );
    } else {
      return of([]);
    }
  }

  private convertAudiencesToUnifiedPayload(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txId: number) : UnifiedPayload {
    const existingIds = new Set<number>(audiences.map(a => Number(a.audienceIdentifier)));
    const rootIds = new Set<number>(existingIds);
    const allAudienceMap = mapByExtended(allAudiences, (a) => Number(a.audienceIdentifier));
    const vars = this.createVarListItems(audiences, existingIds, allAudienceMap, rootIds);
    return {
      geoType: analysisLevel === 'Digital ATZ' ? 'DTZ' : analysisLevel,
      transactionId: txId,
      deleteTransaction: false,
      chunks: this.config.geoInfoQueryChunks,
      vars
    };
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
