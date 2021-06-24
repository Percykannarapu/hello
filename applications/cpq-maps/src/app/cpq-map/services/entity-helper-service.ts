import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { EMPTY, merge, Observable } from 'rxjs';
import { map, reduce, tap } from 'rxjs/operators';
import { MediaPlanPref } from 'src/app/val-modules/mediaexpress/models/MediaPlanPref';
import { DAOBaseStatus } from '../../val-modules/api/models/BaseModel';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { RestResponse } from '../models/RestResponse';
import { LocalState } from '../state/index';
import { SetIsWrap } from '../state/shared/shared.actions';
import { MediaPlanGroupLoaderService } from './mediaplanGroup-loader-service';
import { MediaPlanPrefLoaderService } from './mediaplanPref-loader-service';
import { RfpUiEditLoaderService } from './rfpUiEdit-loader-service';
import { RfpUiEditDetailLoaderService } from './RfpUiEditDetail-loader-service';
import { RfpUiEditWrapLoaderService } from './rfpUiEditWrap-loader-service';
import { RfpUiReviewLoaderService } from './rfpUiReview-loader-service';

@Injectable({
  providedIn: 'root'
})
export class EntityHelper {

  readonly setSelectedUrl: string = 'v1/mediaexpress/base/mediaplan/setselected';
  readonly addNewUrl: string = 'v1/mediaexpress/base/mediaplan/%id%/addGeocodes';
  readonly savePreferences: string = 'v1/mediaexpress/base/mediaplanpref/saveList';

  constructor(private rfpUiEditLoader: RfpUiEditLoaderService,
              private rfpUiEditDetailLoader: RfpUiEditDetailLoaderService,
              private rfpUiReviewLoader: RfpUiReviewLoaderService,
              private rfpUiEditWrapLoader: RfpUiEditWrapLoaderService,
              private mediaPlanGroupLoader: MediaPlanGroupLoaderService,
              private mediaPlanPrefLoader: MediaPlanPrefLoaderService,
              private restService: RestDataService,
              private store$: Store<LocalState>) {}

  private static createPrefPayload(existingPref: Partial<MediaPlanPref>, prefName: string, prefValue: string, mediaPlanId: number) : Partial<MediaPlanPref> {
    return {
      prefId: null,
      ...existingPref,
      mediaPlanId: mediaPlanId,
      prefGroup: 'CPQ MAPS',
      prefType: 'STRING',
      pref: prefName,
      val: prefValue,
      largeVal: null,
      isActive: true,
      dirty: true,
      baseStatus: existingPref.prefId == null ? DAOBaseStatus.INSERT : DAOBaseStatus.UPDATE,
      mediaPlan: null, setTreeProperty: null, removeTreeProperty: null, convertToModel: null
    };
  }

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

    const mediaPlanPref$ = this.mediaPlanPrefLoader.loadMediaPlanPref(mediaPlanId).pipe(
      map(result => this.mediaPlanPrefLoader.normalize(result))
    );

    return merge(group$, rfpUiReview$, rfpUiEdit$, rfpUiEditDetail$, rfpUiEditWrap$, mediaPlanPref$, 4).pipe(
      reduce((a, c) => Object.assign(a, c), {})
    );
  }

  public saveMediaPlan(state: LocalState) : Observable<any[]> {
    const setSelected$ = this.prepUpdates(state);
    const miniMediaPlan$ = this.prepMiniMediaPlan(state);
    const mediaPlanPref$ = this.prepPreferences(state);
    return merge(setSelected$, miniMediaPlan$, mediaPlanPref$).pipe(
      reduce((acc, curr) => [...acc, curr], [] as RestResponse[])
    );
  }

  private prepUpdates(state: LocalState) : Observable<RestResponse> {
    const updates = state.shared.editedLineItemIds.map(id => state.rfpUiEditDetail.entities[id]).filter(rfp => rfp.commonMbuId != null);
    const updatePayload = updates.map(u => ({ id: u.commonMbuId, value: u.isSelected }));
    return updates.length > 0
      ? this.restService.post(this.setSelectedUrl, updatePayload)
      : EMPTY;
  }

  private prepMiniMediaPlan(state: LocalState) : Observable<RestResponse> {
    const adds = state.shared.newLineItemIds.map(id => state.rfpUiEditDetail.entities[id]).filter(rfp => rfp.commonMbuId == null);
    const addPayload =  {
      products: [{
        product: {
          name: adds[0] ? adds[0].productName : '',
          geocodes: adds.map(a => ({ geocode: a.geocode }))
        }
      }]
    };
    return adds.length > 0
      ? this.restService.post(this.addNewUrl.replace('%id%', adds[0].mediaPlanId.toString()), addPayload)
      : EMPTY;
  }

  private prepPreferences(state: LocalState) : Observable<RestResponse> {
    const mpId = state.shared.activeMediaPlanId;
    const allPrefs = (state.mediaPlanPref.ids as number[]).map(id => state.mediaPlanPref.entities[id]);
    const existingUIPayload: Partial<MediaPlanPref> = allPrefs.filter(pref => pref.pref === 'MAP UI SLICE')[0] || {};
    const mapUIPayload = EntityHelper.createPrefPayload(existingUIPayload, 'MAP UI SLICE', JSON.stringify(state.mapUI), mpId);

    return state.shared.mapPrefChanged
      ? this.restService.post(this.savePreferences, [mapUIPayload])
      : EMPTY;
  }
}
