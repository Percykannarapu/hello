import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RestResponse } from '../models/RestResponse';
import { AccountLocation } from '../models/AccountLocation';
import { GeocodingResponse } from '../models/GeocodingResponse';
import { GeofootprintMaster } from '../models/GeofootprintMaster';
import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';
import { Message } from 'primeng/primeng';
import 'rxjs/add/operator/map';
import { AmSite } from '../val-modules/targeting/models/AmSite';
import { MapService } from './map.service';
import { DefaultLayers } from '../models/DefaultLayers';
import { GeocodingAttributes } from '../models/GeocodingAttributes';
import { GeocodingResponseService } from '../val-modules/targeting/services/GeocodingResponse.service';
import { AppConfig } from '../app.config';
import { Points } from '../models/Points';
import { AuthService } from './auth.service';

@Injectable()
export class GeocoderService {

  private restResponse: RestResponse;
  private xcoord: number;
  private ycoord: number;
  private GeocodingResponse;
  public Msgs: Message[] = [];
  public allGraphicsOnMap: __esri.Graphic[] = new Array<__esri.Graphic>();

  constructor(public geocodingRespService: GeocodingResponseService,
              public http: HttpClient,
              private mapService: MapService,
              private config: AppConfig,
              private authService: AuthService) { //private messageService: MessageService,
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

    return this.http.post<RestResponse>(this.config.valServiceBase + 'v1/geocoder/singlesite', accountLocation);
  }

  multiplesitesGeocode(siteList: any[]) {
    // console.log('fired multiplGeocode in GeocoderService2:: ' + JSON.stringify(siteList, null, 2));
    return this.http.post<RestResponse>(this.config.valServiceBase + 'v1/geocoder/multiplesites', siteList);
  }

  saveGeofootprintMaster(geofootprintMaster: GeofootprintMaster) {
    console.log('fired saveGeofootprintMaster in GeocoderService ' + JSON.stringify(geofootprintMaster, null, 4));
    return this.http.post<RestResponse>(this.config.valServiceBase + 'v1/mediaexpress/base/geofootprintmaster/save', geofootprintMaster);
  }

  // create a PopupTemplate for the site that will be displayed on the map
  private async createPopup(site: GeocodingResponse, selector) : Promise<__esri.PopupTemplate> {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
    const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    const popupAttributesList: GeocodingAttributes[] = site.geocodingAttributesList;
    popupTemplate.title = `${selector}`;
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
        await this.createPopup(site, selector)
          .then(res => this.createGraphic(site, res, selector))
          .then(res => { graphics.push(res); this.allGraphicsOnMap.push(res); })
          .catch(err => { this.handleError(err); });
      }
      await this.geocodingRespService.updateLayer(graphics, selector)
        .then(res => { this.mapService.zoomOnMap(this.allGraphicsOnMap); })
        .then(res => {
          this.geocodingRespService.locToEntityMapping(sitesList, selector);
          this.geocodingRespService.pointsPlotted.next(selector);
          //this.successMsg();
          this.geocodingRespService.createGrid();
        })
        .catch(err => this.handleError(err));
    } catch (error) {
      this.handleError(error);
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

  async calcMultiPointHomeGeo(siteList: GeocodingResponse[]){
    const loader = EsriLoaderWrapperService.esriLoader;
        const [geometryEngine, Extent]
                = await loader.loadModules(['esri/geometry/geometryEngine', 'esri/geometry/Extent']);
    console.log('calcMultiPointHomeGeo:::');
    let zipFeatureSet: __esri.FeatureSet = null;
    let atzFeatureSet: __esri.FeatureSet = null;
    let pcrFeatureSet: __esri.FeatureSet = null;
    let d_atzFeatureSet: __esri.FeatureSet = null;
    let b_dmaFeatureSet: __esri.FeatureSet = null;
    let c_dmaFeatureSet: __esri.FeatureSet = null;
    const color = {
      a: 1,
      r: 35,
      g: 93,
      b: 186
    };
    const geometryList: __esri.Geometry[] = [];
    const latList: number[] = [];
    const lonList: number[] = [];
    for (const pt of siteList){
        lonList.push(pt.longitude);   /// this is X
        latList.push(pt.latitude);   /// this is y

        await this.mapService.createGraphic(pt.latitude, pt.longitude, color).then(res => {
          geometryList.push(res.geometry);
        });
    }

    const minX = Math.min(...lonList);
    const minY = Math.min(...latList);
    const maxX = Math.max(...lonList);
    const maxY = Math.max(...latList);
    let extent: __esri.Extent;
    extent = new Extent({
      xmin: minX,
      ymin: minY,
      xmax: maxX,
      ymax: maxY,
      spatialReference: {
          wkid: 4326
      }
    });
    if (extent.width === 0) {
      extent.xmin = extent.xmin - 0.15;
      extent.xmax = extent.xmax + 0.15;
    }
    if (extent.height === 0) {
        extent.ymin = extent.ymin - 0.15;
        extent.ymax = extent.ymax + 0.15;
    }
    const fLyrList: __esri.FeatureLayer[] = [];
    await this.mapService.getAllFeatureLayers().then(list => {
      if (list.length > 0) {
        for (const layer of list) {
          if ((layer.portalItem != null) && (layer.portalItem.id === this.config.layerIds.zip.topVars.id ||
            layer.portalItem.id === this.config.layerIds.atz.topVars.id ||
            layer.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id ||
            layer.portalItem.id === this.config.layerIds.pcr.topVars.id ||
            layer.portalItem.id === this.config.layerIds.counties.boundaries.id ||
            layer.portalItem.id === this.config.layerIds.dma.boundaries.id)) {
               fLyrList.push(layer);
          }
        }
      }
    });

    //let polyFeaturesetList : __esri.FeatureSet[] = [];
     await this.mapService.multiHomeGeocode(fLyrList, geometryList, extent).then(resList => {
        for (const polyFeatureSet of resList){
          if (polyFeatureSet.features[0].layer.title.toLocaleLowerCase().includes('zip')){
            zipFeatureSet = polyFeatureSet;
          }
          if (polyFeatureSet.features[0].layer.title === 'ATZ_Top_Vars_CopyAllData'){
            atzFeatureSet = polyFeatureSet;
          }
          if (polyFeatureSet.features[0].layer.title.toLocaleLowerCase().includes('pcr')){
            pcrFeatureSet = polyFeatureSet;
          }
          if (polyFeatureSet.features[0].layer.title === 'DIG_ATZ_Top_Vars_CopyAllData'){
            d_atzFeatureSet = polyFeatureSet;
          }
          if (polyFeatureSet.features[0].layer.title.toLocaleLowerCase().includes('county')){
            c_dmaFeatureSet = polyFeatureSet;
          }
          if (polyFeatureSet.features[0].layer.title.toLocaleLowerCase().includes('dma')){
            b_dmaFeatureSet = polyFeatureSet;
          }
        }
     });



   /* for (const lyr of fLyrList){
      if (lyr.portalItem.id === this.config.layerIds.zip.topVars){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('zipFeatureSet::::' , res);
          zipFeatureSet = res;});
      }
      if (lyr.portalItem.id === this.config.layerIds.atz.topVars){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('atzFeatureSet::::' , res);
          atzFeatureSet = res;});
      }
      if (lyr.portalItem.id === this.config.layerIds.pcr.topVars){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('pcrFeatureSet::::' , res);
          pcrFeatureSet = res;});
      }
      if (lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('d_atzFeatureSet::::' , res);
          d_atzFeatureSet = res;});
      }
      if (lyr.portalItem.id === this.config.layerIds.dma.boundaries){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('b_dmaFeatureSet::::' , res);
          b_dmaFeatureSet = res;});
      }
      if (lyr.portalItem.id === this.config.layerIds.dma.counties){
        await this.mapService.multiHomeGeocode(lyr, geometryList, extent).then(res => {
          console.log('c_dmaFeatureSet::::' , res);
          c_dmaFeatureSet = res;});
      }
    }*/

    const geoCodedSiteList: GeocodingResponse[] = [];
    console.log('processing sites::');
    for (const site of siteList) {
          let geoAttr: GeocodingAttributes;
          const home_geo_issue: string = 'N';
          let graphic: __esri.Graphic;
          await this.mapService.createGraphic(site.latitude, site.longitude, color).then(res => {
            graphic = res;
          });
          for (const lyr of fLyrList){
            geoAttr = new GeocodingAttributes();
            if (lyr.portalItem.id === this.config.layerIds.counties.boundaries.id){
                for (const graphic1 of c_dmaFeatureSet.features){
                    if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                        geoAttr.attributeName = 'HOME COUNTY';
                        geoAttr.attributeValue = graphic1.attributes.county_nam;
                        site.geocodingAttributesList.push(geoAttr);
                    }
                }
            }
            if (lyr.portalItem.id === this.config.layerIds.dma.boundaries.id){
              for (const graphic1 of b_dmaFeatureSet.features){
                  if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                      geoAttr.attributeName = 'HOME DMA';
                      geoAttr.attributeValue = graphic1.attributes.dma_name;
                      site.geocodingAttributesList.push(geoAttr);
                  }
              }
            }
            if (lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id){
              for (const graphic1 of d_atzFeatureSet.features){
                  if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                      geoAttr.attributeName = 'HOME DIGITAL ATZ';
                      geoAttr.attributeValue = graphic1.attributes.geocode;
                      site.geocodingAttributesList.push(geoAttr);
                  }
              }
            }
            if (lyr.portalItem.id === this.config.layerIds.atz.topVars.id){
              for (const graphic1 of atzFeatureSet.features){
                  if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                      geoAttr.attributeName = 'HOME ATZ';
                      geoAttr.attributeValue = graphic1.attributes.geocode;
                      site.geocodingAttributesList.push(geoAttr);
                  }
              }
            }
            if (lyr.portalItem.id === this.config.layerIds.zip.topVars.id){
              for (const graphic1 of zipFeatureSet.features){
                  if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                      geoAttr.attributeName = 'HOME ZIP';
                      geoAttr.attributeValue = graphic1.attributes.geocode;
                      site.geocodingAttributesList.push(geoAttr);
                  }
              }
            }
            if (lyr.portalItem.id === this.config.layerIds.pcr.topVars.id){
              for (const graphic1 of pcrFeatureSet.features){
                  if (geometryEngine.intersects(graphic1.geometry, graphic.geometry)){
                      geoAttr.attributeName = 'HOME PCR';
                      geoAttr.attributeValue = graphic1.attributes.geocode;
                      site.geocodingAttributesList.push(geoAttr);
                  }
              }
            }
          }
      geoCodedSiteList.push(site);
    }
    return geoCodedSiteList;
  }

 /* async getToken() {
    let token = null;
    await this.authService.getOAuthToken('reddyn','password').toPromise().then(tokenResponse => {
         console.log('tokenResponse::', tokenResponse);
         token = tokenResponse.access_token;
     });
     console.log('token:::', token);
     return token;
  }*/



  //   private async handleError(error: Error) {
  //   this.messageService.add({ severity: 'error', summary: 'Geo Coding Error', detail: `${error}` });
  // }
}