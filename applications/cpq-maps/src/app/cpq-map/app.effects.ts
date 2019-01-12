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
        map(fuseResult => this.mediaPlanGroupLoader.normalize2(fuseResult)),
        tap(normalizedEntities => this.store$.dispatch(new AddMediaPlanGroup({mediaPlanGroup: normalizedEntities.mediaPlanGroup}))),
        tap(normalizedEntities => this.store$.dispatch(new AddMediaPlans({mediaPlans: normalizedEntities.mediaPlans}))),
        tap(normalizedEntities => this.store$.dispatch(new AddMediaPlanCommonMbus({mediaPlanCommonMbus: normalizedEntities.commonMbus}))),
        tap(normalizedEntities => this.store$.dispatch(new AddMediaPlanLines({mediaPlanLines: normalizedEntities.lines}))),
        tap(normalizedEntities => this.store$.dispatch(new AddProductAllocations({productAllocations: normalizedEntities.productAllocations}))),
        tap(normalizedEntities => this.store$.dispatch(new AddTargetAudiences({targetAudiences: normalizedEntities.targetAudiencePrefs}))),
        map(normalizedEntities => new AddMediaPlanGroup({ mediaPlanGroup: normalizedEntities.mediaPlanGroup })),
        catchError(err => of(console.error(err)))
      ))
   );

  constructor(private actions$: Actions, private store$: Store<LocalState>, private mediaPlanGroupLoader: MediaPlanGroupLoaderService) {}
}