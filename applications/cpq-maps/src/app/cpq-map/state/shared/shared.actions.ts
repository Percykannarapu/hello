import { Action } from '@ngrx/store';
import { LegendData, ResultType } from '../app.interfaces';
import { MediaPlanPrefPayload } from '../payload-models/MediaPlanPref';
import { MediaPlanPref } from 'src/app/val-modules/mediaexpress/models/MediaPlanPref';

export enum SharedActionTypes {
  SetAppReady = '[Shared Actions] Set App Ready',
  SetIsWrap = '[Shared Actions] Set isWrap',
  SetIsDistrQtyEnabled = '[Shared Actions] Set isDistrQtyEnabled',
  SaveMediaPlan = '[Shared Actions] Save Media Plan',
  SaveSucceeded = '[Shared Actions] Save Succeeded',
  SaveFailed = '[Shared Actions] Save Failed',

  GeneratePdf = '[Shared Actions] Generate Map Pdf',
  GeneratePdfSucceeded = '[Shared Actions] Generate Map Pdf Succeeded',
  GeneratePfdFailed = '[Shared Actions] Generate Map Pdf Failed',

  NavigateToReviewPage = '[Shared Actions] Navigate to Review Page',
  SetLegendData = '[Shared Actions] Set Legend Data',
  SetLegendHTML = '[Shared Actions] Set Legend HTML',
  SetGridSize = '[Shared Actions] set Grid Size'
}

export class SetLegendHTML implements Action {
  readonly type = SharedActionTypes.SetLegendHTML;
  constructor() { }
}

export class SetLegendData implements Action {
  readonly type = SharedActionTypes.SetLegendData;
  constructor(public payload: { legendData: LegendData[], legendTitle: string }) { }
}

export class SetAppReady implements Action {
  readonly type = SharedActionTypes.SetAppReady;
  constructor(public payload: boolean) { }
}

export class SetIsDistrQtyEnabled implements Action {
  readonly type = SharedActionTypes.SetIsDistrQtyEnabled;
  constructor(public payload: { isDistrQtyEnabled: boolean }) { }
}

export class SetIsWrap implements Action {
  readonly type = SharedActionTypes.SetIsWrap;
  constructor(public payload: { isWrap: boolean }) { }
}

export class SaveMediaPlan implements Action {
    readonly type = SharedActionTypes.SaveMediaPlan;
    constructor(public payload: { updateIds: number[], addIds: number[],  mapConfig: MediaPlanPref}) {}
}

export class SaveSucceeded implements Action {
    readonly type = SharedActionTypes.SaveSucceeded;
}

export class SaveFailed implements Action {
    readonly type = SharedActionTypes.SaveFailed;
    constructor(public payload: { err: any }) {}
}

export class NavigateToReviewPage implements Action {
    readonly type = SharedActionTypes.NavigateToReviewPage;
    constructor(public payload: { rfpId: string, mediaPlanGroupNumber: number }) {}
}

export class GeneratePdf implements Action {
  readonly type = SharedActionTypes.GeneratePdf;
}

export class GeneratePfdFailed implements Action {
  readonly type = SharedActionTypes.GeneratePfdFailed;
  constructor(public payload: { err: any }) {}
}

export class GeneratePdfSucceeded implements Action {
  readonly type = SharedActionTypes.GeneratePdfSucceeded;
  constructor(public payload: { response: ResultType }) {}
}

export class SetGridSize implements Action {
  readonly type = SharedActionTypes.SetGridSize;
  constructor(public payload: { gridSize: 'small' | 'large' | 'none' }) { }
}

export type SharedActions =
  SetAppReady
  | SetIsWrap
  | SetIsDistrQtyEnabled
  | SaveMediaPlan
  | SaveSucceeded
  | SaveFailed
  | NavigateToReviewPage
  | SetLegendData
  | SetLegendHTML
  | GeneratePdf
  | GeneratePfdFailed
  | GeneratePdfSucceeded
  | SetGridSize
  ;

