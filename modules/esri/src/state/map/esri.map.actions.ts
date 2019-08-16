import { Action } from '@ngrx/store';
import { ElementRef } from '@angular/core';
import { EsriMapToolbarButtonActions } from './esri.map-button.actions';
import { EsriLabelConfiguration, EsriLabelLayerOptions } from './esri.map.reducer';

export enum EsriMapActionTypes {
  InitializeMap = '[Esri Map] Initialize',
  InitializeMapSuccess = '[Esri Map] Initialize Success',
  InitializeMapFailure = '[Esri Map] Initialize Failure',
  SetMapHeight = '[Esri Map] Set Height',
  SetMapViewPoint = '[Esri Map] Set Viewpoint',
  SetPopupVisibility = '[Esri Map] Set Popup Visibility',
  MapClicked = '[Esri Map] Click Event',
  CopyCoordinatesToClipboard = '[Esri Map] Copy Coordinates to Clipboard',
  FeaturesSelected = '[Esri Map] Features Selected',
  SetSelectedLayer = '[Esri Map] Set Selected Layer Id',
  SetLabelConfiguration = '[Esri Map] Set Label Configuration',
  
  PrintMap = '[Esri Map] Print Map',
  SetPrintRenderer = '[Esri Map] Set Shading Renderer for Print Service',
  PrintJobComplete = '[Esri Map] Print Job Complete',

  SetLayerLabelExpressions = '[Esri Map] Set Layer Label Expressions',

  ResetMapState = '[Esri Map] Reset State'
}

export class InitializeMap implements Action {
  readonly type = EsriMapActionTypes.InitializeMap;
  constructor(public payload: { domContainer: ElementRef, baseMap: string }){}
}

export class InitializeMapSuccess implements Action {
  readonly type = EsriMapActionTypes.InitializeMapSuccess;
}

export class InitializeMapFailure implements Action {
  readonly type = EsriMapActionTypes.InitializeMapFailure;
  constructor(public payload: { errorResponse: any }){}
}

export class SetMapHeight implements Action {
  readonly type = EsriMapActionTypes.SetMapHeight;
  constructor(public payload: { newMapHeight: number }){}
}

export class SetMapViewpoint implements Action {
  readonly type = EsriMapActionTypes.SetMapViewPoint;
  constructor(public payload: { newViewpoint: __esri.Viewpoint }){}
}

export class SetPopupVisibility implements Action {
  readonly type = EsriMapActionTypes.SetPopupVisibility;
  constructor(public payload: { isVisible: boolean }){}
}

export class SetSelectedLayer implements Action {
  readonly type = EsriMapActionTypes.SetSelectedLayer;
  constructor(public payload: { layerId: string }){}
}

export class MapClicked implements Action {
  readonly type = EsriMapActionTypes.MapClicked;
  constructor(public payload: { event: __esri.MapViewImmediateClickEvent }){}
}

export class CopyCoordinatesToClipboard implements Action {
  readonly type = EsriMapActionTypes.CopyCoordinatesToClipboard;
  constructor(public payload: { event: __esri.MapViewImmediateClickEvent }){}
}

export class FeaturesSelected implements Action {
  readonly type = EsriMapActionTypes.FeaturesSelected;
  constructor(public payload: { features: __esri.Graphic[] }){}
}

export class SetLabelConfiguration implements Action {
  readonly type = EsriMapActionTypes.SetLabelConfiguration;
  constructor(public payload: { labelConfiguration: EsriLabelConfiguration }){}
}

export class SetLayerLabelExpressions implements Action {
  readonly type = EsriMapActionTypes.SetLayerLabelExpressions;
  constructor(public payload: { expressions: { [layerId: string] : EsriLabelLayerOptions } }) {}
}

export class ResetMapState implements Action {
    readonly type = EsriMapActionTypes.ResetMapState;
}

export class PrintMap implements Action{
  readonly type = EsriMapActionTypes.PrintMap;
  constructor(public payload: { templateOptions: {title: string, author: string }, serviceUrl: string}){}
}

export class SetPrintRenderer implements Action{
  readonly type = EsriMapActionTypes.SetPrintRenderer;
  constructor(public payload: {geos: string[], portalId: string, minScale: number}){}
}

export class PrintJobComplete implements Action {
  readonly type = EsriMapActionTypes.PrintJobComplete;
  constructor(public payload: { result: string }) {}
}

export type EsriMapActions =
  InitializeMap
  | InitializeMapSuccess
  | InitializeMapFailure
  | SetMapHeight
  | SetMapViewpoint
  | SetPopupVisibility
  | MapClicked
  | CopyCoordinatesToClipboard
  | FeaturesSelected
  | EsriMapToolbarButtonActions
  | SetSelectedLayer
  | SetLabelConfiguration
  | SetLayerLabelExpressions
  | ResetMapState
  | PrintMap
  | SetPrintRenderer
  | PrintJobComplete
  ;
