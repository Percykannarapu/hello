import { Action } from '@ngrx/store';
import { EsriHighlightHandler, NumericShadingData, TextShadingData, Statistics } from './esri.renderer.reducer';

export enum EsriRendererActionTypes {
  AddNumericShadingData = '[Esri Renderer] Add Numeric Shading Data',
  AddTextShadingData = '[Esri Renderer] Add Text Shading Data',
  AddSelectedGeos = '[Esri Renderer] Add Selected Geos', 
  ClearNumericShadingData = '[Esri Renderer] Clear Numeric Shading Data',
  ClearTextShadingData = '[Esri Renderer] Clear Text Shading Data',
  ClearSelectedGeos = '[Esri Renderer] Clear Selected Geos',
  HighlightSelectedGeos = '[Esri Renderer] Highlight Selected Geos',
  AddHighlightHandlers = '[Esri Renderer] Add Highlight Handlers',
  ClearHighlightHandlers = '[Esri Renderer] Clear Highlight Handlers',
  AddStatistics = '[Esri Renderer] Add statistics'
}

export class AddNumericShadingData implements Action {
  readonly type = EsriRendererActionTypes.AddNumericShadingData;
  constructor(public payload: Array<NumericShadingData>) { }
}

export class AddTextShadingData implements Action {
  readonly type = EsriRendererActionTypes.AddTextShadingData;
  constructor(public payload: Array<TextShadingData>) { }
}

export class AddSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.AddSelectedGeos;
  constructor(public payload: Array<string>) { }
}

export class ClearNumericShadingData implements Action {
  readonly type = EsriRendererActionTypes.ClearNumericShadingData;
}

export class ClearTextShadingData implements Action {
  readonly type = EsriRendererActionTypes.ClearTextShadingData;
}

export class ClearSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.ClearSelectedGeos;
}

export class HighlightSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.HighlightSelectedGeos;
  constructor(public payload: boolean) { }
}

export class AddHighlightHandlers implements Action {
  readonly type = EsriRendererActionTypes.AddHighlightHandlers;
  constructor(public payload: Array<EsriHighlightHandler>) { }
}

export class ClearHighlightHandlers implements Action {
  readonly type = EsriRendererActionTypes.ClearHighlightHandlers;
}

export class AddStatistics implements Action {
  readonly type = EsriRendererActionTypes.AddStatistics;
  constructor(public payload: Statistics) { }
}

export type EsriRendererActions =
  AddNumericShadingData
  | AddTextShadingData
  | AddSelectedGeos
  | ClearNumericShadingData
  | ClearTextShadingData
  | ClearSelectedGeos
  | HighlightSelectedGeos
  | AddHighlightHandlers
  | ClearHighlightHandlers
  | AddStatistics
  ;