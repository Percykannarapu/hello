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
import { VarDefinition } from '../shading/shading.reducer';
import { PopupActions, PopupActionTypes, PopupNewGeoAdd } from './popup.actions';

@Injectable({ providedIn: 'root' })
export class PopupEffects {

  @Effect({ dispatch: false })
  toggleGeo$ = this.actions$.pipe(
    ofType(PopupActionTypes.PopupGeoToggle),
    withLatestFrom(this.store$.select(localSelectors.getRfpUiEditDetailEntities),
                   this.store$.select(localSelectors.getRfpUiEditWrapEntities),
                   this.store$.select(localSelectors.getSharedState)),
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
    withLatestFrom(this.store$.select(localSelectors.getRfpUiReviewEntities),
                   this.store$.select(localSelectors.getSharedState),
                   this.store$.select(localSelectors.getShadingState)),
    map(([action, reviews, shared, shading]) => {
      return [
        action.payload,
        reviews[0],
        shared.isWrap,
        shared.analysisLevel,
        shading.availableVars
      ] as [PopupNewGeoAdd['payload'], RfpUiReview, boolean, string, VarDefinition[]];
    }),
    tap(([payload, review, isWrap, analysisLevel, availableVars]) => this.geoService.addNewGeo(payload.geocode, payload.wrapName, payload.availsInfo, review, availableVars, isWrap, analysisLevel))
  );

  constructor(private actions$: Actions<PopupActions>,
              private geoService: AppGeoService,
              private store$: Store<FullState>) {}

}
