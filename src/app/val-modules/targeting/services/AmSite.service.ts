import { Injectable, Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { EsriLoaderWrapperService } from '../../../services/esri-loader-wrapper.service';
import { MapService } from '../../../services/map.service';
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
export class AmSiteService 
{
   private subject: Subject<AmSite> = new Subject<AmSite>();
   public  amSites: Array<AmSite> = new Array<AmSite>();
   public  unselectedAmSites: Array<AmSite> = new Array<AmSite>();
   private mapService: MapService;

   public addSites(amSites: AmSite[])
   {
      const sites = Array.from(this.amSites);
      for (const amSite of amSites)
      {
         this.amSites = [...this.amSites, amSite];
         this.unselectedAmSites = [...this.unselectedAmSites, amSite];
         this.subject.next(amSite);
      }

      this.logSites();
   }
//   public addSites(amSites: AmSite[]) {
//    for (const amSite of amSites) {
//      const sites = Array.from(this.amSites);
//      sites.push(amSite);
//      this.amSites = sites;
//      this.subject.next(amSite);
//    }
//      this.amSites = sites;
//      this.subject.next(amSite);
//    }
//  }
 
   // Remove sites from the amSites array and add them to unselectedAmSites
   public unselectSites(unselectedAmSites: AmSite[])
   {
      for (const amSite of unselectedAmSites)
      {
         const i = this.amSites.indexOf(amSite);

         this.amSites = [
            ...this.amSites.slice(0, i),
            amSite,
            ...this.amSites.slice(i + 1)
         ];
      }

      // TODO: Indicate a removal to subscribers
   }

   // create a Graphic object for the site that can be displayed on the map
   public async createGraphic(amSite: AmSite, popupTemplate: __esri.PopupTemplate) : Promise<__esri.Graphic> {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [Graphic] = await loader.loadModules(['esri/Graphic']);
      let graphic: __esri.Graphic = new Graphic();

      // give our site a blue color
      const color = {
         a: 1,
         r: 35,
         g: 93,
         b: 186
      };

      await this.mapService.createGraphic(amSite.ycoord, amSite.xcoord, color, popupTemplate)
         .then(res => {
            graphic = res;
         });
      return graphic;
   }

   public observeSites() : Observable<AmSite> {
      return this.subject.asObservable();
   }

//   onDbReset = this.messageService.state;

   constructor(private http: HttpClient,
               private messageService: MessageService)
   {
      this.mapService = new MapService();
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

//     this.createDb();
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

   // Debug methods
   logEnd() {
      console.log('getAmSites ended');
   }

   logMsg(p_msg: string) {
      console.log(p_msg);
   }

   public logSites()
   {
      console.log('--# SELECTED AMSITES');
      for (const amSite of this.amSites)
         console.log('  ' + amSite);

      console.log('--# UNSELECTED AMSITES');
      for (const amSite of this.unselectedAmSites)
         console.log('  ' + amSite);
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