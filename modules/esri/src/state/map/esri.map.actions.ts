import { Action } from '@ngrx/store';
import { ElementRef } from '@angular/core';
import { EsriMapToolbarButtonActions } from './esri.map-button.actions';
import { EsriLabelConfiguration } from './esri.map.reducer';

export enum EsriMapActionTypes {
  InitializeMap = '[Esri Map] Initialize',
  InitializeMapSuccess = '[Esri Map] Initialize Success',
  InitializeMapFailure = '[Esri Map] Initialize Failure',
  SetMapHeight = '[Esri Map] Set Height',
  SetMapViewPoint = '[Esri Map] Set Viewpoint',
  SetPopupVisibility = '[Esri Map] Set Popup Visibility',
  MapClicked = '[Esri Map] Click Event',
  FeaturesSelected = '[Esri Map] Features Selected',
  SetSelectedLayer = '[Esri Map] Set Selected Layer Id',
  SetLabelConfiguration = '[Esri Map] Set Label Configuration'
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

export class FeaturesSelected implements Action {
  readonly type = EsriMapActionTypes.FeaturesSelected;
  constructor(public payload: { features: __esri.Graphic[] }){}
}

export class SetLabelConfiguration implements Action {
  readonly type = EsriMapActionTypes.SetLabelConfiguration;
  constructor(public payload: { labelConfiguration: EsriLabelConfiguration }){}
}

export type EsriMapActions =
  InitializeMap
  | InitializeMapSuccess
  | InitializeMapFailure
  | SetMapHeight
  | SetMapViewpoint
  | SetPopupVisibility
  | MapClicked
  | FeaturesSelected
  | EsriMapToolbarButtonActions
  | SetSelectedLayer
  | SetLabelConfiguration
  ;
