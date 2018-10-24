import { Action } from '@ngrx/store';

export enum EsriMapToolbarButtonActionTypes {
  PopupButtonSelected = '[Esri Map Toolbar] Popup Button Selected',
  SelectSinglePolySelected = '[Esri Map Toolbar] Select Single Geo Selected',
  SelectMultiPolySelected = '[Esri Map Toolbar] Select Multiple Geos Selected',
  StartSketchView = '[Esri Map Toolbar] Start SketchView',
  ClearSketchView = '[Esri Map Toolbar] Clear SketchView',
  MeasureDistanceSelected = '[Esri Map Toolbar] Measure Distance Selected',
}

export class PopupButtonSelected implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.PopupButtonSelected;
}

export class SelectSinglePolySelected implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.SelectSinglePolySelected;
}

export class SelectMultiPolySelected implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.SelectMultiPolySelected;
}

export class StartSketchView implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.StartSketchView;
  constructor(public payload: { model: __esri.SketchViewModel }){}
}

export class ClearSketchView implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.ClearSketchView;
}

export class MeasureDistanceSelected implements Action {
  readonly type = EsriMapToolbarButtonActionTypes.MeasureDistanceSelected;
}

export type EsriMapToolbarButtonActions = PopupButtonSelected |
  SelectSinglePolySelected |
  SelectMultiPolySelected |
  StartSketchView |
  ClearSketchView |
  MeasureDistanceSelected;
