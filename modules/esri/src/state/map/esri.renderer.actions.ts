import { Action } from '@ngrx/store';
import { Statistics, ShadingData, HighlightMode } from './esri.renderer.reducer';

export enum EsriRendererActionTypes {
  SetShadingData = '[Esri Renderer] Set Shading Data',
  ClearShadingData = '[Esri Renderer] Clear Shading Data',

  SetSelectedGeos = '[Esri Renderer] Set Selected Geos',
  ClearSelectedGeos = '[Esri Renderer] Clear Selected Geos',
  SetHighlightOptions = '[Esri Renderer] Set highlight options',
}

export class SetHighlightOptions implements Action {
  readonly type = EsriRendererActionTypes.SetHighlightOptions;
  constructor(public payload: { higlightMode: HighlightMode, layerGroup: string, layer: string }){}
}

export class SetShadingData implements Action {
    readonly type = EsriRendererActionTypes.SetShadingData;
    constructor(public payload: { data: ShadingData, isNumericData: boolean, statistics?: Statistics }) {}
}

export class ClearShadingData implements Action {
    readonly type = EsriRendererActionTypes.ClearShadingData;
}

export class SetSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.SetSelectedGeos;
  constructor(public payload: Array<string>) { }
}

export class ClearSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.ClearSelectedGeos;
}

export type EsriRendererActions =
  SetShadingData
  | ClearShadingData
  | SetSelectedGeos
  | ClearSelectedGeos
  | SetHighlightOptions
  ;
