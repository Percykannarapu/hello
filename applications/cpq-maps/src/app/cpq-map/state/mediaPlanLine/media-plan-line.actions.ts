import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { MediaPlanLine } from '../../../val-modules/mediaexpress/models/MediaPlanLine';

export enum MediaPlanLineActionTypes {
  LoadMediaPlanLines = '[MediaPlanLine] Load MediaPlanLines',
  AddMediaPlanLine = '[MediaPlanLine] Add MediaPlanLine',
  UpsertMediaPlanLine = '[MediaPlanLine] Upsert MediaPlanLine',
  AddMediaPlanLines = '[MediaPlanLine] Add MediaPlanLines',
  UpsertMediaPlanLines = '[MediaPlanLine] Upsert MediaPlanLines',
  UpdateMediaPlanLine = '[MediaPlanLine] Update MediaPlanLine',
  UpdateMediaPlanLines = '[MediaPlanLine] Update MediaPlanLines',
  DeleteMediaPlanLine = '[MediaPlanLine] Delete MediaPlanLine',
  DeleteMediaPlanLines = '[MediaPlanLine] Delete MediaPlanLines',
  ClearMediaPlanLines = '[MediaPlanLine] Clear MediaPlanLines'
}

export class LoadMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.LoadMediaPlanLines;

  constructor(public payload: { mediaPlanLines: MediaPlanLine[] }) {}
}

export class AddMediaPlanLine implements Action {
  readonly type = MediaPlanLineActionTypes.AddMediaPlanLine;

  constructor(public payload: { mediaPlanLine: MediaPlanLine }) {}
}

export class UpsertMediaPlanLine implements Action {
  readonly type = MediaPlanLineActionTypes.UpsertMediaPlanLine;

  constructor(public payload: { mediaPlanLine: MediaPlanLine }) {}
}

export class AddMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.AddMediaPlanLines;

  constructor(public payload: { mediaPlanLines: MediaPlanLine[] }) {}
}

export class UpsertMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.UpsertMediaPlanLines;

  constructor(public payload: { mediaPlanLines: MediaPlanLine[] }) {}
}

export class UpdateMediaPlanLine implements Action {
  readonly type = MediaPlanLineActionTypes.UpdateMediaPlanLine;

  constructor(public payload: { mediaPlanLine: Update<MediaPlanLine> }) {}
}

export class UpdateMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.UpdateMediaPlanLines;

  constructor(public payload: { mediaPlanLines: Update<MediaPlanLine>[] }) {}
}

export class DeleteMediaPlanLine implements Action {
  readonly type = MediaPlanLineActionTypes.DeleteMediaPlanLine;

  constructor(public payload: { id: string }) {}
}

export class DeleteMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.DeleteMediaPlanLines;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearMediaPlanLines implements Action {
  readonly type = MediaPlanLineActionTypes.ClearMediaPlanLines;
}

export type MediaPlanLineActions =
 LoadMediaPlanLines
 | AddMediaPlanLine
 | UpsertMediaPlanLine
 | AddMediaPlanLines
 | UpsertMediaPlanLines
 | UpdateMediaPlanLine
 | UpdateMediaPlanLines
 | DeleteMediaPlanLine
 | DeleteMediaPlanLines
 | ClearMediaPlanLines;
