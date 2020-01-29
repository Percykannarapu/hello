import { Injectable } from '@angular/core';
import { Effect } from '@ngrx/effects';
import { defer, of } from 'rxjs';
import { Initialize } from './init/esri.init.actions';
import { EsriInitEffects } from './init/esri.init.effects';
import { EsriMapButtonEffects } from './map/esri.map-button.effects';
import { EsriMapEffects } from './map/esri.map.effects';
import { EsriShadingEffects } from './shading/esri.shading.effects';

@Injectable()
export class EsriEffects {
  @Effect()
  init$ = defer(() => {
    return of(new Initialize());
  });
}

export const allEffects = [
  EsriInitEffects,
  EsriMapEffects,
  EsriMapButtonEffects,
  EsriShadingEffects,
  EsriEffects       // EsriEffects must go last since it implements init$
];
