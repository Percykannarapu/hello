import { Injectable } from '@angular/core';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RestResponse } from '../models/RestResponse';
import { RfpUiEditLoaderService } from './rfpUiEdit-loader-service';
import { RfpUiEditDetailLoaderService } from './RfpUiEditDetail-loader-service';
import { RfpUiReviewLoaderService } from './rfpUiReview-loader-service';
import { RfpUiEditWrapLoaderService } from './rfpUiEditWrap-loader-service';
import { LocalState } from '../state';
import { Store } from '@ngrx/store';
import { SetIsWrap } from '../state/shared/shared.actions';
import { Observable, merge, EMPTY } from 'rxjs';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { map, reduce, tap } from 'rxjs/operators';
import { MediaPlanGroupLoaderService } from './mediaplanGroup-loader-service';
import { MediaPlanPrefLoaderService } from './mediaplanPref-loader-service';
import { MediaPlanPref } from 'src/app/val-modules/mediaexpress/models/MediaPlanPref';
import { MediaPlanPrefPayload } from '../state/payload-models/MediaPlanPref';

@Injectable({
   providedIn: 'root'
 })
 export class EntityHelper {

  readonly setSelectedUrl: string = 'v1/mediaexpress/base/mediaplan/setselected';
  readonly addNewUrl: string = 'v1/mediaexpress/base/mediaplan/%id%/addGeocodes';
  readonly savePreferences: string = 'v1/mediaexpress/base/mediaplanpref/save';

  constructor(private rfpUiEditLoader: RfpUiEditLoaderService,
               private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
               private rfpUiReviewLoader: RfpUiReviewLoaderService,
               private rfpUiEditWrapLoader: RfpUiEditWrapLoaderService,
               private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
               private mediaPlanPrefLoader: MediaPlanPrefLoaderService,
               private restService: RestDataService,
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

     const mediaplanPref$ = this.mediaPlanPrefLoader.loadMediaPlanPref(mediaPlanId).pipe(
       map(result => this.mediaPlanPrefLoader.normalize(result))
     );

     return merge(group$, rfpUiReview$, rfpUiEdit$, rfpUiEditDetail$, rfpUiEditWrap$, mediaplanPref$, 4).pipe(
       reduce((a, c) => Object.assign(a, c), {})
     );
   }

   public saveMediaPlan(updates: RfpUiEditDetail[], adds: RfpUiEditDetail[], mapConfig: MediaPlanPref   ) : Observable<any[]> {
     const updatePayload = updates.map(u => ({ id: u.commonMbuId, value: u.isSelected }));
     const setSelected$ = updates.length > 0 && updates.filter(rfp => rfp.commonMbuId == null).length == 0
       ? this.restService.post(this.setSelectedUrl, updatePayload)
       : EMPTY;

     const addPayload =  {
       products: [{
         product: {
           name: adds[0] ? adds[0].productName : '',
           geocodes: adds.map(a => ({ geocode: a.geocode }))
         }
       }]
     };
     const miniMediaPlan$ = adds.length > 0 && updates.filter(rfp => rfp.commonMbuId == null).length == 0
       ? this.restService.post(this.addNewUrl.replace('%id%', adds[0].mediaPlanId.toString()), addPayload)
       : EMPTY;

     
     const mediaplanPref$ = mapConfig  != null ? this.restService.post(this.savePreferences, mapConfig) : EMPTY;  

     return merge(setSelected$, miniMediaPlan$, mediaplanPref$).pipe(
       reduce((acc, curr) => [...acc, curr], [] as RestResponse[])
     );
   }
 }
