import { Injectable, Component } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';    // See: https://github.com/ReactiveX/rxjs
import { of } from 'rxjs/observable/of';
import { Subject } from 'rxjs/Subject';
import { EsriLoaderWrapperService } from '../../../services/esri-loader-wrapper.service';
import { MapService } from '../../../services/map.service';
import { DefaultLayers } from '../../../Models/DefaultLayers';
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

   constructor(private http: HttpClient,
               private messageService: MessageService,
               private mapService: MapService)
   {
   }

   public add(amSites: AmSite[])
   {
      // For each site provided in the parameters
      for (const amSite of amSites)
      {
         // Add the site to the selected sites array
         this.amSites = [...this.amSites, amSite];

         // Add the site to the sites list array
         this.unselectedAmSites = [...this.unselectedAmSites, amSite];

         // Notifiy Observers
         this.subject.next(amSite);
      }

      // Debug log site arrays to the console
      this.logSites();
   }
 
   public remove (site: AmSite)
   {
      // Remove the site from the selected sites array
      let index = this.amSites.indexOf(site);
      this.amSites =  [...this.amSites.slice(0, index),
                       ...this.amSites.slice(index + 1)];

      // Remove the site from the sites list array
      index = this.unselectedAmSites.indexOf(site);
      this.unselectedAmSites =  [...this.unselectedAmSites.slice(0, index),
                                 ...this.unselectedAmSites.slice(index + 1)];

      // Remove site from the map (TODO: I think this should be handled by an observer)
      this.mapService.clearFeatureLayerAt(DefaultLayers.SITES, site.ycoord, site.xcoord);

      // Notifiy Observers
      this.subject.next(site);
   }
    
   public update (oldSite: AmSite, newSite: AmSite)
   {
      let index = this.amSites.indexOf(oldSite);
      this.amSites = [...this.amSites.slice(0, index),
//                     Object.assign({}, person, {age}),
                      newSite,
                      ...this.amSites.slice(index + 1)];

      index = this.unselectedAmSites.indexOf(oldSite);
      this.unselectedAmSites = [...this.unselectedAmSites.slice(0, index),
                                newSite,
                                ...this.unselectedAmSites.slice(index + 1)];
   }

   // Site was unselected outside of the service, eg. from a data table
   // Alert the subscribers of the removal
   public siteWasUnselected (amSite: AmSite)
   {
      this.mapService.clearFeatureLayerAt(DefaultLayers.SITES, amSite.ycoord, amSite.xcoord);
      this.subject.next(amSite);
   }

   // Site was selected outside of the service, eg. from a data table
   // Alert the subscribers of the addition
   public siteWasSelected (amSite: AmSite)
   {
      this.subject.next(amSite);
   }   
   
   public refreshMapSites()
   {
      console.log('refreshMapSites fired');
      this.mapService.clearFeatureLayer(DefaultLayers.SITES);
      
      // Reflect selected sites on the map
      this.addSelectedSitesToMap();
      console.log('refreshMapSites - cleared and set ' + this.amSites.length + ' sites.');
   }

   // Create a Graphic object for the site that can be displayed on the map
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

   // Create a PopupTemplate for the site that will be displayed on the map
   private async createSitePopup(amSite: AmSite) : Promise<__esri.PopupTemplate>
   {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
      const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
      popupTemplate.content = 'Name: ' + amSite.name + '<br>' +
      'Number: ' + amSite.siteId + '<br>' +
      'Street: ' + amSite.address + '<br>' +
      'City: ' + amSite.city + '<br>' +
      'State: ' + amSite.state + '<br>' +
      'Zip: ' + amSite.zip + '<br>' +
      'Latitude: ' + amSite.ycoord + '<br>' +
      'Longitude: ' + amSite.xcoord + '<br>';
      return popupTemplate;
   }

   // draw the site graphics on the Sites layer
   private async updateLayer(graphics: __esri.Graphic[]) {
      this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES);
   }
  
   // Add all of the selected sites to the map
   private async addSelectedSitesToMap()
   {
      try 
      {         
         const loader = EsriLoaderWrapperService.esriLoader;
         const [Graphic] = await loader.loadModules(['esri/Graphic']);
         const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
         for (const amSite of this.amSites) {
            await this.createSitePopup(amSite)
               .then(res => this.createGraphic(amSite, res))
               .then(res => { graphics.push(res); })
               .catch(err => this.handleError(err));
      }
      await this.updateLayer(graphics)
         .then(res => { this.mapService.zoomOnMap(graphics); })
//         .then(res => this.amSiteService.addSites(amSites))
         .catch(err => this.handleError(err));
      }
      catch (error)
      {
         this.handleError(error);
      }
   }

   public observeSites() : Observable<AmSite> {
      return this.subject.asObservable();
   }

//   onDbReset = this.messageService.state;

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