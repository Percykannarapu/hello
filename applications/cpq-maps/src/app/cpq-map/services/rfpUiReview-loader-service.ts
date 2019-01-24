import { Injectable } from '@angular/core';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { EMPTY, Observable } from 'rxjs';
import { RfpUiReviewPayload } from '../state/payload-models/RfpUiReview';
import { map } from 'rxjs/operators';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { RfpUiReview } from '../../val-modules/mediaexpress/models/RfpUiReview';

@Injectable({
   providedIn: 'root'
 })
 export class RfpUiReviewLoaderService {
 
  readonly loadUrl: string = 'v1/mediaexpress/base/mediaplan';
  readonly searchQuery: string = 'search?q=rfpUiReview';
 
   constructor(private restService: RestDataService) {}
 
   public loadRfpUiReview(id: number) : Observable<RfpUiReviewPayload[]> {
     if (id == null || id < 0) return EMPTY;
     return this.restService.get(`${this.loadUrl}/${id}/${this.searchQuery}`).pipe(
       map(response => response.payload.rows as RfpUiReviewPayload[])
     );
   }

   public normalize(rows: RfpUiReviewPayload[]) : NormalizedPayload {
    const normalizedPayload: NormalizedPayload = {};
    const rfpUiReviews: Array<RfpUiReview> = [];
    for (const row of rows) {
       const rfpUiReview: RfpUiReview = Object.assign({}, row, {
         setTreeProperty: null,
         removeTreeProperty: null,
         convertToModel: null,
         baseStatus: null
       });
       rfpUiReviews.push(rfpUiReview);
    }
    normalizedPayload.rfpUiReviews = rfpUiReviews;
    return normalizedPayload;
 }
}