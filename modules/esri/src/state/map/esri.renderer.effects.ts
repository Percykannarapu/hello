import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { EsriMapActionTypes } from './esri.map.actions';
import { SetSelectedGeos, EsriRendererActionTypes, SetShadingData, SelectedGeosShading } from './esri.renderer.actions';
import { EsriApi } from '../../core/esri-api.service';
import { EsriQueryService } from '../../services/esri-query.service';
import { EsriRendererService } from '../../services/esri-renderer.service';
import { AppState, internalSelectors } from '../esri.selectors';
import { HighlightMode } from './esri.renderer.reducer';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';

@Injectable()
export class EsriRendererEffects {

  @Effect({ dispatch: false })
  enableShading$ = this.actions$.pipe(
    ofType<SetShadingData>(EsriRendererActionTypes.SetShadingData),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapState))),
    tap(([action, mapState]) => this.rendererService.setShadingRenderer(mapState, action.payload.data, action.payload.isNumericData, action.payload.statistics, action.payload.legend, action.payload.theme))
  );

  @Effect({ dispatch: false })
  disableShading$ = this.actions$.pipe(
    ofType(EsriRendererActionTypes.ClearShadingData),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriMapState))),
    tap(([action, mapState]) => this.rendererService.restoreSimpleRenderer(mapState))
  );

  // @Effect({ dispatch: false })
  // highlightSelectedGeos$ = this.actions$.pipe(
  //   ofType<SetSelectedGeos>(EsriRendererActionTypes.SetSelectedGeos),
  //   filter(action => action.payload.length > 0),
  //   tap(action => console.log('Inside highlightSelectedGeos$::::', action.payload)),
  //   map(action => action.payload.map(geo => `'${geo}'`).join(',')),
  //   tap(action => console.log('Inside highlightSelectedGeos$ after map join::::', action)),
  //   map(geoString => new EsriApi.Query({ where: `geocode IN (${geoString})` })),
  //   tap(query => console.log('query after Esri Query::::', query)),
  //   withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriState))),
  //   filter(([query, state]) => (state.renderer.highlightMode === HighlightMode.OUTLINE || state.renderer.highlightMode === HighlightMode.OUTLINE_GROUPS) && state.map.selectedLayerId != null),
  //   switchMap(([query, state]) => this.queryService.executeObjectIdQuery(state.map.selectedLayerId, query).pipe(
  //     tap(objectIds => this.rendererService.highlightSelection(state.map.selectedLayerId, objectIds))
  //   ))
  // );

  @Effect({ dispatch: false})
  selectedGeosShading$ = this.actions$.pipe(
    ofType<SelectedGeosShading>(EsriRendererActionTypes.SelectedGeosShading),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriState))),
    tap(([action]) => this.shadingService.selectedGeosShading(action.payload.geos, action.payload.layerId))
  );

  @Effect({ dispatch: false })
  shadeSelectedGeos$ = this.actions$.pipe(
    ofType<SetSelectedGeos>(EsriRendererActionTypes.SetSelectedGeos),
    filter(action => action.payload.length > 0),
    map(action => action.payload.map(geo => `'${geo}'`).join(',')),
    map(geoString => new EsriApi.Query({ where: `geocode IN (${geoString})` })),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriState))),
    filter(([query, state]) => state.renderer.highlightMode === HighlightMode.SHADE),
    switchMap(([query, state]) => this.queryService.executeQuery(state.map.selectedLayerId, query, true).pipe(
      tap(features => this.rendererService.shadeSelection(features, state.renderer.highlightLayerGroup, state.renderer.highlightLayer))
    ))
  );

  @Effect({ dispatch: false })
  shadeSelectedGeoGroups$ = this.actions$.pipe(
    ofType<SetSelectedGeos>(EsriRendererActionTypes.SetSelectedGeos),
    filter(action => action.payload.length > 0),
    map(action => action.payload.map(geo => `'${geo}'`).join(',')),
    map(geoString => new EsriApi.Query({ where: `geocode IN (${geoString})` })),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriState))),
    filter(([query, state]) => state.renderer.highlightMode === HighlightMode.SHADE_GROUPS),
    switchMap(([query, state]) => this.queryService.executeQuery(state.map.selectedLayerId, query, true, 'geocode').pipe(
      tap(features => this.rendererService.shadeGroups(features, state.renderer.highlightLayerGroup, state.renderer.highlightLayer, state.renderer.shadingGroups, state.renderer.colorPallete))
    ))
  );

  @Effect({ dispatch: false })
  handleClearGeos$ = this.actions$.pipe(
    ofType(EsriRendererActionTypes.ClearSelectedGeos, EsriMapActionTypes.ResetMapState),
    tap(() => this.rendererService.clearHighlight())
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private queryService: EsriQueryService,
              private rendererService: EsriRendererService,
              private shadingService: EsriShadingLayersService) { }
}
