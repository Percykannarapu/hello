import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RestResponse } from '../models/RestResponse';
import { AccountLocation } from '../models/AccountLocation';
import { GeocodingResponse } from '../models/GeocodingResponse';
import { GeofootprintMaster } from '../models/GeofootprintMaster';
import { EsriLoaderWrapperService } from '../services/esri-loader-wrapper.service';
import { GrowlModule, Message } from 'primeng/primeng';
import 'rxjs/add/operator/map';
import { AmSite } from '../val-modules/targeting/models/AmSite';
import { RequestOptionsArgs } from '@angular/http/src/interfaces';
import { Response } from '@angular/http/src/static_response';
import { AccountLocations } from '../models/AccountLocations';
import { MapService } from './map.service';
//import { MessageService } from 'primeng/components/common/messageservice';
//import { AmSiteService } from '../val-modules/targeting/services/AmSite.service';
import { DefaultLayers } from '../models/DefaultLayers';
import { GeocodingAttributes } from '../models/GeocodingAttributes';
import { GeocodingResponseService } from '../val-modules/targeting/services/GeocodingResponse.service';
import { AppConfig } from '../app.config';

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;
  public Msgs: Message[] = [];
  public graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
  public displaySpinnerMessage: string = 'Geocoding inprocess';

  constructor(public geocodingRespService: GeocodingResponseService, 
              public http: HttpClient, 
              private mapService: MapService,
              private config: AppConfig
  ) { //private messageService: MessageService,
    console.log('Fired GeocoderService ctor');
  }

  // invoke the geocoding service in Fuse
  geocode(amSite: AmSite) {
    const accountLocation: AccountLocation = {
      street: amSite.address,
      city: amSite.city,
      state: amSite.state,
      postalCode: amSite.zip
    };
    // _gridOptions:Map<string, Array<string>> = new Map([["1", ["test"]], ["2", ["test2"]]])    

    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/singlesite', accountLocation);
  }

  multiplesitesGeocode(siteList: any[]) {
    // console.log('fired multiplGeocode in GeocoderService2:: ' + JSON.stringify(siteList, null, 2));   
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/geocoder/multiplesites', siteList);
  }

  saveGeofootprintMaster(geofootprintMaster: GeofootprintMaster) {
    console.log('fired saveGeofootprintMaster in GeocoderService ' + JSON.stringify(geofootprintMaster, null, 4));
    return this.http.post<RestResponse>('https://servicesdev.valassislab.com/services/v1/mediaexpress/base/geofootprintmaster/save', geofootprintMaster);
  }

  // create a PopupTemplate for the site that will be displayed on the map
  private async createPopup(site: GeocodingResponse) : Promise<__esri.PopupTemplate> {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
    const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    const popupAttributesList: GeocodingAttributes[] = site.geocodingAttributesList;
    popupTemplate.title = `Site`;
    let template = `<table> <tbody>`;
    for (const popupAttribute of popupAttributesList) {
      template = template + `<tr><th>${popupAttribute.attributeName.toUpperCase()}</th><td>${popupAttribute.attributeValue}</td></tr>`;
    }
    template = template + `</tbody> </table>`;
    popupTemplate.content = template;

    return popupTemplate;
  }

  // create a Graphic object for the site that will be displayed on the map
  private async createGraphic(site: GeocodingResponse, popupTemplate: __esri.PopupTemplate, selector) : Promise<__esri.Graphic> {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Graphic] = await loader.loadModules(['esri/Graphic']);
    let graphic: __esri.Graphic = new Graphic();

    let color;
    if (selector === 'Site') {
      color = {
        a: 1,
        r: 35,
        g: 93,
        b: 186
      };
    } else {
      color = {
        a: 1,
        r: 255,
        g: 0,
        b: 0
      };
    }

    await this.mapService.createGraphic(site.latitude, site.longitude, color, popupTemplate, Number(site.number))
      .then(res => {
        graphic = res;
      });
    return graphic;
  }

  // add all of the geocoded sites in the  array to the map
  public async addSitesToMap(sitesList: GeocodingResponse[], selector) {
    try {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [Graphic] = await loader.loadModules(['esri/Graphic']);
      const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
      for (const site of sitesList) {
        //console.log('creating popup for site: ' + amSite.pk);
        await this.createPopup(site)
          .then(res => this.createGraphic(site, res, selector))
          .then(res => { graphics.push(res); })
          .catch(err => { this.handleError(err); });
      }
      await this.updateLayer(graphics, selector)
        .then(res => { this.mapService.zoomOnMap(graphics); })
        .then(res => {
          this.geocodingRespService.locToEntityMapping(sitesList, selector);
          this.geocodingRespService.pointsPlotted.next();
        })
        .then(res => this.geocodingRespService.createGrid())
        .catch(err => this.handleError(err));
    } catch (error) {
      this.handleError(error);
    }
  }
  //Calculate home geos for the response list
  async calculateHomeGeo(siteList: GeocodingResponse[]) {

    const color = {
      a: 1,
      r: 35,
      g: 93,
      b: 186

    };

    const fLyrList: __esri.FeatureLayer[] = [];
    await this.mapService.getAllFeatureLayers().then(list => {
      if (list.length > 0) {
        for (const layer of list) {
          if (layer.portalItem.id === this.config.layerIds.zip.topVars || 
              layer.portalItem.id === this.config.layerIds.atz.topVars || 
              layer.portalItem.id === this.config.layerIds.atz.digitalTopVars) {
            fLyrList.push(layer);
          }
        }
      }
    });


    for (const site of siteList) {

      for (const llyr of fLyrList) {
        this.displaySpinnerMessage = 'Calculating HomeGeocodes in process';

        let home_geo = null;
        const geoAttr: GeocodingAttributes = new GeocodingAttributes();
        let graphic: __esri.Graphic;
        await this.mapService.createGraphic(site.latitude, site.longitude, color).then(res => {
          graphic = res;
        });
        await this.mapService.getHomeGeocode(llyr, graphic).then(res => {
          home_geo = res.get('home_geo');
          if (llyr.portalItem.id === this.config.layerIds.zip.topVars) {
            geoAttr.attributeName = 'Home ZIP';
            geoAttr.attributeValue = home_geo;
            site.geocodingAttributesList.push(geoAttr);
          }
          if (llyr.portalItem.id === this.config.layerIds.atz.topVars) {
            geoAttr.attributeName = 'Home ATZ';
            geoAttr.attributeValue = home_geo;
            site.geocodingAttributesList.push(geoAttr);
          }
          if (llyr.portalItem.id === this.config.layerIds.atz.digitalTopVars) {
            geoAttr.attributeName = 'Home DIGITAL ATZ';
            geoAttr.attributeValue = home_geo;
            site.geocodingAttributesList.push(geoAttr);
          }
        });
      }

    }


  }

  // draw the site graphics on the Sites layer
  private async updateLayer(graphics: __esri.Graphic[], selector) {
    if (selector === 'Site') {
      console.log('Adding sites from Upload:::');
      this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES);
    } else if (selector === 'Competitor') {
      console.log('Adding competitors from Upload:::');
      await this.mapService.updateFeatureLayer(graphics, DefaultLayers.COMPETITORS);
    }
  }
  private async handleError(error: Error) {
    const growlMessage: Message = {
      summary: 'Failed to geocode your address',
      severity: 'error',
      detail: error.message
    };
    this.Msgs.push(growlMessage);

    return;
  }

  //   private async handleError(error: Error) {
  //   this.messageService.add({ severity: 'error', summary: 'Geo Coding Error', detail: `${error}` });
  // }
}