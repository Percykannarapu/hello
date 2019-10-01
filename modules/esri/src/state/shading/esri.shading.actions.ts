import { Action } from '@ngrx/store';

export enum EsriShadingActionTypes {
  MapViewChanged = '[Esri.Shading] Map View Changed',
  GeoSelectionChanged = '[Esri.Shading] Geo Selection Changed',
  ClearSelectionData = '[Esri.Shading] Clear Selection Data',
  ClearShadingData = '[Esri.Shading] Clear Shading Data'
}

export class MapViewChanged implements Action {
  readonly type = EsriShadingActionTypes.MapViewChanged;
  constructor(public payload: { visibleGeos: string[] }) {}
}

export class GeoSelectionChanged implements Action {
  readonly type = EsriShadingActionTypes.GeoSelectionChanged;
  constructor(public payload: { selectedGeos: string[], layerId: string, minScale: number }) {}
}

export class ClearShadingData implements Action {
  readonly type = EsriShadingActionTypes.ClearShadingData;
}

export class ClearSelectionData implements Action {
  readonly type = EsriShadingActionTypes.ClearSelectionData;
}

export type EsriShadingActions =
  MapViewChanged |
  GeoSelectionChanged |
  ClearSelectionData |
  ClearShadingData;
