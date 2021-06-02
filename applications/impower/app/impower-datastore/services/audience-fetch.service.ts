import { Injectable } from '@angular/core';
import { convertKeys, isEmpty, mapByExtended } from '@val/common';
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

public getCachedAudienceData(audiences: Audience[], allAudiences: Audience[], analysisLevel: string, txId: number) : Observable<DynamicVariable[]> {
    if(txId != null && !isEmpty(audiences)){
     const requestPayload = this.convertAudiencesToUnifiedPayload(audiences, allAudiences, analysisLevel, txId);
      return this.restService.post<UnifiedResponse>(this.config.serviceUrlFragments.unifiedAudienceUrl, [requestPayload]).pipe(
        map(response => response.payload),
        tap(payload => {
          if (!isEmpty(payload?.issues?.ERROR)) this.notificationService.showErrorNotification(payload.issues.ERROR.join('\n'));
          if (!isEmpty(payload?.issues?.WARN)) this.notificationService.showWarningNotification(payload.issues.WARN.join('\n'));
        }),
        map(payload => payload.rows.map(r => ({ geocode: r.geocode, ...convertKeys(r.variables, k => k.split('_')[0]) })))
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
            if (!existingIds.has(spec.id)) {
              existingIds.add(spec.id);
              additionalAudiences.push(allAudienceMap.get(spec.id));
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
