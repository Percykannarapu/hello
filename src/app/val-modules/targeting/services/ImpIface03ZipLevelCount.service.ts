/** A TARGETING domain data service representing the table: IMPOWER.IMP_IFACE03_ZIP_LEVEL_COUNTS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpIface03ZipLevelCount.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpIface03ZipLevelCount } from '../models/ImpIface03ZipLevelCount';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

const dataUrl = 'v1/targeting/base/impiface03ziplevelcount/search?q=impIface03ZipLevelCount';

@Injectable()
export class ImpIface03ZipLevelCountService extends DataStore<ImpIface03ZipLevelCount>
{
   constructor(private restDataService: RestDataService) {super(restDataService, dataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}