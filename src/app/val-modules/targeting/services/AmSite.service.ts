import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { of } from 'rxjs/observable/of';
// import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';


// Import Core Modules
import { CONFIG } from '../../../core';
import { MessageService } from '../../common/services/message.service';

// Import Models
import { AmSite } from '../models/AmSite';
import { InMemoryStubService } from '../../../api/in-memory-stub.service';

const amSitesUrl = 'api/amsites'; // .json'; // CONFIG.baseUrls.geofootprintGeos;

@Injectable()
export class AmSiteService extends InMemoryStubService
{
//   onDbReset = this.messageService.state;

   constructor(private http: HttpClient,
               private messageService: MessageService)
   {
      super();
//      this.messageService.state.subscribe(state => this.getAmSites());
   }

   private log(message: string) {
//      this.messageService.add({severity: 'success', summary: 'AmSiteService: ' + message, detail: 'Via MessageService'});
   }  

   public getAmSites() : Observable<AmSite[]> {
      console.log('getAmSites fired (Observable)');
      return of(this.amSites);
   }
    
  public XXXgetAmSites() : AmSite[]
  {
     console.log('getAmSites fired');

     this.createDb();
//    return <Observable<GeofootprintGeo[]>>this.http.get<GeofootprintGeo[]>(geofootprintGeosUrl); //  .http.get<GeofootprintGeo[]>()
//    return <Observable<GeofootprintGeo[]>>this.http.get<GeofootprintGeo[]>(geofootprintGeosUrl); //  .http.get<GeofootprintGeo[]>()

/*    return <Observable<GeofootprintGeo[]>>this.http
      .get(geofootprintGeosUrl)
      .map(res => this.extractData<GeofootprintGeo[]>(res));*/
//      .catch()
//      .finally(() => this.logEnd());

      return this.amSites;
      // this.http.get('/api/items').subscribe(data => {
      //    // Read the result field from the JSON response.
      //    this.results = data['results'];
      // });
  }

  logEnd() {
    console.log('getAmSites ended');
  }

  logMsg(p_msg: string) {
    console.log(p_msg);
  }

/*  
  getGeofootprintGeosORIG() : Observable<AmSite[]>
  {
    return <Observable<AmSite[]>>this.http
                                     .get(amSitesUrl)
                                     .map(res => this.extractData<AmSite[]>(res)
                                     );
//              .catch(this.exceptionService.catchBadResponse)
//              .finally(() => this.spinnerService.hide());
   //  return this.http
   //             .get(geofootprintGeosUrl)
   //             .map(response => response.json().data as GeofootprintGeo[]);
  }
*/

  private handleError(error: any) : Promise<any>
  {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  private extractData<T>(res: Response)
  {
    console.log('in extractData');
    if (res.status < 200 || res.status >= 300) {
      console.log('Throwing error.  status: ' + res.status);
      throw new Error('Bad response status: ' + res.status);
    }
    console.log('response was not in error');
    console.log('res.status: ' + res.status);
    console.log('res.statusText: ' + res.statusText);
    console.log('res.headers: ' + res.headers);
    console.log('res.text: ' + res.text);
//    console.log('res.totalBytes: ' + res.totalBytes);
    console.log('res.type: ' + res.type);
    console.log('res.json: ' + res.json()[0]);
    //  console.log('json: ' + res.json ? res.json.toString() : 'no json');
    const body = res.json ? res.json() : null;
    if ( body == null ) {
      console.log('body was null');
    } else {
      console.log('body was not null');
      console.log('res = ' + res.json.toString());
//      console.log('body.data = ' + <T>body.data);
    }

    console.log('body: ' + body);
//    console.log('returning: ' + <T>(body && body.data));
    return <T>(body || {});
//    return <T>(body && body.data || {});    
  }
}