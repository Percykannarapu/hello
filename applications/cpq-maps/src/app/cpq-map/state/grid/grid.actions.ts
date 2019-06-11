import { Action } from '@ngrx/store';

export enum GridActionTypes {
  GridGeoToggle = '[Grid Actions] Toggle Geo through Grid',
}

export class GridGeoToggle implements Action {
  readonly type = GridActionTypes.GridGeoToggle;
  constructor(public payload: { geocode: string }) {}
}

export type GridActions = GridGeoToggle;
