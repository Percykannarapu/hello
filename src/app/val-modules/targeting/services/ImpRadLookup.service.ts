import { RestDataService } from './../../common/services/restdata.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ImpRadLookup } from '../models/ImpRadLookup';
import { ImpRadLookupStore } from './ImpRadLookup.store';

const radDataUrl = 'v1/targeting/base/impradlookup/search?q=impRadLookup';

@Injectable()
export class ImpRadLookupService extends ImpRadLookupStore 
{
   constructor(public http: HttpClient, private restDataService: RestDataService) {super(http, restDataService); }

   private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
}