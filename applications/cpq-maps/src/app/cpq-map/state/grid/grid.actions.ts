import { Action } from '@ngrx/store';

export enum GridActionTypes {
 // GridGeoToggle = '[Grid Actions] Toggle Geo through Grid',
  GridGeosToggle = '[Grid Actions] Toggle Geos through Grid', 
}



export class GridGeosToggle implements Action {
  readonly type = GridActionTypes.GridGeosToggle;
  constructor(public payload: { geos: string[] }) {}
}

export type GridActions = GridGeosToggle;
