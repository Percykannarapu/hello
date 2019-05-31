import { Injectable } from '@angular/core';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RfpUiEditWrap } from '../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { RfpUiEditWrapPayload } from '../state/payload-models/RfpUiEditWrap';

@Injectable({
   providedIn: 'root'
 })
 export class RfpUiEditWrapLoaderService {
 
   readonly loadUrl: string = 'v1/mediaexpress/base/mediaplan';
   readonly searchQuery: string = 'search?q=rfpUiEditWrap';

   constructor(private restService: RestDataService) {}
 
   loadRfpUiEditWrap(id: number) : Observable<RfpUiEditWrap[]> {
     if (id == null || id < 0) return EMPTY;
     return this.restService.get(`${this.loadUrl}/${id}/${this.searchQuery}`).pipe(
       map(response => response.payload.rows as RfpUiEditWrap[]),
       map(rows => rows.filter(r => r.wrapZone != null))
     );
   }

   public normalize(rows: RfpUiEditWrapPayload[]) : NormalizedPayload {
      const normalizedPayload: NormalizedPayload = {};
      const rfpUiEditWraps: Array<RfpUiEditWrap> = [];
      for (const row of rows) {
         const rfpUiEdit: RfpUiEditWrap = Object.assign({}, row, {
           setTreeProperty: null,
           removeTreeProperty: null,
           convertToModel: null,
           baseStatus: null
         });
         rfpUiEditWraps.push(rfpUiEdit);
      }
      normalizedPayload.rfpUiEditWraps = rfpUiEditWraps;
      return normalizedPayload;
   }
}
