import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RestResponse } from '../Models/RestResponse';
import { AccountLocation } from '../Models/AccountLocation';
import { GeocodingResponse } from '../Models/GeocodingResponse';
import { GeofootprintMaster } from '../Models/GeofootprintMaster';
import { EsriLoaderWrapperService } from '../services/esri-loader-wrapper.service';

import 'rxjs/add/operator/map';
import { AmSite } from '../val-modules/targeting/models/AmSite';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { Response } from '@angular/http/src/static_response';
import { AccountLocations } from '../Models/AccountLocations';
import { MapService } from './map.service';
//import { MessageService } from 'primeng/components/common/messageservice';
import { AmSiteService } from '../val-modules/targeting/services/AmSite.service';
import { DefaultLayers } from '../Models/DefaultLayers';

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;

  constructor(public http: HttpClient, private mapService: MapService,
               private amSiteService: AmSiteService) { //private messageService: MessageService,
    console.log('Fired GeocoderService ctor');
  }

  // invoke the geocoding service in Fuse
  geocode(amSite: AmSite){
    const accountLocation: AccountLocation = {
      street: amSite.address,
      city: amSite.city,
      state: amSite.state,
      postalCode: amSite.zip
    };
// _gridOptions:Map<string, Array<string>> = new Map([["1", ["test"]], ["2", ["test2"]]])    
    
   return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/singlesite', accountLocation);
  }

  multiplesitesGeocode(siteList: any[]){
    //console.log('fired multiplGeocode in GeocoderService2:: ' + JSON.stringify(siteList, null, 2));   
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/multiplesites', siteList);
  }
  
  saveGeofootprintMaster(geofootprintMaster: GeofootprintMaster){
    console.log('fired saveGeofootprintMaster in GeocoderService ' + JSON.stringify(geofootprintMaster, null, 4));    
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/mediaexpress/base/geofootprintmaster/save', geofootprintMaster);
  }

  // create a PopupTemplate for the site that will be displayed on the map
  private async createPopup(amSite: AmSite) : Promise<__esri.PopupTemplate> {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
    const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    popupTemplate.title = `Site`,
    popupTemplate.content =
      `<table>
    <tbody>
    <tr><th>Name</th><td>${amSite.name ? amSite.name : ''}</td></tr>
    <tr><th>Number</th><td>${amSite.siteId ? amSite.siteId : ''}</td></tr>
    <tr><th>Street</th><td>${amSite.address}</td></tr>
    <tr><th>City</th><td>${amSite.city}</td></tr>
    <tr><th>State</th><td>${amSite.state}</td></tr>
    <tr><th>Zip</th><td>${amSite.zip}</td></tr>
    <tr><th>Latitude</th><td>${amSite.ycoord}</td></tr>
    <tr><th>Longitude</th><td>${amSite.xcoord}</td></tr>
    </tbody>
    </table>`;

    return popupTemplate;
  }

// create a Graphic object for the site that will be displayed on the map
private async createGraphic(amSite: AmSite, popupTemplate: __esri.PopupTemplate, selector) : Promise<__esri.Graphic> {
  const loader = EsriLoaderWrapperService.esriLoader;
  const [Graphic] = await loader.loadModules(['esri/Graphic']);
  let graphic: __esri.Graphic = new Graphic();

  // give our site a blue color
  // const color = {
  //   a: 1,
  //   r: 35,
  //   g: 93,
  //   b: 186
  // };
  let color;
  if(selector === 'Site'){
    color = {
      a: 1,
      r: 35,
      g: 93,
      b: 186
    };
  }else{
    color = {
      a: 1,
      r: 255,
      g: 0,
      b: 0
    };
  }
  

  await this.mapService.createGraphic(amSite.ycoord, amSite.xcoord, color, popupTemplate, amSite.pk)
    .then(res => {
      graphic = res;
    });
  return graphic;
}

  // add all of the geocoded sites in the amSites array to the map
  public async addSitesToMap(amSites: AmSite[], selector) {
    try {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [Graphic] = await loader.loadModules(['esri/Graphic']);
      const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
      for (const amSite of amSites) {
        console.log('creating popup for site: ' + amSite.pk);
        await this.createPopup(amSite)
          .then(res => this.createGraphic(amSite, res, selector))
          .then(res => { graphics.push(res); });
          //.catch(err => this.handleError(err));
      }
      await this.updateLayer(graphics)
        .then(res => { this.mapService.zoomOnMap(graphics); })
        .then(res => {
          if (selector === 'Site'){
            this.amSiteService.add(amSites);
          }else{
            this.amSiteService.addCompetitors(amSites);
          }
          
        });
        // .catch(err => this.handleError(err));
    } catch (error) {
      // this.handleError(error);
    }
  }

// draw the site graphics on the Sites layer
private async updateLayer(graphics: __esri.Graphic[]) {
  this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES);
}

//   private async handleError(error: Error) {
//   this.messageService.add({ severity: 'error', summary: 'Geo Coding Error', detail: `${error}` });
// }
}