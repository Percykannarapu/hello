import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataStore } from '../../common/services/datastore.service';
import { RestDataService } from '../../common/services/restdata.service';

const projectTrakerUrl = 'v1/targeting/base/impimsprojectsview/search?q=impImsProjectsView';

@Injectable()
export class ImpProjectTrackerService extends DataStore<any>{

    constructor(private restDataService: RestDataService) {super(restDataService, projectTrakerUrl); }

    private handleError(error: Response)
   {
      const errorMsg = `Status code: ${error.status} on url ${error.url}`;
      console.error(errorMsg);
      return Observable.throw(errorMsg);
   }
    
}