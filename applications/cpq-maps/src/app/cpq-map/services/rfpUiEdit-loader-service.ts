import { Injectable } from '@angular/core';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RfpUiEdit } from '../../val-modules/mediaexpress/models/RfpUiEdit';
import { NormalizedPayload } from '../models/NormalizedPayload';
import { RfpUiEditPayload } from '../state/payload-models/RfpUiEdit';

@Injectable({
   providedIn: 'root'
 })
 export class RfpUiEditLoaderService {
 
   readonly loadUrl: string = 'v1/mediaexpress/base/mediaplan';
   readonly searchQuery: string = 'search?q=rfpUiEdit';

   constructor(private restService: RestDataService) {}
 
   loadRfpUiEdit(id: number) : Observable<RfpUiEdit[]> {
     if (id == null || id < 0) return EMPTY;
     return this.restService.get(`${this.loadUrl}/${id}/${this.searchQuery}`).pipe(
       map(response => response.payload.rows as RfpUiEdit[]),
       map(rows => rows.filter(r => r.siteId != null))
     );
   }

   public normalize(rows: RfpUiEditPayload[]) : NormalizedPayload {
      const normalizedPayload: NormalizedPayload = {};
      const rfpUiEdits: Array<RfpUiEdit> = [];
      for (const row of rows) {
         const rfpUiEdit: RfpUiEdit = Object.assign({}, row, {
           setTreeProperty: null,
           removeTreeProperty: null,
           convertToModel: null,
           baseStatus: null
         });
         rfpUiEdits.push(rfpUiEdit);
      }
      normalizedPayload.rfpUiEdits = rfpUiEdits;
      return normalizedPayload;
   }
}
