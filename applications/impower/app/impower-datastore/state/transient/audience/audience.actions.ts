import { Update } from '@ngrx/entity';
import { Action } from '@ngrx/store';
import { OnlineBulkDataResponse } from 'app/services/target-audience-online.service';
import { OfflineBulkDataResponse } from 'app/services/target-audience-tda.service';
import { GeoVar } from '../geo-vars/geo-vars.model';
import { MapVar } from '../map-vars/map-vars.model';
import { Audience } from './audience.model';
import { Stats } from './audience.reducer';
import { UnifiedResponse, UnifiedBulkResponse } from 'app/services/target-audience-unified.service';

export enum AudienceActionTypes {
  LoadAudiences                      = '[Audience] Load Audiences',
  AddAudience                        = '[Audience] Add Audience',
  UpsertAudience                     = '[Audience] Upsert Audience',
  AddAudiences                       = '[Audience] Add Audiences',
  UpsertAudiences                    = '[Audience] Upsert Audiences',
  UpdateAudience                     = '[Audience] Update Audience',
  UpdateAudiences                    = '[Audience] Update Audiences',
  DeleteAudience                     = '[Audience] Delete Audience',
  DeleteAudiences                    = '[Audience] Delete Audiences',
  ClearAudiences                     = '[Audience] Clear Audiences',

  ApplyAudiences                     = '[Audience] Apply Audiences',
  ApplyAudiencesCompleted            = '[Audience] Apply Audiences Completed',
  ApplyAudiencesRecordStats          = '[Audience] Apply Audiences Record Stats',
  ClearAudienceStats                 = '[Audience] Clear Audience Stats',
  FetchMapVar                        = '[Audience] Fetch Map Variable',
  FetchMapVarCompleted               = '[Audience] Fetch Map Variable Completed',
  FetchAudiences                     = '[Audience] Fetch Audiences',
  FetchAudiencesCompleted            = '[Audience] Fetch Audiences Completed',
  FetchCountIncrement                = '[Audience] Fetch Counter Increment',
  FetchCountDecrement                = '[Audience] Fetch Counter Decrement',
  GetDataFromCache                   = '[Audience] Get Data From Cached Geos',
  GetDataFromGeos                    = '[Audience] Get Data From Geos',
  RehydrateAudiences                 = '[Audience] Rehydrate Audiences',

  FetchAudienceTradeArea             = '[Audience] Fetch Audience: Trade Area',
  FetchOnlineInterest                = '[Audience] Fetch Online Audience: Interest',
  FetchOnlineInMarket                = '[Audience] Fetch Online Audience: In-Market',
  FetchOnlineVLH                     = '[Audience] Fetch Online Audience: VLH',
  FetchOnlinePixel                   = '[Audience] Fetch Online Audience: Pixel',
  FetchOfflineTDA                    = '[Audience] Fetch Offline Audience: TDA',
  FetchCustom                        = '[Audience] Fetch Custom Audience',
  FetchCustomFromPrefs               = '[Audience] Fetch Custom Audience From Project Prefs',
  FetchUnified                       = '[Audience] Fetch Audience : Unified',

  FetchAudienceTradeAreaCompleted    = '[Audience] Fetch Audience: Trade Area Completed',
  FetchOnlineInterestCompleted       = '[Audience] Fetch Online Audience: Interest Completed',
  FetchOnlineInMarketCompleted       = '[Audience] Fetch Online Audience: In-Market Completed',
  FetchOnlineVLHCompleted            = '[Audience] Fetch Online Audience: VLH Completed',
  FetchOnlinePixelCompleted          = '[Audience] Fetch Online Audience: Pixel Completed',
  FetchOfflineTDACompleted           = '[Audience] Fetch Offline Audience: TDA Completed',
  FetchCustomCompleted               = '[Audience] Fetch Custom Audience: Completed',
  FetchUnifiedCompleted              = '[Audience] Fetch Audience : Unified Completed',

  FetchAudienceTradeAreaMap          = '[Audience] Fetch For Map Audience: Trade Area',
  FetchOnlineInterestMap             = '[Audience] Fetch For Map Online Audience: Interest',
  FetchOnlineInMarketMap             = '[Audience] Fetch For Map Online Audience: In-Market',
  FetchOnlineVLHMap                  = '[Audience] Fetch For Map Online Audience: VLH',
  FetchOnlinePixelMap                = '[Audience] Fetch For Map Online Audience: Pixel',
  FetchOfflineTDAMap                 = '[Audience] Fetch For Map Offline Audience: TDA',
  FetchCustomMap                     = '[Audience] Fetch For Map Custom Audience',
  FetchCustomFromPrefsMap            = '[Audience] Fetch For Map Custom Audience From Project Prefs',
  FetchUnifiedMap                    = '[Audience] Fetch For Map Audience : Unified',

  FetchAudienceTradeAreaCompletedMap = '[Audience] Fetch For Map Audience: Trade Area Completed',
  FetchOnlineInterestCompletedMap    = '[Audience] Fetch For Map Online Audience: Interest Completed',
  FetchOnlineInMarketCompletedMap    = '[Audience] Fetch For Map Online Audience: In-Market Completed',
  FetchOnlineVLHCompletedMap         = '[Audience] Fetch For Map Online Audience: VLH Completed',
  FetchOnlinePixelCompletedMap       = '[Audience] Fetch For Map Online Audience: Pixel Completed',
  FetchOfflineTDACompletedMap        = '[Audience] Fetch For Map Offline Audience: TDA Completed',
  FetchCustomCompletedMap            = '[Audience] Fetch For Map Custom Audience: Completed',
  FetchUnifiedCompletedMap           = '[Audience] Fetch For Map Audience : Unified Completed',

  FetchAudienceTradeAreaFailed       = '[Audience] Fetch Audience: Trade Area Failed',
  FetchOnlineFailed                  = '[Audience] Fetch Online Audience Failed',
  FetchOfflineFailed                 = '[Audience] Fetch Offline Audience Failed',
  FetchCustomFailed                  = '[Audience] Fetch Custom Audience Failed',
  FetchAudienceTradeAreaFailedMap    = '[Audience] Fetch For Map Audience: Trade Area Failed',
  FetchOnlineFailedMap               = '[Audience] Fetch For Map Online Audience Failed',
  FetchOfflineFailedMap              = '[Audience] Fetch For Map Offline Audience Failed',
  FetchCustomFailedMap               = '[Audience] Fetch For Map Custom Audience Failed',
  FetchUnifiedFailedMap              = '[Audience] Fetch For Map Audience : Unified Failed',
  FetchUnifiedFailed                 = '[Audience] Fetch Audience : Unified Failed',

  MoveAudienceUp                     = '[Audience] Move audience sequence up',
  MoveAudienceDn                     = '[Audience] Move audience sequence down',
  SelectMappingAudience              = '[Audience] Select audience to shade map',

  SequenceChanged                    = '[Audience] Order of audiences changed'
}

export class LoadAudiences implements Action {
  readonly type = AudienceActionTypes.LoadAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class AddAudience implements Action {
  readonly type = AudienceActionTypes.AddAudience;
  constructor(public payload: { audience: Audience }) {}
}

export class UpsertAudience implements Action {
  readonly type = AudienceActionTypes.UpsertAudience;
  constructor(public payload: { audience: Audience }) {}
}

export class AddAudiences implements Action {
  readonly type = AudienceActionTypes.AddAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class UpsertAudiences implements Action {
  readonly type = AudienceActionTypes.UpsertAudiences;
  constructor(public payload: { audiences: Audience[] }) {}
}

export class UpdateAudience implements Action {
  readonly type = AudienceActionTypes.UpdateAudience;
  constructor(public payload: { audience: Update<Audience> }) {}
}

export class UpdateAudiences implements Action {
  readonly type = AudienceActionTypes.UpdateAudiences;
  constructor(public payload: { audiences: Update<Audience>[] }) {}
}

export class DeleteAudience implements Action {
  readonly type = AudienceActionTypes.DeleteAudience;
  constructor(public payload: { id: string }) {}
}

export class DeleteAudiences implements Action {
  readonly type = AudienceActionTypes.DeleteAudiences;
  constructor(public payload: { ids: string[] }) {}
}

export class ClearAudiences implements Action {
  readonly type = AudienceActionTypes.ClearAudiences;
}

export class ClearAudienceStats implements Action {
  readonly type = AudienceActionTypes.ClearAudienceStats;
}

export class ApplyAudiences implements Action {
  readonly type = AudienceActionTypes.ApplyAudiences;
  constructor(public payload: {analysisLevel: string}) {}
}

export class ApplyAudiencesCompleted implements Action {
  readonly type = AudienceActionTypes.ApplyAudiencesCompleted;
}

export class ApplyAudiencesRecordStats implements Action {
  readonly type = AudienceActionTypes.ApplyAudiencesRecordStats;
  constructor(public payload: {stats: Stats }) {}
}

export class FetchMapVar implements Action {
  readonly type = AudienceActionTypes.FetchMapVar;
  constructor(public payload: {analysisLevel: string, geos: string[]}) {}
}

export class FetchMapVarCompleted implements Action {
  readonly type = AudienceActionTypes.FetchMapVarCompleted;
  constructor(public payload: { transactionId: number }) {}
}

export class FetchAudiences implements Action {
  readonly type = AudienceActionTypes.FetchAudiences;
  constructor(public payload: {analysisLevel: string, geos: string[]}) {}
}

export class FetchCountIncrement implements Action {
  readonly type = AudienceActionTypes.FetchCountIncrement;
}

export class FetchCountDecrement implements Action {
  readonly type = AudienceActionTypes.FetchCountDecrement;
}

export class FetchAudienceTradeArea implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeArea;
}

export class FetchOnlineInterest implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInterest;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlineInMarket implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInMarket;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlineVLH implements Action {
  readonly type = AudienceActionTypes.FetchOnlineVLH;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlinePixel implements Action {
  readonly type = AudienceActionTypes.FetchOnlinePixel;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOfflineTDA implements Action {
  readonly type = AudienceActionTypes.FetchOfflineTDA;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchCustom implements Action {
  readonly type = AudienceActionTypes.FetchCustom;
  constructor(public payload: {dataBuffer: string, fileName: string}) {}
}

export class FetchCustomFromPrefs implements Action {
  readonly type = AudienceActionTypes.FetchCustomFromPrefs;
}

export class FetchUnified implements Action {
  readonly type = AudienceActionTypes.FetchUnified;
  constructor(public payload: {fuseSource: string, audienceList: Audience[], al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchAudienceTradeAreaCompleted implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeAreaCompleted;
  constructor(public payload: {source: string, startTime: number, response: GeoVar[]}) {}
}

export class FetchOnlineInterestCompleted implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInterestCompleted;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlineInMarketCompleted implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInMarketCompleted;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlineVLHCompleted implements Action {
  readonly type = AudienceActionTypes.FetchOnlineVLHCompleted;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlinePixelCompleted implements Action {
  readonly type = AudienceActionTypes.FetchOnlinePixelCompleted;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOfflineTDACompleted implements Action {
  readonly type = AudienceActionTypes.FetchOfflineTDACompleted;
  constructor(public payload: {source: string, startTime: number, response: OfflineBulkDataResponse[]}) {}
}

export class FetchCustomCompleted implements Action {
  readonly type = AudienceActionTypes.FetchCustomCompleted;
  constructor(public payload: {source: string, startTime: number, response: GeoVar[]}) {}
}

export class FetchUnifiedCompleted implements Action {
  readonly type = AudienceActionTypes.FetchUnifiedCompleted;
  constructor(public payload: {source: string, startTime: number, response: UnifiedBulkResponse[]}) {}
}

export class FetchAudienceTradeAreaMap implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeAreaMap;
}

export class FetchOnlineInterestMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInterestMap;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlineInMarketMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInMarketMap;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlineVLHMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineVLHMap;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOnlinePixelMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlinePixelMap;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchOfflineTDAMap implements Action {
  readonly type = AudienceActionTypes.FetchOfflineTDAMap;
  constructor(public payload: {fuseSource: string, al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchCustomMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomMap;
  constructor(public payload: {dataBuffer: string, fileName: string}) {}
}

export class FetchCustomFromPrefsMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomFromPrefsMap;
  constructor(public payload: {geocodes: Set<string>}) {}
}

export class FetchUnifiedMap implements Action {
  readonly type = AudienceActionTypes.FetchUnifiedMap;
  constructor(public payload: {fuseSource: string, audienceList: Audience[], al: string, showOnMap: boolean[], ids: string[], geos: string[], transactionId?: number}) {}
}

export class FetchAudienceTradeAreaCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeAreaCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: MapVar[], transactionId: number }) {}
}

export class FetchOnlineInterestCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInterestCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[], transactionId: number }) {}
}

export class FetchOnlineInMarketCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInMarketCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[], transactionId: number }) {}
}

export class FetchOnlineVLHCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineVLHCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[], transactionId: number }) {}
}

export class FetchOnlinePixelCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlinePixelCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[], transactionId: number }) {}
}

export class FetchOfflineTDACompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOfflineTDACompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OfflineBulkDataResponse[], transactionId: number }) {}
}

export class FetchCustomCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: GeoVar[], transactionId: number }) {}
}

export class FetchUnifiedCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchUnifiedCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: UnifiedBulkResponse[], transactionId: number }) {}
}

export class FetchAudienceTradeAreaFailed implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeAreaFailed;
  constructor(public payload: { err: any }) {}
}

export class FetchOnlineFailed implements Action {
  readonly type = AudienceActionTypes.FetchOnlineFailed;
  constructor(public payload: { err: any }) {}
}

export class FetchOfflineFailed implements Action {
  readonly type = AudienceActionTypes.FetchOfflineFailed;
  constructor(public payload: { err: any }) {}
}

export class FetchCustomFailed implements Action {
  readonly type = AudienceActionTypes.FetchCustomFailed;
  constructor(public payload: { err: any }) {}
}

export class FetchUnifiedFailed implements Action {
  readonly type = AudienceActionTypes.FetchUnifiedFailed;
  constructor(public payload: { err: any }) {}
}


export class FetchAudienceTradeAreaFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchAudienceTradeAreaFailedMap;
  constructor(public payload: { err: any, transactionId: number  }) {}
}

export class FetchOnlineFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineFailedMap;
  constructor(public payload: { err: any, transactionId: number  }) {}
}

export class FetchOfflineFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchOfflineFailedMap;
  constructor(public payload: { err: any, transactionId: number  }) {}
}

export class FetchCustomFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomFailedMap;
  constructor(public payload: { err: any, transactionId: number  }) {}
}

export class FetchUnifiedFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchUnifiedFailedMap;
  constructor(public payload: { err: any, transactionId: number  }) {}
}

export class FetchAudiencesCompleted implements Action {
  readonly type = AudienceActionTypes.FetchAudiencesCompleted;
}

export class GetDataFromCache implements Action {
  readonly type = AudienceActionTypes.GetDataFromCache;
  constructor(public payload: {analysisLevel: string, selectedAudiences: Audience[], transactionId: number, txStartTime: number}) {}
}

export class GetDataFromGeos implements Action {
  readonly type = AudienceActionTypes.GetDataFromGeos;
  constructor(public payload: {analysisLevel: string, selectedAudiences: Audience[], geos: string[]}) {}
}

type RehydratePayload = { notifyLoadSuccess: false } | { notifyLoadSuccess: true, projectId: number, isReload: boolean };
export class RehydrateAudiences implements Action {
  readonly type = AudienceActionTypes.RehydrateAudiences;
  constructor(public payload: RehydratePayload = { notifyLoadSuccess: false }) {}
}

export class MoveAudienceUp implements Action {
  readonly type = AudienceActionTypes.MoveAudienceUp;
  constructor(public payload: {audienceIdentifier: string}) {}
}

export class MoveAudienceDn implements Action {
  readonly type = AudienceActionTypes.MoveAudienceDn;
  constructor(public payload: {audienceIdentifier: string}) {}
}

export class SequenceChanged implements Action {
  readonly type = AudienceActionTypes.SequenceChanged;
}

export class SelectMappingAudience implements Action {
  readonly type = AudienceActionTypes.SelectMappingAudience;
  constructor(public payload: {audienceIdentifier: string, isActive: boolean}) {}
}

export type AudienceActions =
    LoadAudiences
  | AddAudience
  | UpsertAudience
  | AddAudiences
  | UpsertAudiences
  | UpdateAudience
  | UpdateAudiences
  | DeleteAudience
  | DeleteAudiences
  | ClearAudiences
  | ApplyAudiences
  | ApplyAudiencesCompleted
  | ApplyAudiencesRecordStats
  | ClearAudienceStats
  | RehydrateAudiences
  | FetchMapVar
  | FetchMapVarCompleted
  | FetchAudiences
  | FetchCountIncrement
  | FetchCountDecrement
  | FetchAudienceTradeArea
  | FetchOnlineInterest
  | FetchOnlineInMarket
  | FetchOnlineVLH
  | FetchOnlinePixel
  | FetchOfflineTDA
  | FetchCustom
  | FetchCustomFromPrefs
  | FetchUnified
  | FetchAudienceTradeAreaCompleted
  | FetchOnlineInterestCompleted
  | FetchOnlineInMarketCompleted
  | FetchOnlineVLHCompleted
  | FetchOnlinePixelCompleted
  | FetchOfflineTDACompleted
  | FetchCustomCompleted
  | FetchUnifiedCompleted
  | FetchAudienceTradeAreaMap
  | FetchOnlineInterestMap
  | FetchOnlineInMarketMap
  | FetchOnlineVLHMap
  | FetchOnlinePixelMap
  | FetchOfflineTDAMap
  | FetchCustomMap
  | FetchCustomFromPrefsMap
  | FetchUnifiedMap
  | FetchAudienceTradeAreaCompletedMap
  | FetchOnlineInterestCompletedMap
  | FetchOnlineInMarketCompletedMap
  | FetchOnlineVLHCompletedMap
  | FetchOnlinePixelCompletedMap
  | FetchOfflineTDACompletedMap
  | FetchCustomCompletedMap
  | FetchUnifiedCompletedMap
  | FetchAudienceTradeAreaFailed
  | FetchOnlineFailed
  | FetchOfflineFailed
  | FetchCustomFailed
  | FetchUnifiedFailed
  | FetchAudienceTradeAreaFailedMap
  | FetchOnlineFailedMap
  | FetchOfflineFailedMap
  | FetchCustomFailedMap
  | FetchUnifiedFailedMap
  | FetchAudiencesCompleted
  | GetDataFromCache
  | GetDataFromGeos
  | MoveAudienceUp
  | MoveAudienceDn
  | SequenceChanged
  | SelectMappingAudience;

export type MapFetchCompleteActions =
  FetchAudienceTradeAreaCompletedMap
  | FetchOnlineInterestCompletedMap
  | FetchOnlineInMarketCompletedMap
  | FetchOnlineVLHCompletedMap
  | FetchOnlinePixelCompletedMap
  | FetchOfflineTDACompletedMap
  | FetchCustomCompletedMap
  | FetchUnifiedCompletedMap
  | FetchAudienceTradeAreaFailedMap
  | FetchOnlineFailedMap
  | FetchOfflineFailedMap
  | FetchCustomFailedMap
  | FetchUnifiedFailedMap;
