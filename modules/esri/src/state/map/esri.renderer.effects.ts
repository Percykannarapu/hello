import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { SetSelectedGeos, EsriRendererActionTypes, SetShadingData } from './esri.renderer.actions';
import { EsriApi } from '../../core/esri-api.service';
import { EsriQueryService } from '../../services/esri-query.service';
import { EsriRendererService } from '../../services/esri-renderer.service';
import { AppState, internalSelectors } from '../esri.selectors';

@Injectable()
export class EsriRendererEffects {

  @Effect({ dispatch: false })
  enableShading$ = this.actions$.pipe(
    ofType<SetShadingData>(EsriRendererActionTypes.SetShadingData),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapState))),
    tap(([action, mapState]) => this.rendererService.setShadingRenderer(mapState, action.payload.data, action.payload.isNumericData, action.payload.statistics))
  );

  @Effect({ dispatch: false })
  disableShading$ = this.actions$.pipe(
    ofType(EsriRendererActionTypes.ClearShadingData),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapState))),
    tap(([action, mapState]) => this.rendererService.restoreSimpleRenderer(mapState))
  );

  @Effect({ dispatch: false })
  handleSelectedGeos$ = this.actions$.pipe(
    ofType<SetSelectedGeos>(EsriRendererActionTypes.SetSelectedGeos),
    filter(action => action.payload.length > 0),
    map(action => action.payload.map(geo => `'${geo}'`).join(',')),
    map(geoString => new EsriApi.Query({ where: `geocode IN (${geoString})` })),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriSelectedLayer))),
    switchMap(([query, layerId]) => this.queryService.executeObjectIdQuery(layerId, query).pipe(
      tap(objectIds => this.rendererService.highlightSelection(layerId, objectIds))
    ))
  );

  @Effect({ dispatch: false })
  handleClearGeos$ = this.actions$.pipe(
    ofType(EsriRendererActionTypes.ClearSelectedGeos),
    tap(() => this.rendererService.clearHighlight())
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private queryService: EsriQueryService,
              private rendererService: EsriRendererService) { }
}