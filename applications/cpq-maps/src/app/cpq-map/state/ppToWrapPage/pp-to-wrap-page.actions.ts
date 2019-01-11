import { Action } from '@ngrx/store';
import { Update } from '@ngrx/entity';
import { PpToWrapPage } from '../../../val-modules/mediaexpress/models/PpToWrapPage';

export enum PpToWrapPageActionTypes {
  LoadPpToWrapPages = '[PpToWrapPage] Load PpToWrapPages',
  AddPpToWrapPage = '[PpToWrapPage] Add PpToWrapPage',
  UpsertPpToWrapPage = '[PpToWrapPage] Upsert PpToWrapPage',
  AddPpToWrapPages = '[PpToWrapPage] Add PpToWrapPages',
  UpsertPpToWrapPages = '[PpToWrapPage] Upsert PpToWrapPages',
  UpdatePpToWrapPage = '[PpToWrapPage] Update PpToWrapPage',
  UpdatePpToWrapPages = '[PpToWrapPage] Update PpToWrapPages',
  DeletePpToWrapPage = '[PpToWrapPage] Delete PpToWrapPage',
  DeletePpToWrapPages = '[PpToWrapPage] Delete PpToWrapPages',
  ClearPpToWrapPages = '[PpToWrapPage] Clear PpToWrapPages'
}

export class LoadPpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.LoadPpToWrapPages;

  constructor(public payload: { ppToWrapPages: PpToWrapPage[] }) {}
}

export class AddPpToWrapPage implements Action {
  readonly type = PpToWrapPageActionTypes.AddPpToWrapPage;

  constructor(public payload: { ppToWrapPage: PpToWrapPage }) {}
}

export class UpsertPpToWrapPage implements Action {
  readonly type = PpToWrapPageActionTypes.UpsertPpToWrapPage;

  constructor(public payload: { ppToWrapPage: PpToWrapPage }) {}
}

export class AddPpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.AddPpToWrapPages;

  constructor(public payload: { ppToWrapPages: PpToWrapPage[] }) {}
}

export class UpsertPpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.UpsertPpToWrapPages;

  constructor(public payload: { ppToWrapPages: PpToWrapPage[] }) {}
}

export class UpdatePpToWrapPage implements Action {
  readonly type = PpToWrapPageActionTypes.UpdatePpToWrapPage;

  constructor(public payload: { ppToWrapPage: Update<PpToWrapPage> }) {}
}

export class UpdatePpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.UpdatePpToWrapPages;

  constructor(public payload: { ppToWrapPages: Update<PpToWrapPage>[] }) {}
}

export class DeletePpToWrapPage implements Action {
  readonly type = PpToWrapPageActionTypes.DeletePpToWrapPage;

  constructor(public payload: { id: string }) {}
}

export class DeletePpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.DeletePpToWrapPages;

  constructor(public payload: { ids: string[] }) {}
}

export class ClearPpToWrapPages implements Action {
  readonly type = PpToWrapPageActionTypes.ClearPpToWrapPages;
}

export type PpToWrapPageActions =
 LoadPpToWrapPages
 | AddPpToWrapPage
 | UpsertPpToWrapPage
 | AddPpToWrapPages
 | UpsertPpToWrapPages
 | UpdatePpToWrapPage
 | UpdatePpToWrapPages
 | DeletePpToWrapPage
 | DeletePpToWrapPages
 | ClearPpToWrapPages;
