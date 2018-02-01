/** A MEDIAPLANNING domain data service representing the table: IMPOWER.IMP_PP_TO_WRAP_PAGES
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpPpToWrapPage.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpPpToWrapPage } from '../models/ImpPpToWrapPage';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const dataUrl = 'v1/mediaplanning/base/imppptowrappage/search?q=impPpToWrapPage';

@Injectable()
export class ImpPpToWrapPageService extends DataStore<ImpPpToWrapPage>
{
   constructor(private restDataService: RestDataService) {super(restDataService, dataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}