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

  /*normalizeProject(payload: MediaPlanGroupPayload) : MediaPlanGroup {
    return normalize(payload);
  }

  denormalizeProject(state: MediaPlanGroup) : MediaPlanGroupPayload {
    return denormalize(state);
  }*/
}
