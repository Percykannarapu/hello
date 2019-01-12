import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { SharedActionTypes, SetAppReady, SetGroupId } from './state/shared/shared.actions';
import { tap, filter, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Store } from '@ngrx/store';
import { LocalState } from './state';
import { MediaPlanGroupLoaderService, NormalizedPayload } from './services/mediaplanGroup-loader-service';
import { AddMediaPlanGroup } from './state/mediaPlanGroup/media-plan-group.actions';
import { AddMediaPlans } from './state/mediaPlan/media-plan.actions';
import { AddMediaPlanCommonMbus } from './state/mediaPlanCommonMbu/media-plan-common-mbu.actions';
import { AddMediaPlanLines } from './state/mediaPlanLine/media-plan-line.actions';
import { AddProductAllocations } from './state/productAllocation/product-allocation.actions';
import { AddTargetAudiences } from './state/targetAudience/target-audience.actions';
import { AddAdvertiserInfos } from './state/advertiserInfo/advertiser-info.actions';
import { AddCbxReports } from './state/cbxReport/cbx-report.actions';

@Injectable()
export class AppEffects {

  @Effect({ dispatch: false })
  groupIdPopulated$ = this.actions$.pipe(
    ofType<SetGroupId>(SharedActionTypes.SetGroupId),
    filter((action) => action.payload != null),
    tap((action) => console.log('Fired effect for app ready', action.payload)),
    tap((action) => this.store$.dispatch(new SetAppReady(true)))
  );

  @Effect({ dispatch: false })
  loadMediaPlanGroup$ = this.actions$.pipe(
    ofType<SetGroupId>(SharedActionTypes.SetGroupId),
    switchMap(action => this.mediaPlanGroupLoader.loadMediaPlanGroup(action.payload).pipe(
      map(fuseResult => this.mediaPlanGroupLoader.normalize(fuseResult)),
      tap(normalizedEntities => this.populateEntities(normalizedEntities)),
      catchError(err => of(console.error(err)))
    ))
  );

  private populateEntities(payload: NormalizedPayload) {
    if (payload.mediaPlanGroup != null)
      this.store$.dispatch(new AddMediaPlanGroup({ mediaPlanGroup: payload.mediaPlanGroup }));
    if (payload.mediaPlans != null)
      this.store$.dispatch(new AddMediaPlans({ mediaPlans: payload.mediaPlans }));
    if (payload.commonMbus != null)
      this.store$.dispatch(new AddMediaPlanCommonMbus({ mediaPlanCommonMbus: payload.commonMbus }));
    if (payload.lines != null)
      this.store$.dispatch(new AddMediaPlanLines({ mediaPlanLines: payload.lines }));
    if (payload.productAllocations != null)
      this.store$.dispatch(new AddProductAllocations({ productAllocations: payload.productAllocations }));
    if (payload.targetAudiencePrefs != null)
      this.store$.dispatch(new AddTargetAudiences({ targetAudiences: payload.targetAudiencePrefs }));
    if (payload.advertiserInfos != null)
      this.store$.dispatch(new AddAdvertiserInfos({ advertiserInfos: payload.advertiserInfos }));
    if (payload.reports != null)
      this.store$.dispatch(new AddCbxReports({ cbxReports: payload.reports }));
  }

  constructor(private actions$: Actions, private store$: Store<LocalState>, private mediaPlanGroupLoader: MediaPlanGroupLoaderService) { }
}