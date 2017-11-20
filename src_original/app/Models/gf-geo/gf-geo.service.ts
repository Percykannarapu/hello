import { Injectable } from '@angular/core';
// import { Headers, Http, Response } from '@angular/http';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/do';

// Import Core Modules
import { CONFIG, MessageService } from '../../core';

// Import Models
import { GeofootprintGeo } from './../geofootprintGeo.model';

// const geofootprintGeosUrl = '../../../api/geofootprintGeos';
const geofootprintGeosUrl = 'api/geofootprintGeos';

@Injectable()
export class GfGeoService {

  constructor(private http: HttpClient) { }

  getGeos(): Observable<GeofootprintGeo[]> {
    return this.http.get(geofootprintGeosUrl)
      .do(data => console.log(data)) // view results in the console
//      .map(res => res.json())
      .catch(this.handleError);
  }

/*
  getGeos(): Observable <any> {
    console.log('GfGeoService.getGeos fired');
    return this.http.get(geofootprintGeosUrl)
                    .subscribe*/
/*                    .map(response => response.json().contents)
                    .catch((err: Response|any) => {
                                                    return Observable.throw(err.statusText);
                                                  });*/
// }

  private handleError (error: any) {
    // In a real world app, we might send the error to remote logging infrastructure
    // and reformat for user consumption
    console.error(error); // log to console instead
    return Observable.throw(error);
  }
}
