import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { groupByExtended } from '@val/common';
import { TargetAudienceService } from '../../services/target-audience.service';
import { FullAppState } from '../../state/app.interfaces';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import {
  FetchCustomFromPrefsMap,
  FetchOfflineTDAMap,
  FetchOnlineInMarketMap,
  FetchOnlineInterestMap,
  FetchOnlinePixelMap,
  FetchOnlineVLHMap,
  FetchUnifiedMap
} from '../state/transient/audience/audience.actions';
import { Audience } from '../state/transient/audience/audience.model';

@Injectable({
  providedIn: 'root'
})
export class TransientService {

  constructor(private targetAudienceService: TargetAudienceService,
              private logger: LoggingService,
              private store$: Store<FullAppState>) { }

  dispatchMappedAudienceRequests(audiences: Audience[], transactionId: number, analysisLevel: string, geocodes: Set<string>) : number {
    this.logger.debug.log('Inside Audience Request Dispatch', audiences);
    const actionsToDispatch = [];
    const audiencesBySource = groupByExtended(audiences, a => this.targetAudienceService.createKey(a.audienceSourceType, a.audienceSourceName));

    // Dispatch a fetch for each audience source
    audiencesBySource.forEach((currentAudiences, source) => {
      const ids = currentAudiences.map(audience => audience.audienceIdentifier);
      const showOnMap = currentAudiences.map(() => false);
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

        case 'Combined/Converted/TDA':
          actionsToDispatch.push(new FetchUnifiedMap({ fuseSource: 'combine', audienceList: currentAudiences, al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Combined/TDA':
          actionsToDispatch.push(new FetchUnifiedMap({ fuseSource: 'combine', audienceList: currentAudiences, al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;

        case 'Converted/TDA':
          actionsToDispatch.push(new FetchUnifiedMap({ fuseSource: 'composite', audienceList: currentAudiences, al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
          break;
        case 'Composite/TDA':
            actionsToDispatch.push(new FetchUnifiedMap({ fuseSource: 'composite', audienceList: currentAudiences, al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
            break;
        default:
          if (source.startsWith('Custom/'))
            actionsToDispatch.push(new FetchCustomFromPrefsMap({ geocodes }));
          break;
      }
    });

    actionsToDispatch.forEach(a => this.store$.dispatch(a));
    return actionsToDispatch.length;
  }
}
