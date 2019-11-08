import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriState } from '../state/esri.selectors';
import { ResetMapState, SetLayerLabelExpressions, SetPopupVisibility, SetSelectedLayer } from '../state/map/esri.map.actions';
import { EsriLabelLayerOptions } from '../state/map/esri.map.reducer';

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
}
