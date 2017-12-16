import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message } from 'primeng/primeng';
import { GeofootprintMaster } from '../../Models/GeofootprintMaster';
import { GeofootprintSite } from '../../Models/GeofootprintSite';
import { GeofootprintTaName } from '../../Models/GeofootprintTaName';
import { GeofootprintTradeArea } from '../../Models/GeofootprintTradeArea';
import { GeofootprintVar } from '../../Models/GeofootprintVar';
import { GeofootprintGeo } from '../../Models/geofootprintGeo.model';
import { AmSite } from '../../val-modules/targeting/models/AmSite';
import { RestResponse } from '../../Models/RestResponse';
import { DefaultLayers } from '../../Models/DefaultLayers';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Rx';




@Component({
  providers: [GeocoderService, MapService],
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {

  public street: string;
  public city: string;
  public state: string;
  public zip: number;
  public xcoord: string;
  public ycoord: string;
  public CSVMessage: string;
  public geocodingErrors: Message[] = [];
  public mapView: __esri.MapView;
  public displayGcSpinner: boolean = false;

  private geocodingResponse: GeocodingResponse;
  private esriMap: __esri.Map;

  public profileId: number;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button

  // get the map from the service and add the new graphic
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private geocoderService: GeocoderService, private mapService: MapService) { }

  ngOnInit() {
  }

  // collect the information entered by the user on the geocorder form and 
  // create an AmSite, then invoke the geocoder
  public async onGeocode() {
    try {
      const amSite = new AmSite();
      amSite.address = this.street;
      amSite.city = this.city;
      amSite.state = this.state;
      amSite.zip = this.zip.toString();
      this.geocodeAddress(amSite);
    } catch (error) {
      this.handleError(error);
    }
  }

  // geocode an AmSite by invoking the geocoding service
  public async geocodeAddress(amSite: AmSite, display: boolean = true) {
    const observable = this.geocoderService.geocode(amSite);
    observable.subscribe(res => this.parseResponse(res, display), err => this.handleError(err), null);
  }

  // add all of the geocoded sites in this.amSites to the map
  private async addSitesToMap(amSites: AmSite[]) {
    try {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [Graphic] = await loader.loadModules(['esri/Graphic']);
      const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
      for (const amSite of amSites) {
        await this.createPopup(amSite)
          .then(res => this.createGraphic(amSite, res))
          .then(res => { graphics.push(res); })
          .catch(err => this.handleError(err));
      }
      await this.updateLayer(graphics).catch(err => this.handleError(err));
    } catch (error) {
      this.handleError(error);
    }
  }

  // parse the RestResponse from the Geocoder and create an AmSite from it, optionally dispay the site as well
  private parseResponse(restResponse: RestResponse, display?: boolean) {
    const amSite: AmSite = new AmSite();
    const amSites: AmSite[] = new Array<AmSite>();
    const geocodingResponse: GeocodingResponse = restResponse.payload;
    if (geocodingResponse.locationQualityCode === 'E') {
      const error: string = 'Location Quality Code: ' + geocodingResponse.locationQualityCode + '<br>' +
        'Address: ' + geocodingResponse.addressline + '<br>' +
        'City: ' + geocodingResponse.city + '<br>' +
        'Sate: ' + geocodingResponse.state + '<br>' +
        'Zip: ' + geocodingResponse.zip10 + '<br>';
      this.handleError(new Error(error));
      return;
    }
    amSite.ycoord = geocodingResponse.latitude;
    amSite.xcoord = geocodingResponse.longitude;
    amSite.address = geocodingResponse.addressline;
    amSite.city = geocodingResponse.city;
    amSite.state = geocodingResponse.state;
    amSite.zip = geocodingResponse.zip10;
    amSites.push(amSite);
    if (display) {
      this.addSitesToMap(amSites);
    }
  }

  // create a PopupTemplate for the site that will be displayed on the map
  private async createPopup(amSite: AmSite): Promise<__esri.PopupTemplate> {
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

  // create a Grahpic object for the site that will be displayed on the map
  private async createGraphic(amSite: AmSite, popupTemplate: __esri.PopupTemplate): Promise<__esri.Graphic> {
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

  // draw the site graphics on the Sites layer
  private async updateLayer(graphics: __esri.Graphic[]) {
    this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES);
  }

  private async handleError(error: Error) {
    const growlMessage: Message = {
      summary: 'Failed to geocode your address',
      severity: 'error',
      detail: error.message
    };
    this.geocodingErrors.push(growlMessage);
    return;
  }

  loadVPW() {
    this.street = '19975 Victor Pkwy';
    this.city = 'Livonia';
    this.state = 'MI';
    this.zip = 48152;
  }

  async geocodeCSV(event) {

    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      this.displayGcSpinner = true;
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');

      const observables: Observable<RestResponse>[] = new Array<Observable<RestResponse>>();

      // make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {
        const data = csvRecords[i].split(',');
        if (data.length === headers.length) {
          const csvRecord = [];
          for (let j = 0; j < headers.length; j++) {
            csvRecord.push(data[j]);
          }
          const amSite: AmSite = new AmSite();
          amSite.address = csvRecord[0];
          amSite.city = csvRecord[1];
          amSite.state = csvRecord[2];
          amSite.zip = csvRecord[3];
          observables.push(this.geocoderService.geocode(amSite));
        }
      }
      Observable.forkJoin(observables).subscribe(res => this.parseCSVResults(res), err => this.handleError(err));
    };
  }

  // parse the RestResponse[] that is the result of the CSV geocoding operation
  private parseCSVResults(restResponses: RestResponse[]) {
    const amSites: AmSite[] = new Array<AmSite>();
    for (const restResponse of restResponses) {
      const amSite: AmSite = new AmSite();
      const geocodingResponse: GeocodingResponse = restResponse.payload;
      amSite.ycoord = geocodingResponse.latitude;
      amSite.xcoord = geocodingResponse.longitude;
      amSite.address = geocodingResponse.addressline;
      amSite.city = geocodingResponse.city;
      amSite.state = geocodingResponse.state;
      amSite.zip = geocodingResponse.zip10;
      amSites.push(amSite);
    }
    this.addSitesToMap(amSites);
    this.displayGcSpinner = false;
  }
}
