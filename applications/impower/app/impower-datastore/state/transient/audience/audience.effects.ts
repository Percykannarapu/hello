import {getMapVarIds} from '../map-vars/map-vars.selectors';
import { AppStateService } from './../../../../services/app-state.service';
import { TargetAudienceCustomService } from './../../../../services/target-audience-custom.service';
import { OfflineSourceTypes } from './../../../../services/target-audience-tda.service';
import { GeoVarActionTypes, GeoVarCacheGeosFailure, GeoVarCacheGeosComplete, GeoVarCacheGeofootprintGeos } from './../geo-vars/geo-vars.actions';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { Injectable } from '@angular/core';
import { Update } from '@ngrx/entity';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { map, tap, withLatestFrom, switchMap, mergeMap, concatMap, catchError, take, filter } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { of, EMPTY } from 'rxjs';
import { UpsertGeoVars } from '../geo-vars/geo-vars.actions';
import {groupByExtended, formatMilli, dedupeSimpleSet} from '@val/common';
import { GeoVar } from '../geo-vars/geo-vars.model';
import { TargetAudienceOnlineService, OnlineSourceTypes } from 'app/services/target-audience-online.service';
import { AppConfig } from 'app/app.config';
import { LoggingService } from 'app/val-modules/common/services/logging.service';
import { TargetAudienceTdaService } from 'app/services/target-audience-tda.service';
import { RemoveGeoCache } from '../transient.actions';
import { MapVarCacheGeos, MapVarCacheGeosFailure, MapVarCacheGeosComplete, MapVarActionTypes, UpsertMapVars, ClearMapVars } from '../map-vars/map-vars.actions';
import { Audience } from './audience.model';
import { MapVar } from '../map-vars/map-vars.model';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { AudienceActionTypes, ApplyAudiences, AudienceActions, FetchOnlineInterest, FetchOnlinePixel, FetchOnlineVLH, FetchOfflineTDA, FetchOnlineInMarket, AddAudience, FetchOnlineInterestCompleted, FetchOnlineInMarketCompleted,
         FetchOnlinePixelCompleted, FetchOnlineVLHCompleted, FetchOfflineTDACompletedMap, FetchOnlineFailed, FetchCountIncrement, FetchCountDecrement, ApplyAudiencesCompleted, FetchOfflineTDACompleted, FetchOfflineFailed,
         FetchCustom, FetchCustomCompleted, FetchCustomFromPrefs, FetchCustomFailed, FetchMapVar, FetchOnlineInterestMap, FetchOnlineVLHMap, FetchOnlinePixelMap, FetchOfflineTDAMap, FetchCustomFromPrefsMap, FetchOnlineInMarketMap,
         FetchOnlineInterestCompletedMap, FetchOnlineInMarketCompletedMap, FetchOnlinePixelCompletedMap, FetchOnlineVLHCompletedMap, FetchOnlineFailedMap, FetchOfflineFailedMap, FetchCustomCompletedMap, FetchCustomFailedMap,
         MoveAudienceUp, UpsertAudiences, MoveAudienceDn, SequenceChanged, ApplyAudiencesRecordStats, RehydrateAudiences, FetchAudienceTradeArea, FetchAudienceTradeAreaCompleted, FetchAudienceTradeAreaFailed, FetchAudienceTradeAreaMap,
         FetchAudienceTradeAreaCompletedMap, FetchAudienceTradeAreaFailedMap, RehydrateShading, SelectMappingAudience, UpdateAudiences} from './audience.actions';
import { Stats, initialStatState } from './audience.reducer';
import { TargetAudienceAudienceTA } from 'app/services/target-audience-audienceta';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import * as fromGeoVarSelectors from 'app/impower-datastore/state/transient/geo-vars/geo-vars.selectors';

const audienceTaKey: string = 'AUDIENCE_TA_VARS';
const shadingKey: string = 'SHADING_DATA';

let stats: Stats = initialStatState;
let applyStart: number = null;
let applyStop: number = null;
let audTAStop: number = null;
let mapVarsStart: number = null;

@Injectable()
export class AudiencesEffects {

  // This effect is here to latch into the existing code until it can all be sourced from the store
  @Effect({dispatch: false})
  addAudience$ = this.actions$.pipe(
    ofType<AddAudience>(AudienceActionTypes.AddAudience),
    map(action => this.targetAudienceService.addAudience(action.payload.audience, null, false))
  );

  @Effect({dispatch: false})
  applyAudiences$ = this.actions$.pipe(
    ofType<ApplyAudiences>(AudienceActionTypes.ApplyAudiences),
    map(action => ({ analysisLevel: action.payload.analysisLevel })),
    tap(action => stats = {...initialStatState}),
    tap(action => applyStart = performance.now()),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.getAudiencesAppliable))),
    tap(([action, audiences]) => {
      //audiences.forEach(aud => console.log('### ApplyAudiences - applying:', aud));
      if (audiences.length > 0)
        this.store$.dispatch(new GeoVarCacheGeofootprintGeos());
    }),
    switchMap(([action, selectedAudiences]) => this.actions$.pipe(
        ofType<GeoVarCacheGeosComplete | GeoVarCacheGeosFailure>(GeoVarActionTypes.GeoVarCacheGeosComplete, GeoVarActionTypes.GeoVarCacheGeosFailure),
        take(1),
        tap(errorAction => (errorAction.type === GeoVarActionTypes.GeoVarCacheGeosFailure) ? this.logger.error.log('applyAudiences detected CacheGeosFailure:', errorAction.payload) : null),
        filter(filterAction => filterAction.type === GeoVarActionTypes.GeoVarCacheGeosComplete),
        //tap(payload => console.log('### applyAudiences detected CacheGeosComplete - payload:', payload, 'action:', action, 'audiences:', selectedAudiences)),
        tap((subAction) => {
          const transactionId: number = (subAction.type === GeoVarActionTypes.GeoVarCacheGeosComplete) ? subAction.payload.transactionId : null;
          const audiencesBySource = groupByExtended(selectedAudiences, a => this.targetAudienceService.createKey(a.audienceSourceType, a.audienceSourceName));

          // Dispatch a fetch for each audience source
          audiencesBySource.forEach((audiences, source) => {
            const ids = audiences.map(audience => audience.audienceIdentifier);
            const showOnMap = audiences.map(audience => audience.showOnMap);
            switch (source) {
              case 'Online/Interest':
                this.store$.dispatch(new FetchOnlineInterest({ fuseSource: 'interest', al: action.analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/In-Market':
                this.store$.dispatch(new FetchOnlineInterest({ fuseSource: 'in_market', al: action.analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/VLH':
                this.store$.dispatch(new FetchOnlineVLH({ fuseSource: 'vlh', al: action.analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/Pixel':
                this.store$.dispatch(new FetchOnlinePixel({ fuseSource: 'pixel', al: action.analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Offline/TDA':
                this.store$.dispatch(new FetchOfflineTDA({ fuseSource: 'tda', al: action.analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              default:
                if (source.startsWith('Custom/'))
                  this.store$.dispatch(new FetchCustomFromPrefs());
                break;
            }
          });
        })
    ))
//  publishReplay(1),
//  refCount();       // Keeps track of all of the subscribers and tells publishReply to clean itself up
  );

  @Effect()
  applyAudiencesCompleted$ = this.actions$.pipe(
    ofType<ApplyAudiencesCompleted>(AudienceActionTypes.ApplyAudiencesCompleted),
    withLatestFrom(this.store$.pipe(select(fromGeoVarSelectors.getTransactionId)),
                   this.store$.pipe(select(fromGeoVarSelectors.getGeoVarCount))),
    map(([action, transactionId, geoVarCount]) => {
      console.log('### apply audiences applyStart:', applyStart, ', applyStop:', applyStop, ' stop-start:', applyStop - applyStart, ', formatted:', formatMilli(applyStop - applyStart));
      if (mapVarsStart <= 0) {
        stats.totalGeoVarTime = formatMilli(performance.now() - applyStart);
        this.logger.info.log('*** Apply Audiences Completed in', stats.totalGeoVarTime, '***');
      }
      else
      {
        stats.totalMapVarTime = formatMilli(performance.now() - mapVarsStart);
        mapVarsStart = 0;
        this.logger.info.log('*** Apply Shading Completed in', stats.totalMapVarTime, '***');
      }
      stats.totalGeoVars = geoVarCount;
      this.store$.dispatch(new ApplyAudiencesRecordStats({ stats: stats }));
      return new RemoveGeoCache({ transactionId: transactionId });
    })
  );

  @Effect({dispatch: false})
  fetchMapVar$ = this.actions$.pipe(
    ofType<FetchMapVar>(AudienceActionTypes.FetchMapVar),
    //tap(action => this.logger.info.log('### fetchMapVar - geos(' + action.payload.geos.length + '):', action.payload.geos)),
    withLatestFrom(this.store$.select(getMapVarIds)),
    map(([action, existingGeos]) => [action, dedupeSimpleSet(new Set(action.payload.geos), new Set(existingGeos as string[]))] as [FetchMapVar, Set<string>]),
    filter(([, geos]) => geos.size > 0),
    tap(() => {
      mapVarsStart = performance.now();
      stats.totalMapVars = 0;
      this.store$.dispatch(new StartBusyIndicator({key: shadingKey, message: 'Retrieving shading data'}));
    }),
    tap(([, newGeos]) => this.store$.dispatch(new MapVarCacheGeos({ geocodes: newGeos }))),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.getAudiencesOnMap)),
                   this.store$.pipe(select(fromAudienceSelectors.allAudiences))),
    switchMap(([[action, newGeos], selectedAudiences, allAudiences]) => this.actions$.pipe(
      ofType<MapVarCacheGeosComplete | MapVarCacheGeosFailure>(MapVarActionTypes.MapVarCacheGeosComplete, MapVarActionTypes.MapVarCacheGeosFailure),
        take(1),
        tap(errorAction => { if (errorAction.type === MapVarActionTypes.MapVarCacheGeosFailure) {
          this.logger.error.log('fetchMapVar detected MapVarCacheGeosFailure:', errorAction.payload);
          this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
        }}),
        filter(filterAction => filterAction.type === MapVarActionTypes.MapVarCacheGeosComplete),
        //tap(payload => this.logger.info.log('### fetchMapVar detected MapVarCacheGeosComplete - payload:', payload, 'action:', action, 'audiences:', selectedAudiences)),
        tap((subAction) => {
          const transactionId: number = (subAction.type === MapVarActionTypes.MapVarCacheGeosComplete) ? subAction.payload.transactionId : null;
          // this.logger.info.log('### FetchMapVar subAction response:', transactionId, 'action:', action, 'audiences:', selectedAudiences);
          const audiencesBySource = groupByExtended(selectedAudiences, a => this.targetAudienceService.createKey(a.audienceSourceType, a.audienceSourceName));
          const analysisLevel = action.payload.analysisLevel;

          // Dispatch a fetch for each audience source
          audiencesBySource.forEach((audiences, source) => {
            const ids = audiences.map(audience => audience.audienceIdentifier);
            const showOnMap = audiences.map(audience => audience.showOnMap);
            // this.logger.info.log('### FetchMapVar fetching source:', source);
/*          // If the source is from an audience trade area, determine the real source and id
            if (source === 'Online/Audience-TA' && audiences.length > 0 && audiences[0].audienceTAConfig != null) {
              const realAudience = allAudiences.find(aud => aud.audienceIdentifier === audiences[0].audienceTAConfig.digCategoryId.toString());
              if (realAudience != null) {
                source = this.targetAudienceService.createKey(realAudience.audienceSourceType, realAudience.audienceSourceName);
                ids = [realAudience.audienceIdentifier];
             // this.logger.info.log('### FetchMapVar - found real audience for id:', audiences[0].audienceTAConfig.digCategoryId, 'new source is:', source);
              }
            }*/
            switch (source) {
              case 'Online/Interest':
                this.store$.dispatch(new FetchOnlineInterestMap({ fuseSource: 'interest', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/In-Market':
                this.store$.dispatch(new FetchOnlineInMarketMap({ fuseSource: 'in_market', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/VLH':
                this.store$.dispatch(new FetchOnlineVLHMap({ fuseSource: 'vlh', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/Pixel':
                this.store$.dispatch(new FetchOnlinePixelMap({ fuseSource: 'pixel', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Offline/TDA':
                this.store$.dispatch(new FetchOfflineTDAMap({ fuseSource: 'tda', al: analysisLevel, showOnMap: showOnMap, ids: ids, geos: null, transactionId: transactionId }));
                break;

              case 'Online/Audience-TA':
                this.store$.dispatch(new FetchAudienceTradeAreaMap());
                break;

              default:
                if (source.startsWith('Custom/'))
                  this.store$.dispatch(new FetchCustomFromPrefsMap());
                break;
            }
          });
        })
    ))
//  publishReplay(1),
//  refCount();       // Keeps track of all of the subscribers and tells publishReply to clean itself up
  );

  @Effect({dispatch: false})
  fetchCountDecrement$ = this.actions$.pipe(
    ofType<FetchCountDecrement>(AudienceActionTypes.FetchCountDecrement),
    concatMap(action => of(action).pipe(withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.getOutstandingVarFetches))))),
    map(([action, numFetches]) => {
      if (numFetches <= 0)
        this.store$.dispatch(new ApplyAudiencesCompleted());
    })
  );

  @Effect()
  fetchOnlineVariables$ = this.actions$.pipe(
    ofType<FetchOnlineInterest    | FetchOnlineInMarket    |FetchOnlinePixel    | FetchOnlineVLH |
           FetchOnlineInterestMap | FetchOnlineInMarketMap |FetchOnlinePixelMap | FetchOnlineVLHMap>
          (AudienceActionTypes.FetchOnlineInterest, AudienceActionTypes.FetchOnlineInMarket,
           AudienceActionTypes.FetchOnlinePixel, AudienceActionTypes.FetchOnlineVLH,
           AudienceActionTypes.FetchOnlineInterestMap, AudienceActionTypes.FetchOnlineInMarketMap,
           AudienceActionTypes.FetchOnlinePixelMap, AudienceActionTypes.FetchOnlineVLHMap),
    // Filter out any invalid actions
    filter(action => action.payload != null),
    // Apply transformations to action payload
    map(action => ({
      type: action.type,
      geoType: action.payload.al,
      fuseSource: action.payload.fuseSource,
      source: (action.payload.fuseSource === 'interest') ? OnlineSourceTypes.Interest : (action.payload.fuseSource === 'in_market') ? OnlineSourceTypes.InMarket
            : (action.payload.fuseSource === 'vlh') ? OnlineSourceTypes.VLH : (action.payload.fuseSource === 'pixel') ? OnlineSourceTypes.Pixel : null,
      al: action.payload.al,
      geocodes: action.payload.geos,
      ids: action.payload.ids,
      transactionId: action.payload.transactionId,
      isForShading: action.payload.showOnMap
    })),
    // mergeMap to watch for completes on all active fetches
    mergeMap((params) => {
      this.store$.dispatch(new FetchCountIncrement()); // Count all out going fetches to know when all have completed
      const refreshStart = performance.now();
      return this.targetAudienceOnlineService.onlineVarRefresh(params.source, params.al, params.ids, params.geocodes, params.isForShading, params.transactionId)
        .pipe(
          map((onlineBulkDataResponse) => {
            switch (params.type) {
              case AudienceActionTypes.FetchOnlineInterest:
                return new FetchOnlineInterestCompleted({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlineInMarket:
                return new FetchOnlineInMarketCompleted({  source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlineVLH:
                return new FetchOnlineVLHCompleted({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlinePixel:
                return new FetchOnlinePixelCompleted({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlineInterestMap:
                return new FetchOnlineInterestCompletedMap({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlineInMarketMap:
                return new FetchOnlineInMarketCompletedMap({  source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlineVLHMap:
                return new FetchOnlineVLHCompletedMap({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });

              case AudienceActionTypes.FetchOnlinePixelMap:
                return new FetchOnlinePixelCompletedMap({ source: params.source, startTime: refreshStart, response: onlineBulkDataResponse });
            }
          }),
          catchError(err => of(params.isForShading ? new FetchOnlineFailedMap({ err })
                                                   : new FetchOnlineFailed({ err })))
        );
    }),
  );

  @Effect()
  fetchOnlineVariablesCompleted$ = this.actions$.pipe(
    ofType<FetchOnlineInterestCompleted | FetchOnlineInMarketCompleted |FetchOnlinePixelCompleted | FetchOnlineVLHCompleted>
          (AudienceActionTypes.FetchOnlineInterestCompleted, AudienceActionTypes.FetchOnlineInMarketCompleted,
           AudienceActionTypes.FetchOnlinePixelCompleted, AudienceActionTypes.FetchOnlineVLHCompleted),
    tap(action => {
      this.logger.info.log(`Retrieved`, action.payload.response.length, `geo vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime));
      stats.fetchTimes[action.payload.source] = formatMilli(performance.now() - action.payload.startTime);
    }),
    map(bulkResponse => {
      const geoVars: GeoVar[] = bulkResponse.payload.response.filter(data => data != null)
        .map(responseRow => {
          // Convert response into an array of GeoVars
          const gv = { geocode: responseRow.geocode };
          const score = (responseRow.dmaScore != null) ? responseRow.dmaScore : responseRow.nationalScore;
          gv[responseRow.digCategoryId] = isNaN(score as any) ? score : Number(score);
          return gv;
        });
      applyStop = performance.now();
      stats.counts[bulkResponse.payload.source] = geoVars.length;
      this.store$.dispatch(new FetchCountDecrement());
      return new UpsertGeoVars({ geoVars: geoVars});
    })
  );

  @Effect()
  fetchOnlineVariablesCompletedMap$ = this.actions$.pipe(
    ofType<FetchOnlineInterestCompletedMap | FetchOnlineInMarketCompletedMap |FetchOnlinePixelCompletedMap | FetchOnlineVLHCompletedMap>
          (AudienceActionTypes.FetchOnlineInterestCompletedMap, AudienceActionTypes.FetchOnlineInMarketCompletedMap,
           AudienceActionTypes.FetchOnlinePixelCompletedMap, AudienceActionTypes.FetchOnlineVLHCompletedMap),
    tap(action => this.logger.info.log(`Retrieved`, action.payload.response.length, `map vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime))),
    map(bulkResponse => {
      const mapVars: MapVar[] = bulkResponse.payload.response.filter(data => data != null)
        .map(responseRow => {
          // Convert response into an array of MapVars
          const mv = { geocode: responseRow.geocode };
          const score = (responseRow.dmaScore != null) ? responseRow.dmaScore : responseRow.nationalScore;
          mv[responseRow.digCategoryId] = isNaN(score as any) ? score : Number(score);
          return mv;
        });
      stats.totalMapVars += mapVars.length;
      this.store$.dispatch(new FetchCountDecrement());
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
      return new UpsertMapVars({ mapVars: mapVars});
    })
  );

  @Effect()
  fetchOnlineFailed$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchOnlineFailed),
    tap(err => console.error('Error loading audience:', err)),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchOnlineFailedMap$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchOnlineFailedMap),
    tap(err => {
      console.error('Error loading audience for shading:', err);
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
    }),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchOfflineVariables$ = this.actions$.pipe(
    ofType<FetchOfflineTDA | FetchOfflineTDAMap>(AudienceActionTypes.FetchOfflineTDA, AudienceActionTypes.FetchOfflineTDAMap),
    map(action => ({
      actionType: action.type,
      geoType: action.payload.al,
      fuseSource: action.payload.fuseSource,
      source: (action.payload.fuseSource === 'tda') ? OfflineSourceTypes.TDA : null,
      al: action.payload.al,
      geocodes: action.payload.geos,
      ids: action.payload.ids.map(id => id.toString()),
      transactionId: action.payload.transactionId,
      isForShading: action.payload.showOnMap,
      chunks: this.config.geoInfoQueryChunks
    })),
    // mergeMap to watch for completes on all active fetches
    mergeMap((params) => {
      this.store$.dispatch(new FetchCountIncrement()); // Count all out going fetches to know when all have completed
      const refreshStart = performance.now();
      return this.targetAudienceTdaService.offlineVarRefresh(params.source, params.al, params.ids, params.geocodes, params.isForShading, params.transactionId)
        .pipe(
          //tap(response => console.log('### TDA service responded with:', response, 'params.source:', params.source, 'params:', params)),
          map((offlineBulkDataResponse) => {
            switch (params.source) {
              case OfflineSourceTypes.TDA:
                return params.actionType === AudienceActionTypes.FetchOfflineTDAMap
                       ? new FetchOfflineTDACompletedMap({ source: params.source, startTime: refreshStart, response: offlineBulkDataResponse })
                       : new FetchOfflineTDACompleted({ source: params.source, startTime: refreshStart, response: offlineBulkDataResponse });

              default:
                console.warn('Offline Variable Refresh had an invalid source:', params.source);
                return EMPTY;
            }
          }),
          catchError(err => of(params.actionType === AudienceActionTypes.FetchOfflineTDAMap
                               ? new FetchOfflineFailedMap({ err })
                               : new FetchOfflineFailed({ err })))
        );
    }),
  );

  @Effect()
  fetchOfflineVariablesCompleted$ = this.actions$.pipe(
    ofType<FetchOfflineTDACompleted> (AudienceActionTypes.FetchOfflineTDACompleted),
    tap(action => {
      this.logger.info.log(`Retrieved`, action.payload.response.length, `geo vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime));
      stats.fetchTimes[action.payload.source] = formatMilli(performance.now() - action.payload.startTime);
    }),
    map(bulkResponse => {
        const geoVars: GeoVar[] = bulkResponse.payload.response.filter(data => data != null)
        .map(responseRow => {
          // Convert response into an array of GeoVars
          const gv = { geocode: responseRow.geocode };
          gv[responseRow.id] = isNaN(responseRow.score as any) ? responseRow.score : Number(responseRow.score);
          return gv;
        });
      applyStop = performance.now();
      stats.counts[bulkResponse.payload.source] = geoVars.length;
      this.store$.dispatch(new FetchCountDecrement());

      return new UpsertGeoVars({ geoVars: geoVars});
    })
  );

  @Effect()
  fetchOfflineTDACompletedMap$ = this.actions$.pipe(
    ofType<FetchOfflineTDACompletedMap> (AudienceActionTypes.FetchOfflineTDACompletedMap),
    tap(action => this.logger.info.log(`Retrieved`, action.payload.response.length, `map vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime))),
    map(bulkResponse => {
      const mapVars: MapVar[] = bulkResponse.payload.response.filter(data => data != null)
        .map(responseRow => {
          // Convert response into an array of MapVars
          const gv = { geocode: responseRow.geocode };
          gv[responseRow.id] = isNaN(responseRow.score as any) ? responseRow.score : Number(responseRow.score);
          return gv;
        });
      stats.totalMapVars += mapVars.length;
      this.store$.dispatch(new FetchCountDecrement());
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
      return new UpsertMapVars({ mapVars: mapVars});
    })
  );

  @Effect()
  fetchOfflineFailed$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchOfflineFailed),
    tap(err => console.error('Error loading offline audience:', err)),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchOfflineFailedMap$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchOfflineFailedMap),
    tap(err => {
      console.error('Error loading offline audience:', err);
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
    }),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchAudienceTradeArea$ = this.actions$.pipe(
    ofType<FetchAudienceTradeArea | FetchAudienceTradeAreaMap>(AudienceActionTypes.FetchAudienceTradeArea, AudienceActionTypes.FetchAudienceTradeAreaMap),
    tap(action => this.store$.dispatch(new StartBusyIndicator({ key: audienceTaKey, message: 'Retrieving audience trade area data' }))),
    map(action => ({
      actionType: action.type,
      source: 'audience-ta',
      forShading: (action.type === AudienceActionTypes.FetchAudienceTradeAreaMap)
    })),
    // mergeMap to watch for completes on all active fetches
    withLatestFrom(this.store$.select(fromAudienceSelectors.getAudiencesOnMap)),
    mergeMap(([params, audiencesOnMap]) => {
      this.store$.dispatch(new FetchCountIncrement()); // Count all out going fetches to know when all have completed
      const refreshStart = performance.now();
      return this.targetAudienceAudienceTA.fetchAudienceTradeArea(params.forShading)
        .pipe(
          tap(response => this.logger.debug.log('Audience TA service responded with:', response, 'params.source:', params.source, 'params:', params)),
          map((geoVars) => {
            //this.logger.debug.log('fetchAudienceTradeArea effect - geoVars:', geoVars);
            if (geoVars != null && geoVars.length > 0)
              return params.actionType === AudienceActionTypes.FetchAudienceTradeArea
                     ? new FetchAudienceTradeAreaCompleted({ source: params.source, startTime: refreshStart, response: geoVars })
                     : new FetchAudienceTradeAreaCompletedMap({ source: params.source, startTime: refreshStart, response: geoVars });
            else
              return params.actionType === AudienceActionTypes.FetchAudienceTradeArea
                     ? new FetchAudienceTradeAreaFailed({ err: 'No audience trade area variables were retrieved' })
                     : new FetchAudienceTradeAreaFailedMap({ err: 'No audience trade area map variables were retrieved' });
          }),
          catchError(err => of(params.actionType === AudienceActionTypes.FetchAudienceTradeArea
                              ? new FetchAudienceTradeAreaFailed({ err })
                              : new FetchAudienceTradeAreaFailedMap({ err })))
        );
    }),
  );

  @Effect()
  fetchAudienceTradeAreaCompleted$ = this.actions$.pipe(
    ofType<FetchAudienceTradeAreaCompleted | FetchAudienceTradeAreaCompletedMap> (AudienceActionTypes.FetchAudienceTradeAreaCompleted, AudienceActionTypes.FetchAudienceTradeAreaCompletedMap),
    tap(action => {
      audTAStop = performance.now();
      this.logger.info.log(`Retrieved`, action.payload.response.length, `geo vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime));
      stats.fetchTimes[action.payload.source] = formatMilli(performance.now() - action.payload.startTime);
    }),
    map(response => {
      stats.counts[response.payload.source] = response.payload.response.length;
      this.store$.dispatch(new FetchCountDecrement());
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));

      if (response.type === AudienceActionTypes.FetchAudienceTradeAreaCompleted) {
        stats.totalAudTATime = formatMilli(audTAStop - response.payload.startTime);
        stats.totalGeoVars = response.payload.response.length;
        this.store$.dispatch(new ApplyAudiencesRecordStats({ stats: stats }));  // REVIEW This is going to clobber other stats
        // response.payload.response.sort((a, b) => parseInt(a.geocode, 10) - parseInt(b.geocode, 10))
        //    .forEach(geoVar => { if (['48081', '48089', '48123', '48151', '48153', '49510', '49514'].includes(geoVar.geocode)) console.log('### fetchTA Complete geoVar:', geoVar); });
        return new UpsertGeoVars({ geoVars: response.payload.response});
      }
      else {
        stats.totalAudTATime = formatMilli(audTAStop - response.payload.startTime);
        stats.totalMapVars = response.payload.response.length;
        this.store$.dispatch(new ApplyAudiencesRecordStats({ stats: stats }));  // REVIEW This is going to clobber other stats
        return new UpsertMapVars({ mapVars: response.payload.response});
      }
    }),
    tap(action => this.store$.dispatch(new StopBusyIndicator({ key: audienceTaKey })))
  );

  @Effect()
  fetchAudienceTradeAreaFailed$ = this.actions$.pipe(
    ofType<FetchAudienceTradeAreaFailed | FetchAudienceTradeAreaFailedMap>(AudienceActionTypes.FetchAudienceTradeAreaFailed, AudienceActionTypes.FetchAudienceTradeAreaFailedMap),
    tap(err => {
      console.error('Error loading audience trade area', err);
      this.store$.dispatch(new StopBusyIndicator({key: audienceTaKey}));
    }),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchCustomVariables$ = this.actions$.pipe(
    ofType<FetchCustom>(AudienceActionTypes.FetchCustom),
    map(action => {
      const refreshStart = performance.now();
      try {
        const geoVars = this.targetAudienceCustomService.parseCustomVarData(action.payload.dataBuffer, action.payload.fileName);
        if (geoVars != null)
          return new FetchCustomCompleted({ source: 'custom', startTime: refreshStart, response: geoVars });
        else
          return new FetchCustomFailed({ err: 'No custom vars were created' });
      }
      catch (e) {
        return new FetchCustomFailed({ err: e });
      }
    })
  );

  @Effect()
  fetchCustomFromPrefs$ = this.actions$.pipe(
    ofType<FetchCustomFromPrefs>(AudienceActionTypes.FetchCustomFromPrefs),
    map(action => {
      this.store$.dispatch(new FetchCountIncrement());
      const refreshStart = performance.now();
      const geoVars = this.targetAudienceCustomService.reloadVarsFromPrefs();
      if (geoVars != null)
        return new FetchCustomCompleted({ source: 'custom', startTime: refreshStart, response: geoVars });
      else
        return new FetchCustomFailed({ err: 'No custom vars were created from project prefs' });
    })
  );

  @Effect()
  fetchCustomFromPrefsMap$ = this.actions$.pipe(
    ofType<FetchCustomFromPrefsMap>(AudienceActionTypes.FetchCustomFromPrefsMap),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.getAudiencesOnMap))),
    map(([action, selectedAudiences]) => {
      this.store$.dispatch(new FetchCountIncrement());
      const refreshStart = performance.now();
      const mapVars = this.targetAudienceCustomService.reloadMapVarFromPrefs(selectedAudiences[0].audienceName, selectedAudiences[0].audienceIdentifier);
      //console.log('### fetchCustomFromPrefsMap - fired - mapVars:', mapVars, 'audiences:', selectedAudiences);
      if (mapVars != null)
        return new FetchCustomCompletedMap({ source: 'custom', startTime: refreshStart, response: mapVars });
      else
        return new FetchCustomFailedMap({ err: 'No custom map vars were created from project prefs' });
    })
  );

  @Effect()
  fetchCustomVariablesCompleted$ = this.actions$.pipe(
    ofType<FetchCustomCompleted> (AudienceActionTypes.FetchCustomCompleted),
    tap(action => {
      this.logger.info.log(`Retrieved`, action.payload.response.length, `geo vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime));
      stats.fetchTimes[action.payload.source] = formatMilli(performance.now() - action.payload.startTime);
    }),
    map(bulkResponse => {
      this.store$.dispatch(new FetchCountDecrement());
      const geoVars = bulkResponse.payload.response.filter(data => data != null);
      let count = 0;
      for (let i = 0; i < geoVars.length; i++)
        for (const [field, ] of Object.entries(geoVars[i]))
          if (field !== 'geocode')
            count++;
      applyStop = performance.now();
      stats.counts[bulkResponse.payload.source] = count;
      return new UpsertGeoVars({ geoVars: bulkResponse.payload.response.filter(data => data != null)});
    })
  );

  @Effect()
  fetchCustomVariablesCompletedMap$ = this.actions$.pipe(
    ofType<FetchCustomCompletedMap> (AudienceActionTypes.FetchCustomCompletedMap),
    tap(action => this.logger.info.log(`Retrieved`, action.payload.response.length, `map vars for "${action.payload.source}" in`, formatMilli(performance.now() - action.payload.startTime))),
    map(bulkResponse => {
      this.store$.dispatch(new FetchCountDecrement());
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
      const mapVars = bulkResponse.payload.response.filter(data => data != null);
      stats.totalMapVars += mapVars.length;
      return new UpsertMapVars({ mapVars: mapVars});
    })
  );

  @Effect()
  fetchCustomFailed$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchCustomFailed),
    tap(err => console.error('Error loading custom variables:', err)),
    map(action => new FetchCountDecrement())
  );

  @Effect()
  fetchCustomFailedMap$ = this.actions$.pipe(
    ofType(AudienceActionTypes.FetchCustomFailedMap),
    tap(err => {
      console.error('Error loading custom variables:', err);
      this.store$.dispatch(new StopBusyIndicator({key: shadingKey}));
    }),
    map(action => new FetchCountDecrement())
  );

  @Effect({dispatch: false})
  moveAudienceUp$ = this.actions$.pipe(
    ofType<MoveAudienceUp>(AudienceActionTypes.MoveAudienceUp),
    map(action => action.payload.audienceIdentifier),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.allAudiences))),
    map(([id, allAudiences]) => {
      const moveAudIndex = allAudiences.findIndex(aud => aud.audienceIdentifier === id);
      if (moveAudIndex > 0) {
        const audience = allAudiences[moveAudIndex];
        const swapAudience = allAudiences[moveAudIndex - 1];
        if (audience != null && swapAudience != null) {
          const oldSeq = audience.seq;
          audience.seq = swapAudience.seq;
          swapAudience.seq = oldSeq;
          this.store$.dispatch(new UpsertAudiences({ audiences: [audience, swapAudience] }));
          this.store$.dispatch(new SequenceChanged());
        }
      }
    })
  );

  @Effect({dispatch: false})
  moveAudienceDn$ = this.actions$.pipe(
    ofType<MoveAudienceDn>(AudienceActionTypes.MoveAudienceDn),
    map(action => action.payload.audienceIdentifier),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.allAudiences))),
    map(([id, allAudiences]) => {
      const moveAudIndex = allAudiences.findIndex(aud => aud.audienceIdentifier === id);
      if (moveAudIndex < allAudiences.length) {
        const audience = allAudiences[moveAudIndex];
        const swapAudience = allAudiences[moveAudIndex + 1];
        if (audience != null && swapAudience != null) {
          const oldSeq = audience.seq;
          audience.seq = swapAudience.seq;
          swapAudience.seq = oldSeq;
          this.store$.dispatch(new UpsertAudiences({ audiences: [audience, swapAudience] }));
          this.store$.dispatch(new SequenceChanged());
        }
      }
    })
  );

  @Effect({dispatch: false})
  sequenceChanged$ = this.actions$.pipe(
    ofType<SequenceChanged>(AudienceActionTypes.SequenceChanged),
    withLatestFrom(this.store$.pipe(select(fromAudienceSelectors.allAudiences))),
    map(([, allAudiences]) => {
      this.targetAudienceService.syncProjectVarOrder();
    })
  );

  @Effect()
  rehydrateAudiences$ = this.actions$.pipe(
    ofType<RehydrateAudiences>(AudienceActionTypes.RehydrateAudiences),
    tap(() => {
      this.targetAudienceOnlineService.rehydrateAudience();
      this.targetAudienceTdaService.rehydrateAudience();
      this.targetAudienceCustomService.rehydrateAudience();
      this.targetAudienceAudienceTA.rehydrateAudience();
    }),
    withLatestFrom(this.appStateService.analysisLevel$),
//  map(([, analysisLevel]) => new ApplyAudiences({ analysisLevel: analysisLevel }))
    concatMap(([, analysisLevel]) => [
      new ApplyAudiences({ analysisLevel: analysisLevel }),
      new RehydrateShading()
    ])
  );

  @Effect({dispatch: false})
  rehydrateShading$ = this.actions$.pipe(
    ofType<RehydrateShading>(AudienceActionTypes.RehydrateShading),
    tap(action => mapVarsStart = performance.now()),
    withLatestFrom(this.store$.select(fromAudienceSelectors.getAudiencesOnMap)),
    map(([, audiencesOnMap]) => {
      //console.log('### rehydrateShading - audiencesOnMap:', audiencesOnMap);
      this.targetAudienceService.rehydrateShading();
    })
  );

  @Effect()
  selectMappingAudience$ = this.actions$.pipe(
    ofType<SelectMappingAudience>(AudienceActionTypes.SelectMappingAudience),
    map(action => action.payload),
    withLatestFrom(this.store$.select(fromAudienceSelectors.getAllAudiences)),
    concatMap(([payload, allAudiences]) => {
      const updates: Update<Audience>[] = [];
      allAudiences.forEach(aud => updates.push({ id: aud.audienceIdentifier,
                                            changes: { showOnMap: aud.audienceIdentifier === payload.audienceIdentifier ? payload.isActive : false }}));
      return [new UpdateAudiences({ audiences: updates }),
              new RehydrateShading()];
    })
  );

  constructor(private actions$: Actions<AudienceActions>,
              private store$: Store<FullAppState>,
              private config: AppConfig,
              private logger: LoggingService,
              private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private targetAudienceOnlineService: TargetAudienceOnlineService,
              private targetAudienceTdaService: TargetAudienceTdaService,
              private targetAudienceCustomService: TargetAudienceCustomService,
              private targetAudienceAudienceTA: TargetAudienceAudienceTA) {}
}
