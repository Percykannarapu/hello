import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { RfpUiReview } from '../../../val-modules/mediaexpress/models/RfpUiReview';
import { AppGeoService } from '../../services/app-geo.service';
import { localSelectors } from '../app.selectors';
import { FullState } from '../index';
import { PopupActions, PopupActionTypes, PopupNewGeoAdd } from './popup.actions';

@Injectable({ providedIn: 'root' })
export class PopupEffects {

  @Effect({ dispatch: false })
  toggleGeo$ = this.actions$.pipe(
    ofType(PopupActionTypes.PopupGeoToggle),
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiEditDetailEntities)),
                   this.store$.pipe(select(localSelectors.getRfpUiEditWrapEntities)),
                   this.store$.pipe(select(localSelectors.getSharedState))),
    map(([action, geos, wraps, shared]) => {
      return [
        shared.isWrap ? geos.filter(g => g.wrapZone === action.payload.wrapName) : geos.filter(g => g.geocode === action.payload.geocode),
        shared.isWrap ? wraps.filter(w => w.wrapZone === action.payload.wrapName) : []
      ] as [RfpUiEditDetail[], RfpUiEditWrap[]];
    }),
    tap(([geos, wraps]) => this.geoService.toggleGeoSelection(geos, wraps))
  );

  @Effect({ dispatch: false })
  addNewGeo$ = this.actions$.pipe(
    ofType(PopupActionTypes.PopupNewGeoAdd),
    withLatestFrom(this.store$.pipe(select(localSelectors.getRfpUiReviewEntities)), this.store$.pipe(select(localSelectors.getSharedState))),
    map(([action, reviews, shared]) => {
      return [
        action.payload,
        reviews[0],
        shared.isWrap,
        shared.analysisLevel
      ] as [PopupNewGeoAdd['payload'], RfpUiReview, boolean, string];
    }),
    tap(([payload, review, isWrap, analysisLevel]) => this.geoService.addNewGeo(payload.geocode, payload.wrapName, payload.availsInfo, review, isWrap, analysisLevel))
  );

  constructor(private actions$: Actions<PopupActions>,
              private geoService: AppGeoService,
              private store$: Store<FullState>) {}

}
