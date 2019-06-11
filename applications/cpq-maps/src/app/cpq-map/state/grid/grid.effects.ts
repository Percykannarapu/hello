import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { AppGeoService } from '../../services/app-geo.service';
import { localSelectors } from '../app.selectors';
import { LocalState } from '../index';
import { GridActions, GridActionTypes } from './grid.actions';

@Injectable()
export class GridEffects {

  @Effect({ dispatch: false })
  toggleGeo$ = this.actions$.pipe(
    ofType(GridActionTypes.GridGeoToggle),
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiEditDetailEntities)),
      this.store$.pipe(select(localSelectors.getRfpUiEditWrapEntities)),
      this.store$.pipe(select(localSelectors.getSharedState))),
    map(([action, geos, wraps, shared]) => {
      return [
        shared.isWrap ? geos.filter(g => g.wrapZone === action.payload.geocode) : geos.filter(g => g.geocode === action.payload.geocode),
        shared.isWrap ? wraps.filter(w => w.wrapZone === action.payload.geocode) : []
      ] as [RfpUiEditDetail[], RfpUiEditWrap[]];
    }),
    tap(([geos, wraps]) => this.geoService.toggleGeoSelection(geos, wraps))
  );

  constructor(private actions$: Actions<GridActions>,
              private store$: Store<LocalState>,
              private geoService: AppGeoService) {}

}
