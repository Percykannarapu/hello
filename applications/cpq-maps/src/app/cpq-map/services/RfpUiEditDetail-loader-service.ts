import { Injectable } from '@angular/core';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { RfpUiEditDetailPayload } from '../state/payload-models/RfpUiEditDetail';

@Injectable({
   providedIn: 'root'
 })
 export class RfpUiEditDetailLoaderService {
 
   readonly loadUrl: string = 'v1/mediaexpress/base/mediaplan';
   readonly searchQuery: string = 'search?q=rfpUiEditDetail';

   constructor(private restService: RestDataService) {}
 
   loadRfpUiEditDetail(id: number) : Observable<RfpUiEditDetail[]> {
     if (id == null || id < 0) return EMPTY;
     return this.restService.get(`${this.loadUrl}/${id}/${this.searchQuery}`).pipe(
       map(response => response.payload.rows as RfpUiEditDetail[]),
       map(rows => rows.filter(r => r.geocode != null))
     );
   }

   public normalize(rows: RfpUiEditDetailPayload[]) : NormalizedPayload {
      const normalizedPayload: NormalizedPayload = {};
      const rfpUiEditDetails: Array<RfpUiEditDetail> = [];
      for (const row of rows) {
         const rfpUiEditDetail: RfpUiEditDetail = Object.assign({}, row, {
           setTreeProperty: null,
           removeTreeProperty: null,
           convertToModel: null,
           baseStatus: null
         });
         rfpUiEditDetails.push(rfpUiEditDetail);
      }
      normalizedPayload.rfpUiEditDetails = rfpUiEditDetails;
      return normalizedPayload;
   }
}
