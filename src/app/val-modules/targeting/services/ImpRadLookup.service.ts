import { DataStore } from '../../common/services/datastore.service';
import { RestDataService } from './../../common/services/restdata.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ImpRadLookup } from '../models/ImpRadLookup';

const radDataUrl = 'v1/targeting/base/impradlookup/search?q=impRadLookup';

@Injectable()
export class ImpRadLookupService extends DataStore<ImpRadLookup>
{
   constructor(private restDataService: RestDataService) {super(restDataService, radDataUrl); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}

   // We want ng modules probably by domain, that contain
   //    services and data stores
   // We want to layer on application logic on top this
   // These ng modules to be reused in other applications without change
   // Hide code complexity behind the store and/or service - I don't need to see it to use it.

   // Choices
   // a) Inheritence
   //    Easy, hides code
   //    Makes it hard to overload the methods
   //    While you get all of the store methods for free, you would have to 
   //    create a new method to add application validation, and there is nothing stopping a developer
   //    Actually probably would need some sort of delegation to accomplish validation
   //    from bypassing that.
   //    Store would have to handle database level validation and cannot be bypassed

   // b) Composition

   // c) Application makes its on version of service
   //    An application would have its own data service and
   //    would have access to a domain service via composition
   //
   //    Application could then perform its own validation before calling the domain service
   //
   //    But, this would necessitate each application duplicating domain services (potentially)
   //    Same problem exists where developer could just bypass application logic in favor of domain (unrestricted) logic