import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { tap } from 'rxjs/operators';
import { EsriLayerService } from '../../services/esri-layer.service';
import { addLayerToLegend } from './esri.shading.actions';

@Injectable()
export class EsriShadingEffects {

  addLayerToLegend$ = createEffect(() => this.actions$.pipe(
      ofType(addLayerToLegend),
      tap(payload => this.layerService.addLayerToLegend(payload.layerUniqueId, payload.title, payload.showDefaultSymbol))
    ),
    { dispatch: false }
  );

  constructor(private actions$: Actions,
              private layerService: EsriLayerService) {}
}
