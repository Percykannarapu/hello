import { Injectable } from '@angular/core';
import { Effect } from '@ngrx/effects';
import { defer, of } from 'rxjs';
import { InitializeApi } from './api/esri.api.actions';
import { EsriApiEffects } from './api/esri.api.effects';
import { EsriAuthEffects } from './auth/esri.auth.effects';
import { EsriMapButtonEffects } from './map/esri.map-button.effects';
import { EsriMapEffects } from './map/esri.map.effects';
import { EsriRendererEffects } from './renderer/esri.renderer.effects';
import { EsriShadingEffects } from './shading/esri.shading.effects';

@Injectable()
export class EsriEffects {
  @Effect()
  init$ = defer(() => {
    return of(new InitializeApi());
  });
}

export const allEffects = [
  EsriApiEffects,
  EsriAuthEffects,
  EsriMapEffects,
  EsriMapButtonEffects,
  EsriRendererEffects,
  EsriShadingEffects,
  EsriEffects       // EsriEffects must go last since it implements init$
];
