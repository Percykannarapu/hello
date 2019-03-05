import { Action } from '@ngrx/store';
import { NormalizedPayload } from '../../models/NormalizedPayload';


export enum SharedActionTypes {
  SetGroupId = '[Shared Actions] Set Media Plan Group ID',
  SetAppReady = '[Shared Actions] Set App Ready',
  LoadEntityGraph = '[Shared Actions] Load Entity Graph',
  EntitiesLoading = '[Shared Actions] Entities Loading',
  RfpUiEditLoaded = '[Shared Actions] RfpUiEdit Loaded',
  RfpUiEditWrapLoaded = '[Shared Actions] RfpUiEditWrap Loaded',
  RfpUiEditDetailLoaded = '[Shared Actions] RfpUiEditDetail Loaded',
  RfpUiReviewLoaded = '[Shared Actions] RfpUiReview Loaded',
  SetActiveMediaPlanId = '[Shared Actions] Set Active Media Plan',
  SetRadius = '[Shared Actions] Set Radius',
  SetAnalysisLevel = '[Shared Actions] Set Analysis Level',
  SetIsWrap = '[Shared Actions] Set isWrap',
  SetIsDistrQtyEnabled = '[Shared Actions] Set isDistrQtyEnabled'
}

export class SetIsDistrQtyEnabled implements Action {
  readonly type = SharedActionTypes.SetIsDistrQtyEnabled;
  constructor(public payload: { isDistrQtyEnabled: boolean }) { }
}

export class RfpUiEditWrapLoaded implements Action {
  readonly type = SharedActionTypes.RfpUiEditWrapLoaded;
  constructor(public payload: { rfpUiEditWrapLoaded: boolean }) { }
}

export class SetIsWrap implements Action {
  readonly type = SharedActionTypes.SetIsWrap;
  constructor(public payload: { isWrap: boolean }) { }
}

export class SetAnalysisLevel implements Action {
  readonly type = SharedActionTypes.SetAnalysisLevel;
  constructor(public payload: { analysisLevel: string }) { }
}

export class SetRadius implements Action {
  readonly type = SharedActionTypes.SetRadius;
  constructor(public payload: { radius: number }) { }
}

export class SetActiveMediaPlanId implements Action {
  readonly type = SharedActionTypes.SetActiveMediaPlanId;
  constructor(public payload: { mediaPlanId: number }) { }
}

export class RfpUiEditLoaded implements Action {
  readonly type = SharedActionTypes.RfpUiEditLoaded;
  constructor(public payload: { rfpUiEditLoaded: boolean }) { }
}

export class RfpUiEditDetailLoaded implements Action {
  readonly type = SharedActionTypes.RfpUiEditDetailLoaded;
  constructor(public payload: { rfpUiEditDetailLoaded: boolean }) { }
}

export class RfpUiReviewLoaded implements Action {
  readonly type = SharedActionTypes.RfpUiReviewLoaded;
  constructor(public payload: { rfpUiReviewLoaded: boolean }) { }
}

export class EntitiesLoading implements Action {
  readonly type = SharedActionTypes.EntitiesLoading;
  constructor(public payload: { entitiesLoading: boolean }) { }
}

export class LoadEntityGraph implements Action {
  readonly type = SharedActionTypes.LoadEntityGraph;
  constructor(public payload: { normalizedEntities: NormalizedPayload }) { }
}

export class SetGroupId implements Action {
  readonly type = SharedActionTypes.SetGroupId;
  constructor(public payload: number) { }
}

export class SetAppReady implements Action {
  readonly type = SharedActionTypes.SetAppReady;
  constructor(public payload: boolean) { }
}

export type SharedActions =
  SetGroupId
  | SetAppReady
  | LoadEntityGraph
  | EntitiesLoading
  | RfpUiEditLoaded
  | RfpUiEditWrapLoaded
  | RfpUiEditDetailLoaded
  | RfpUiReviewLoaded
  | SetActiveMediaPlanId
  | SetRadius
  | SetAnalysisLevel
  | SetIsWrap
  | SetIsDistrQtyEnabled
  ;