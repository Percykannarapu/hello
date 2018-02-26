/** A temporary service to manage the ImpDiscoveryUI model data
 **
 ** This class contains code operates against data in its data store.
 ** See the contents of val-modules/common/services/datastore.service.ts to see built in
 ** methods that all data services have.
 **
 **/
import { RestDataService } from '../../../src/app/val-modules/common/services/restdata.service';
import { DataStore } from '../../../src/app/val-modules/common/services/datastore.service';
import { Injectable, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';

const dataUrl = '';

@Injectable()
export class ImpDiscoveryService extends DataStore<ImpDiscoveryUI>
{
    
   constructor(private restDataService: RestDataService) {
      super(restDataService, dataUrl); 

       const discoveryDefaults: ImpDiscoveryUI = new ImpDiscoveryUI (
         {
            productCode:          'Email',
            industryCategoryCode: '',
            analysisLevel:        '', //removed the analysis value from default ZIP
            selectedSeason:       'WINTER',
            cpm:                  null,
            totalBudget:          null,
            circBudget:           null,
            includeNonWeekly:     true,
            includePob:           false,
            includeAnne:          true,
            includeSolo:          false
         }
      );
      this.add([discoveryDefaults]);      
      console.log('impDiscoveryUI.service - constructor - initialized defaults', discoveryDefaults);
   }
   
   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}