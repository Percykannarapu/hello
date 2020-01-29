import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { groupByExtended } from '@val/common';
import { TargetAudienceService } from '../../services/target-audience.service';
import { FullAppState } from '../../state/app.interfaces';
import { FetchAudienceTradeAreaMap, FetchCustomFromPrefsMap, FetchOfflineTDAMap, FetchOnlineInMarketMap, FetchOnlineInterestMap, FetchOnlinePixelMap, FetchOnlineVLHMap } from '../state/transient/audience/audience.actions';
import { Audience } from '../state/transient/audience/audience.model';

@Injectable({
  providedIn: 'root'
})
export class TransientService {

  constructor(private targetAudienceService: TargetAudienceService,
              private store$: Store<FullAppState>) { }

  dispatchMappedAudienceRequests(audiences: Audience[], transactionId: number, analysisLevel: string) : number {
    console.log('Inside Audience Request Dispatch', audiences);
    const actionsToDispatch = [];
    const audiencesBySource = groupByExtended(audiences, a => this.targetAudienceService.createKey(a.audienceSourceType, a.audienceSourceName));

    // Dispatch a fetch for each audience source
    audiencesBySource.forEach((currentAudiences, source) => {
      const ids = currentAudiences.map(audience => audience.audienceIdentifier);
      const showOnMap = currentAudiences.map(() => true);
      // If the source is from an audience trade area, determine the real source and id
      // if (source === 'Online/Audience-TA' && currentAudiences.length > 0 && currentAudiences[0].audienceTAConfig != null) {
      //   const realAudience = currentAudiences.find(aud => aud.audienceIdentifier === currentAudiences[0].audienceTAConfig.digCategoryId.toString());
      //   if (realAudience != null) {
      //     source = this.targetAudienceService.createKey(realAudience.audienceSourceType, realAudience.audienceSourceName);
      //     ids = [realAudience.audienceIdentifier];
      //     // this.logger.info.log('### FetchMapVar - found real audience for id:', audiences[0].audienceTAConfig.digCategoryId, 'new source is:', source);
      //   }
      // }
      switch (source) {
        case 'Online/Interest':
          actionsToDispatch.push(new FetchOnlineInterestMap({ fuseSource: 'interest', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Online/In-Market':
          actionsToDispatch.push(new FetchOnlineInMarketMap({ fuseSource: 'in_market', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Online/VLH':
          actionsToDispatch.push(new FetchOnlineVLHMap({ fuseSource: 'vlh', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Online/Pixel':
          actionsToDispatch.push(new FetchOnlinePixelMap({ fuseSource: 'pixel', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Offline/TDA':
          actionsToDispatch.push(new FetchOfflineTDAMap({ fuseSource: 'tda', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Online/Audience-TA':
          actionsToDispatch.push(new FetchAudienceTradeAreaMap());
          break;

        default:
          if (source.startsWith('Custom/'))
            actionsToDispatch.push(new FetchCustomFromPrefsMap());
          break;
      }
    });

    actionsToDispatch.forEach(a => this.store$.dispatch(a));
    return actionsToDispatch.length;
  }
}
