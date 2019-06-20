import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { Audience } from './audience.model';
import { OnlineBulkDataResponse } from 'app/services/target-audience-online.service';
import { OfflineBulkDataResponse } from 'app/services/target-audience-tda.service';
import { GeoVar } from '../geo-vars/geo-vars.model';
import { Stats } from './audience.reducer';

export enum AudienceActionTypes {
  LoadAudiences                   = '[Audience] Load Audiences',
  AddAudience                     = '[Audience] Add Audience',
  UpsertAudience                  = '[Audience] Upsert Audience',
  AddAudiences                    = '[Audience] Add Audiences',
  UpsertAudiences                 = '[Audience] Upsert Audiences',
  UpdateAudience                  = '[Audience] Update Audience',
  UpdateAudiences                 = '[Audience] Update Audiences',
  DeleteAudience                  = '[Audience] Delete Audience',
  DeleteAudiences                 = '[Audience] Delete Audiences',
  ClearAudiences                  = '[Audience] Clear Audiences',

  ApplyAudiences                  = '[Audience] Apply Audiences',
  ApplyAudiencesCompleted         = '[Audience] Apply Audiences Completed',
  ApplyAudiencesRecordStart       = '[Audience] Apply Audiences Record Start',
  ApplyAudiencesRecordStats       = '[Audience] Apply Audiences Record Stats',
  ClearAudienceStats              = '[Audience] Clear Audience Stats',
  FetchMapVar                     = '[Audience] Fetch Map Variable',
  FetchMapVarCompleted            = '[Audience] Fetch Map Variable Completed',
  FetchAudiences                  = '[Audience] Fetch Audiences',
  FetchAudiencesCompleted         = '[Audience] Fetch Audiences Completed',
  FetchCountIncrement             = '[Audience] Fetch Counter Increment',
  FetchCountDecrement             = '[Audience] Fetch Counter Decrement',
  GetDataFromCache                = '[Audience] Get Data From Cached Geos',
  GetDataFromGeos                 = '[Audience] Get Data From Geos',
  RehydrateAudiences              = '[Audience] Rehydrate Audiences',

  FetchOnlineInterest             = '[Audience] Fetch Online Audience: Interest',
  FetchOnlineInMarket             = '[Audience] Fetch Online Audience: In-Market',
  FetchOnlineVLH                  = '[Audience] Fetch Online Audience: VLH',
  FetchOnlinePixel                = '[Audience] Fetch Online Audience: Pixel',
  FetchOfflineTDA                 = '[Audience] Fetch Offline Audience: TDA',
  FetchCustom                     = '[Audience] Fetch Custom Audience',
  FetchCustomFromPrefs            = '[Audience] Fetch Custom Audience From Project Prefs',

  FetchOnlineInterestCompleted    = '[Audience] Fetch Online Audience: Interest Completed',
  FetchOnlineInMarketCompleted    = '[Audience] Fetch Online Audience: In-Market Completed',
  FetchOnlineVLHCompleted         = '[Audience] Fetch Online Audience: VLH Completed',
  FetchOnlinePixelCompleted       = '[Audience] Fetch Online Audience: Pixel Completed',
  FetchOfflineTDACompleted        = '[Audience] Fetch Offline Audience: TDA Completed',
  FetchCustomCompleted            = '[Audience] Fetch Custom Audience: Completed',

  FetchOnlineInterestMap          = '[Audience] Fetch For Map Online Audience: Interest',
  FetchOnlineInMarketMap          = '[Audience] Fetch For Map Online Audience: In-Market',
  FetchOnlineVLHMap               = '[Audience] Fetch For Map Online Audience: VLH',
  FetchOnlinePixelMap             = '[Audience] Fetch For Map Online Audience: Pixel',
  FetchOfflineTDAMap              = '[Audience] Fetch For Map Offline Audience: TDA',
  FetchCustomMap                  = '[Audience] Fetch For Map Custom Audience',
  FetchCustomFromPrefsMap         = '[Audience] Fetch For Map Custom Audience From Project Prefs',

  FetchOnlineInterestCompletedMap = '[Audience] Fetch For Map Online Audience: Interest Completed',
  FetchOnlineInMarketCompletedMap = '[Audience] Fetch For Map Online Audience: In-Market Completed',
  FetchOnlineVLHCompletedMap      = '[Audience] Fetch For Map Online Audience: VLH Completed',
  FetchOnlinePixelCompletedMap    = '[Audience] Fetch For Map Online Audience: Pixel Completed',
  FetchOfflineTDACompletedMap     = '[Audience] Fetch For Map Offline Audience: TDA Completed',
  FetchCustomCompletedMap         = '[Audience] Fetch For Map Custom Audience: Completed',

  FetchOnlineFailed               = '[Audience] Fetch Online Audience Failed',
  FetchOfflineFailed              = '[Audience] Fetch Offline Audience Failed',
  FetchCustomFailed               = '[Audience] Fetch Custom Audience Failed',
  FetchOnlineFailedMap            = '[Audience] Fetch For Map Online Audience Failed',
  FetchOfflineFailedMap           = '[Audience] Fetch For Map Offline Audience Failed',
  FetchCustomFailedMap            = '[Audience] Fetch For Map Custom Audience Failed',

  MoveAudienceUp                  = '[Audience] Move audience sequence up',
  MoveAudienceDn                  = '[Audience] Move audience sequence down',

  SequenceChanged                 = '[Audience] Order of audiences changed'
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

export class ApplyAudiencesRecordStart implements Action {
  readonly type = AudienceActionTypes.ApplyAudiencesRecordStart;
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
}

export class FetchOnlineInterestCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInterestCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlineInMarketCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineInMarketCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlineVLHCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineVLHCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOnlinePixelCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlinePixelCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OnlineBulkDataResponse[]}) {}
}

export class FetchOfflineTDACompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchOfflineTDACompletedMap;
  constructor(public payload: {source: string, startTime: number, response: OfflineBulkDataResponse[]}) {}
}

export class FetchCustomCompletedMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomCompletedMap;
  constructor(public payload: {source: string, startTime: number, response: GeoVar[]}) {}
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

export class FetchOnlineFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchOnlineFailedMap;
  constructor(public payload: { err: any }) {}
}

export class FetchOfflineFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchOfflineFailedMap;
  constructor(public payload: { err: any }) {}
}

export class FetchCustomFailedMap implements Action {
  readonly type = AudienceActionTypes.FetchCustomFailedMap;
  constructor(public payload: { err: any }) {}
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

export class RehydrateAudiences implements Action {
  readonly type = AudienceActionTypes.RehydrateAudiences;
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
  | ApplyAudiencesRecordStart
  | ApplyAudiencesRecordStats
  | ClearAudienceStats
  | RehydrateAudiences
  | FetchMapVar
  | FetchMapVarCompleted
  | FetchAudiences
  | FetchCountIncrement
  | FetchCountDecrement
  | FetchOnlineInterest
  | FetchOnlineInMarket
  | FetchOnlineVLH
  | FetchOnlinePixel
  | FetchOfflineTDA
  | FetchCustom
  | FetchCustomFromPrefs
  | FetchOnlineInterestCompleted
  | FetchOnlineInMarketCompleted
  | FetchOnlineVLHCompleted
  | FetchOnlinePixelCompleted
  | FetchOfflineTDACompleted
  | FetchCustomCompleted
  | FetchOnlineInterestMap
  | FetchOnlineInMarketMap
  | FetchOnlineVLHMap
  | FetchOnlinePixelMap
  | FetchOfflineTDAMap
  | FetchCustomMap
  | FetchCustomFromPrefsMap
  | FetchOnlineInterestCompletedMap
  | FetchOnlineInMarketCompletedMap
  | FetchOnlineVLHCompletedMap
  | FetchOnlinePixelCompletedMap
  | FetchOfflineTDACompletedMap
  | FetchCustomCompletedMap
  | FetchOnlineFailed
  | FetchOfflineFailed
  | FetchCustomFailed
  | FetchOnlineFailedMap
  | FetchOfflineFailedMap
  | FetchCustomFailedMap
  | FetchAudiencesCompleted
  | GetDataFromCache
  | GetDataFromGeos
  | MoveAudienceUp
  | MoveAudienceDn
  | SequenceChanged;