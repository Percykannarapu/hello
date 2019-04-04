import { Injectable } from '@angular/core';
import { RfpUiEditLoaderService } from './rfpUiEdit-loader-service';
import { RfpUiEditDetailLoaderService } from './RfpUiEditDetail-loader-service';
import { RfpUiReviewLoaderService } from './rfpUiReview-loader-service';
import { RfpUiEditWrapLoaderService } from './rfpUiEditWrap-loader-service';
import { LocalState } from '../state';
import { Store } from '@ngrx/store';
import { SetIsWrap } from '../state/shared/shared.actions';
import { Observable, merge } from 'rxjs';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { map, reduce, tap } from 'rxjs/operators';
import { MediaPlanGroupLoaderService } from './mediaplanGroup-loader-service';

@Injectable({
   providedIn: 'root'
 })
 export class EntityHelper {

   constructor(private rfpUiEditLoader: RfpUiEditLoaderService,
               private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
               private rfpUiReviewLoader: RfpUiReviewLoaderService,
               private rfpUiEditWrapLoader: RfpUiEditWrapLoaderService,
               private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
               private store$: Store<LocalState>) {}

   public loadEntities(groupId: number, mediaPlanId: number) : Observable<NormalizedPayload> {
     const group$ = this.mediaPlanGroupLoader.loadMediaPlanGroup(groupId).pipe(
       map(result => this.mediaPlanGroupLoader.normalize(result))
     );
     const rfpUiReview$ = this.rfpUiReviewLoader.loadRfpUiReview(mediaPlanId).pipe(
       map(result => this.rfpUiReviewLoader.normalize(result))
     );
     const rfpUiEdit$ = this.rfpUiEditLoader.loadRfpUiEdit(mediaPlanId).pipe(
       map(result => this.rfpUiEditLoader.normalize(result)),
       tap(result => this.store$.dispatch(new SetIsWrap({ isWrap: (result.rfpUiEdits[0] != null && result.rfpUiEdits[0].sfdcProductCode === 'WRAP') })))
     );
     const rfpUiEditDetail$ = this.rfpUiEditDetailLoader.loadRfpUiEditDetail(mediaPlanId).pipe(
       map(result => this.rfpUiEditDetailLoader.normalize(result))
     );
     const rfpUiEditWrap$ = this.rfpUiEditWrapLoader.loadRfpUiEditWrap(mediaPlanId).pipe(
       map(result => this.rfpUiEditWrapLoader.normalize(result))
     );

     return merge(group$, rfpUiReview$, rfpUiEdit$, rfpUiEditDetail$, rfpUiEditWrap$, 3).pipe(
       reduce((a, c) => Object.assign(a, c), {})
     );
   }
 }
