import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { ShadingDefinition } from '../models/shading-configuration';
import { InitialEsriState, loadInitialState } from '../state/esri.actions';
import { EsriState } from '../state/esri.selectors';
import { ResetMapState, SetLayerLabelExpressions, SetPopupVisibility, SetSelectedLayer } from '../state/map/esri.map.actions';
import { EsriLabelLayerOptions } from '../state/map/esri.map.reducer';
import { loadShadingDefinitions } from '../state/shading/esri.shading.actions';

@Injectable()
export class EsriService {

  constructor(private store$: Store<EsriState>) { }

  resetMapState() : void {
    this.store$.dispatch(new ResetMapState());
  }

  setPopupVisibility(isVisible: boolean) : void {
    this.store$.dispatch(new SetPopupVisibility({ isVisible }));
  }

  setSelectedLayer(layerId: string) : void {
    this.store$.dispatch(new SetSelectedLayer({ layerId }));
  }

  setLayerLabelExpressions(expressions: { [layerId: string] : EsriLabelLayerOptions }) : void {
    this.store$.dispatch(new SetLayerLabelExpressions({ expressions }));
  }

  loadInitialState(initialState: InitialEsriState, shadingDefinitions?: ShadingDefinition[]) : void {
    this.store$.dispatch(loadInitialState(initialState));
    this.store$.dispatch(loadShadingDefinitions({ shadingDefinitions }));
  }
}
