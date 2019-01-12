import { Injectable } from '@angular/core';
import { MediaPlanGroupPayload } from '../state/payload-models/MediaPlanGroup';
import { EMPTY, Observable } from 'rxjs';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/operators';
import { MediaPlanGroup } from '../../val-modules/mediaexpress/models/MediaPlanGroup';

@Injectable({
  providedIn: 'root'
})
export class MediaPlanGroupLoaderService {

  readonly loadUrl: string = 'v1/mediaexpress/base/mediaplangroup/load';
  readonly saveUrl: string = 'v1/mediaexpress/base/mediaplangroup/save';

  constructor(private restService: RestDataService) {}

  loadMediaPlanGroup(id: number) : Observable<MediaPlanGroupPayload> {
    if (id == null || id < 0) return EMPTY;
    return this.restService.get(`${this.loadUrl}/${id}`).pipe(
      map(response => response.payload as MediaPlanGroupPayload)
    );
  }

  saveMediaPlanGroup(project: MediaPlanGroupPayload) : Observable<number> {
    return this.restService.post(this.saveUrl, project).pipe(
      map(response => response.payload)
    );
  }

  normalizeProject(payload: MediaPlanGroupPayload) : MediaPlanGroup {
    const mediaPlanGroup = new MediaPlanGroup();
    mediaPlanGroup.mediaPlanGroupId = payload.mediaPlanGroupId;
    mediaPlanGroup.createUser = payload.createUser;
    mediaPlanGroup.createDate = payload.createDate;
    mediaPlanGroup.groupName = payload.groupName;
    if (payload.advertiserInfos != null)
      payload.advertiserInfos.forEach(ai => mediaPlanGroup.advertiserInfos.push(ai.advertiserInfoId));
    if (payload.mediaPlans != null)
      payload.mediaPlans.forEach(mp => mediaPlanGroup.mediaPlans.push(mp.mediaPlanId));
    return mediaPlanGroup;
  }

  /*denormalizeProject(state: MediaPlanGroup) : MediaPlanGroupPayload {
    return denormalize(state);
  }*/
}
