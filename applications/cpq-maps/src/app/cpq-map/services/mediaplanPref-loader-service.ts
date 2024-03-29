import { Injectable } from '@angular/core';
import { RestDataService } from 'src/app/val-modules/common/services/restdata.service';
import { Observable, EMPTY } from 'rxjs';
import { map } from 'rxjs/operators';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { MediaPlanPrefPayload } from '../state/payload-models/MediaPlanPref';
import { MediaPlanPref } from 'src/app/val-modules/mediaexpress/models/MediaPlanPref';

@Injectable({
  providedIn: 'root'
})
export class MediaPlanPrefLoaderService {
  readonly loadUrl: string = 'v1/mediaexpress/base/mediaplanpref';

  constructor(private restService: RestDataService) {}

  loadMediaPlanPref(id: number) : Observable<MediaPlanPrefPayload[]>{
    if (id == null || id < 0) return EMPTY;

    return this.restService.get(`${this.loadUrl}?prefgroup=cpq+maps&mediaPlanId=${id}`).pipe(
      map(response => response.payload as MediaPlanPrefPayload[])
    );
  }

  normalize(payload: MediaPlanPrefPayload[]) : NormalizedPayload {
    const normalizedPayload: NormalizedPayload = {};
    if (payload == null) throw new Error('Cannot normalize a null or undefined payload');

    const mediaPlanPrefs: MediaPlanPref[] = [];
    payload.forEach(prefPayload => {
      const mediaPlanPref: MediaPlanPref = Object.assign({}, prefPayload, {
        mediaPlan: null,
        setTreeProperty: null,
        removeTreeProperty: null,
        convertToModel: null,
        baseStatus: null
      });
      if (mediaPlanPref != null)
      mediaPlanPrefs.push(mediaPlanPref);
    });
    console.log('mediaPlanPrefs ===>', mediaPlanPrefs);
    normalizedPayload.mapPreferences = mediaPlanPrefs;
    return normalizedPayload;
  }
}
