import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { filter, map, switchMap, tap, withLatestFrom } from 'rxjs/operators';
import { AddSelectedGeos, EsriRendererActionTypes, AddSelectedObjectIds } from './esri.renderer.actions';
import { EsriApi } from '../../core/esri-api.service';
import { EsriQueryService } from '../../services/esri-query.service';
import { EsriRendererService } from '../../services/esri-renderer.service';
import { AppState, internalSelectors } from '../esri.selectors';

@Injectable()
export class EsriRendererEffects {

  @Effect()
  handleSelectedGeos$ = this.actions$.pipe(
    ofType<AddSelectedGeos>(EsriRendererActionTypes.AddSelectedGeos),
    filter(action => action.payload.length > 0),
    map(action => {
      const query = new EsriApi.Query();
      const geocodes = action.payload.map(geo => `'${geo}'`).join(',');
      query.where = `geocode IN (${geocodes})`;
      return query;
    }),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriSelectedLayer))),
    switchMap(([query, layerId]) => this.queryService.executeObjectIdQuery(layerId, query).pipe(
      map(objectIds => new AddSelectedObjectIds({ objectIds }))
    ))
  );

  @Effect({ dispatch: false })
  highlightGeos$ = this.actions$.pipe(
    ofType<AddSelectedObjectIds>(EsriRendererActionTypes.AddSelectedObjectIds),
    withLatestFrom(this.store$.pipe(select(internalSelectors.getEsriSelectedLayer))),
    tap(([action, layerId]) => this.rendererService.highlightSelection(layerId, action.payload.objectIds))
  );

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private queryService: EsriQueryService,
              private rendererService: EsriRendererService) { }
}
