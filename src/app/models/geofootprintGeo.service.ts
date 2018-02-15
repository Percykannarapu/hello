import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs

import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';


// Import Core Modules
import { MessageService } from '../val-modules/common/services/message.service';

// Import Models
import { GeofootprintGeo } from './geofootprintGeo.model';

const geofootprintGeosUrl = 'api/geofootprintGeos';

@Injectable()
export class GeofootprintGeoService {
//  onDbReset = this.messageService.state;

  constructor(private http: Http,
              private messageService: MessageService) {
//    this.messageService.state.subscribe(state => this.getGeofootprintGeos());
  }

/*  getGeofootprintGeos(): Promise<GeofootprintGeo[]> {
    console.debug('in getGeofootprintGeos service');
    console.debug('geofootprintGeosUrl: ' + geofootprintGeosUrl);

    return this.http.get(geofootprintGeosUrl)
               .toPromise()
               .then(response => response.json().data as GeofootprintGeo[])
               .catch(this.handleError);
  }*/

  getGeofootprintGeos() {
//    return <Observable<GeofootprintGeo[]>>this.http.get<GeofootprintGeo[]>(geofootprintGeosUrl); //  .http.get<GeofootprintGeo[]>()
//    return <Observable<GeofootprintGeo[]>>this.http.get<GeofootprintGeo[]>(geofootprintGeosUrl); //  .http.get<GeofootprintGeo[]>()

/*    return <Observable<GeofootprintGeo[]>>this.http
      .get(geofootprintGeosUrl)
      .map(res => this.extractData<GeofootprintGeo[]>(res));*/
//      .catch()
//      .finally(() => this.logEnd());
  }

  logEnd() {
    console.log('getchars ended');
  }

  logMsg(p_msg: string) {
    console.log(p_msg);
  }

  getGeofootprintGeosORIG(): Observable<GeofootprintGeo[]> {
    return <Observable<GeofootprintGeo[]>>this.http
                                              .get(geofootprintGeosUrl)
                                              .map(res => this.extractData<GeofootprintGeo[]>(res)
                                            );
//              .catch(this.exceptionService.catchBadResponse)
//              .finally(() => this.spinnerService.hide());
/*    return this.http
               .get(geofootprintGeosUrl)
               .map(response => response.json().data as GeofootprintGeo[]);*/
  }

  private handleError(error: any): Promise<any> {
    console.error('An error occurred', error); // for demo purposes only
    return Promise.reject(error.message || error);
  }

  private extractData<T>(res: Response) {
    console.debug('in extractData');
    if (res.status < 200 || res.status >= 300) {
      console.debug('Throwing error.  status: ' + res.status);
      throw new Error('Bad response status: ' + res.status);
    }
    console.debug('response was not in error');
    console.debug('res.status: ' + res.status);
    console.debug('res.statusText: ' + res.statusText);
    console.debug('res.headers: ' + res.headers);
    console.debug('res.text: ' + res.text);
    console.debug('res.totalBytes: ' + res.totalBytes);
    console.debug('res.type: ' + res.type);
    console.debug('res.json: ' + res.json()[0]);
    //  console.debug('json: ' + res.json ? res.json.toString() : 'no json');
    const body = res.json ? res.json() : null;
    if ( body == null ) {
      console.debug('body was null');
    } else {
      console.debug('body was not null');
      console.debug('res = ' + res.json.toString());
      console.debug('body.data = ' + <T>body.data);
    }

    console.debug('body: ' + body);
    console.debug('returning: ' + <T>(body && body.data));
    return <T>(body && body.data || {});
  }
}
