import { Action } from '@ngrx/store';
import { Statistics, ShadingData, HighlightMode } from './esri.renderer.reducer';
import { ColorPalette } from '../../models/color-palettes';

export enum EsriRendererActionTypes {
  SetRenderingData = '[Esri Renderer] Set Rendering Data',
  ClearRenderingData = '[Esri Renderer] Clear Rendering Data',

  SelectedGeosShading = '[Esri Renderer] Selected Geos Shading',
  SetSelectedGeos = '[Esri Renderer] Set Selected Geos',
  ClearSelectedGeos = '[Esri Renderer] Clear Selected Geos',
  SetHighlightOptions = '[Esri Renderer] Set highlight options',
}

export class SetHighlightOptions implements Action {
  readonly type = EsriRendererActionTypes.SetHighlightOptions;
  constructor(public payload: { highlightMode: HighlightMode, layerGroup: string, layer: string, colorPallete: ColorPalette, groups?: { groupName: string, ids: string[] }[] }){}
}

export class SetRenderingData implements Action {
    readonly type = EsriRendererActionTypes.SetRenderingData;
    constructor(public payload: { data: ShadingData, isNumericData: boolean, statistics?: Statistics, legend?: string, theme?: ColorPalette }) {}
}

export class ClearRenderingData implements Action {
    readonly type = EsriRendererActionTypes.ClearRenderingData;
}

export class SelectedGeosShading implements Action {
    readonly type = EsriRendererActionTypes.SelectedGeosShading;
    constructor(public payload: { dataDic: Map<string, boolean>, geos: string[], layerId: string, minScale: number}) {}
}

export class SetSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.SetSelectedGeos;
  constructor(public payload: Array<string>) { }
}

export class ClearSelectedGeos implements Action {
  readonly type = EsriRendererActionTypes.ClearSelectedGeos;
}

export type EsriRendererActions =
  SetRenderingData
  | ClearRenderingData
  | SelectedGeosShading
  | SetSelectedGeos
  | ClearSelectedGeos
  | SetHighlightOptions
  ;
