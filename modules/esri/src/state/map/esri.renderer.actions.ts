import { Action } from '@ngrx/store';
import { NumericShadingData, TextShadingData, Statistics } from './esri.renderer.reducer';

export enum EsriRendererActionTypes {
  AddNumericShadingData = '[Esri Renderer] Add Numeric Shading Data',
  AddTextShadingData = '[Esri Renderer] Add Text Shading Data',
  ClearNumericShadingData = '[Esri Renderer] Clear Numeric Shading Data',
  ClearTextShadingData = '[Esri Renderer] Clear Text Shading Data',

  AddSelectedGeos = '[Esri Renderer] Add Selected Geos',
  AddSelectedObjectIds = '[Esri Renderer] Add Selected Object Ids',
  ClearSelectedGeos = '[Esri Renderer] Clear Selected Geos',

  AddStatistics = '[Esri Renderer] Add statistics',
  EnableShading = '[Esri Renderer] Enable shading'
}

export class AddNumericShadingData implements Action {
  readonly type = EsriRendererActionTypes.AddNumericShadingData;
  constructor(public payload: Array<NumericShadingData>) { }
}

export class AddTextShadingData implements Action {
  readonly type = EsriRendererActionTypes.AddTextShadingData;
  constructor(public payload: Array<TextShadingData>) { }
}

export class ClearNumericShadingData implements Action {
  readonly type = EsriRendererActionTypes.ClearNumericShadingData;
}

export class ClearTextShadingData implements Action {
  readonly type = EsriRendererActionTypes.ClearTextShadingData;
}

export class AddSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.AddSelectedGeos;
  constructor(public payload: Array<string>) { }
}

export class AddSelectedObjectIds implements Action {
  readonly type = EsriRendererActionTypes.AddSelectedObjectIds;
  constructor(public payload: { objectIds: Array<number> }) {}
}

export class ClearSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.ClearSelectedGeos;
}

export class AddStatistics implements Action {
  readonly type = EsriRendererActionTypes.AddStatistics;
  constructor(public payload: Statistics) { }
}

export class EnableShading implements Action {
  readonly type = EsriRendererActionTypes.EnableShading;
  constructor(public payload: boolean) { }
}

export type EsriRendererActions =
  AddNumericShadingData
  | AddTextShadingData
  | AddSelectedGeos
  | AddSelectedObjectIds
  | ClearNumericShadingData
  | ClearTextShadingData
  | ClearSelectedGeos
  | AddStatistics
  | EnableShading
  ;
