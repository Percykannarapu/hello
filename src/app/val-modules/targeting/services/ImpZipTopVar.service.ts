/** A TARGETING domain data service representing the table: IMPOWER.IMP_ZIP_TOP_VARS
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 ** NOTE: This class is generated only once and may be updated by developers.
 **
 ** ImpZipTopVar.service.ts generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpZipTopVar } from '../models/ImpZipTopVar';
import { RestDataService } from './../../common/services/restdata.service';
import { DataStore } from '../../common/services/datastore.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ImpRadLookup } from '../models/ImpRadLookup';

const dataUrl = 'v1/targeting/base/impziptopvar/search?q=impZipTopVar';

@Injectable()
export class ImpZipTopVarService extends DataStore<ImpZipTopVar>
{
   constructor(private restDataService: RestDataService) {super(restDataService, dataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}