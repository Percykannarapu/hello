import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message, DataTableModule } from 'primeng/primeng';
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

// this interface holds information on what position the columns in a CSV file are in
interface CsvHeadersPosition {
  street?: number;
  city?: number;
  state?: number;
  zip?: number;
  lat?: number;
  lon?: number;
  storeNumber?: number;
}


@Component({
  providers: [GeocoderService, MapService],
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {

  private static failedSiteCounter: number = 1;
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
  public failedSites: AmSite[] = [];
  public displayFailureWindow: boolean = false;

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
    observable.subscribe((res) => {
      this.parseResponse(res, display);
      this.disableshowBusiness = false;
    }, err => this.handleError(err), null);
  }

  // add all of the geocoded sites in the amSites array to the map
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
      await this.updateLayer(graphics)
        .then(res => { this.mapService.zoomOnMap(graphics); })
        .catch(err => this.handleError(err));
    } catch (error) {
      this.handleError(error);
    }
  }

  // parse the RestResponse from the Geocoder and create an AmSite from it, optionally dispay the site as well
  private parseResponse(restResponse: RestResponse, display?: boolean) {
    const amSite: AmSite = new AmSite();
    const amSites: AmSite[] = new Array<AmSite>();
    const geocodingResponse: GeocodingResponse = restResponse.payload;
    
    // geocoding failures get pushed into the failedSites array for manual intervention by the user
    if (geocodingResponse.locationQualityCode === 'E' || geocodingResponse.matchCode.substr(0, 1) === 'E') {
      const failedSite: AmSite = new AmSite();
      failedSite.ycoord = geocodingResponse.latitude;
      failedSite.xcoord = geocodingResponse.longitude;
      failedSite.address = geocodingResponse.addressline;
      failedSite.city = geocodingResponse.city;
      failedSite.state = geocodingResponse.state;
      failedSite.zip = geocodingResponse.zip10;
      failedSite.pk = GeocoderComponent.failedSiteCounter;
      const failedSites = Array.from(this.failedSites);
      failedSites.push(failedSite);
      this.failedSites = failedSites;
      GeocoderComponent.failedSiteCounter++;
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
  private async createPopup(amSite: AmSite) : Promise<__esri.PopupTemplate> {
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
  private async createGraphic(amSite: AmSite, popupTemplate: __esri.PopupTemplate) : Promise<__esri.Graphic> {
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
    this.displayGcSpinner = false;
    return;
  }

  loadVPW() {
    this.street = '19975 Victor Pkwy';
    this.city = 'Livonia';
    this.state = 'MI';
    this.zip = 48152;
  }

  // Business rules for CSV geocoding:
  // 1. The first column is the store name
  // 2. One column must contain STREET or ADDRESS 
  // 3. One column must contain CITY
  // 4. One column must contain STATE or ST
  // 5. One column must contain ZIP or CODE or POSTAL
  // 6. If STREET or ADDRESS is missing: CITY and STATE or ST must be provided, OR, ZIP or CODE or POSTAL. If not return a validation error: Either the City and State must be entered or a Postal Code
  // 7. if a X or LATITUDE or LAT column is found, and is not blank, use it and bypass Address Broker geocoding.
  // 8. if a Y or LONGITUDE or LONG column is found, and is not blank, use it and bypass Address Broker geocoding.
  // 9. Retain any other column as is, as an attribute of that site point.
  // 10. If a column with NUMBER, #, NBR, ID, is found, load it into the site number field
  // 11. The geocoded stores becomes a layer that can be turned on and off. Its attribute table can be turned on and off. Prerequisite: US6231 Layer List in IMPower application
  // 12. If the geocoder returned an invalid match code for some rows in the CSV file, an error is displayed somewhere. Very primitive UI please, as error handling is in US6348 Geocoding error handling in imPower application
  async geocodeCSV(event) {

    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      this.displayGcSpinner = true;
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');
      let headerPosition: CsvHeadersPosition = {};
      try {
        headerPosition = this.verifyCSVColumns(headers);
      } catch (error) {
        this.handleError(error);
        return;
      }
      const observables: Observable<RestResponse>[] = new Array<Observable<RestResponse>>();

      // make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {

        // this is a check to see if the record we are currently on is blank
        // if it's an empty record skip over it
        if (!csvRecords[i] || 0 === csvRecords[i].length) {
          continue;
        }

        const data: string[] = csvRecords[i].split(',');
        const csvRecord = [];
        for (let j = 0; j < headers.length; j++) {
          csvRecord.push(data[j]);
        }
        const amSite: AmSite = new AmSite();
        amSite.name = csvRecord[0]; // the name is guaranteed to be the first column
        amSite.address = csvRecord[headerPosition.street];
        amSite.city = csvRecord[headerPosition.city];
        amSite.state = csvRecord[headerPosition.state];
        amSite.zip = csvRecord[headerPosition.zip];
        observables.push(this.geocoderService.geocode(amSite));
      }
      Observable.forkJoin(observables).subscribe(res => this.parseCSVResults(res), err => this.handleError(err));
    };
  }

  // check the column headers accourding to the business rules above and figure out the positions of all the headers
  private verifyCSVColumns(columns: string[]) : CsvHeadersPosition {
    let addressFlag: boolean = false;
    let cityFlag: boolean = false;
    let stateFlag: boolean = false;
    let zipFlag: boolean = false;
    let latFlag: boolean = false;
    let lonFlag: boolean = false;
    let count: number = 0;
    const headerPosition: CsvHeadersPosition = {};
    this.disableshowBusiness = false; //enable the search business button
    for (let column of columns) {
      column = column.toUpperCase();
      if (column === 'STREET' || column === 'ADDRESS') {
        addressFlag = true;
        headerPosition.street = count;
      }
      if (column === 'CITY') {
        cityFlag = true;
        headerPosition.city = count;
      }
      if (column === 'STATE' || column === 'ST') {
        stateFlag = true;
        headerPosition.state = count;
      }
      if (column === 'ZIP' || column === 'CODE' || column === 'POSTAL') {
        zipFlag = true;
        headerPosition.zip = count;
      }
      if (column === 'Y') {
        latFlag = true;
        headerPosition.lat = count;
      }
      if (column === 'X') {
        lonFlag = true;
        headerPosition.lon = count;
      }
      count++;
    }
    if (!addressFlag) {
      const validationError: string = 'Either the City and State must be entered or a Postal Code'
      if (!zipFlag) {
        if (!cityFlag && !stateFlag) {
          throw new Error(validationError);
        }
      }
    }
    return headerPosition;
  }

  // parse the RestResponse[] that is the result of the CSV geocoding operation
  private parseCSVResults(restResponses: RestResponse[]) {
    const amSites: AmSite[] = new Array<AmSite>();
    for (const restResponse of restResponses) {
      const amSite: AmSite = new AmSite();
      const geocodingResponse: GeocodingResponse = restResponse.payload;

      // geocoding failures get pushed into the failedSites array for manual intervention by the user
      if (geocodingResponse.locationQualityCode === 'E' || geocodingResponse.matchCode.substr(0, 1) === 'E') {
        const failedSite: AmSite = new AmSite();
        failedSite.ycoord = geocodingResponse.latitude;
        failedSite.xcoord = geocodingResponse.longitude;
        failedSite.address = geocodingResponse.addressline;
        failedSite.city = geocodingResponse.city;
        failedSite.state = geocodingResponse.state;
        failedSite.zip = geocodingResponse.zip10;
        failedSite.pk = GeocoderComponent.failedSiteCounter;
        const failedSites = Array.from(this.failedSites);
        failedSites.push(failedSite);
        this.failedSites = failedSites;
        GeocoderComponent.failedSiteCounter++;
        continue;
      }

      // populate the new AmSite record from the geocoding response
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

  // show the modal window that the user will user to correct geocoding errors
  public onViewFailures() {
    this.displayFailureWindow = true;
  }

  // resubmit a geocoding request for an AmSite that failed to geocode previously
  public async onResubmit(row) {
    const site: AmSite = new AmSite();
    site.address = row.address;
    site.city = row.city;
    site.state = row.state;
    site.zip = row.zip;
    site.pk = row.pk;
    for (let i = 0; i < this.failedSites.length; i++) {
      if (this.compareSites(site, this.failedSites[i])) {
        const failedSites = Array.from(this.failedSites);
        failedSites.splice(i, 1);
        this.failedSites = failedSites;
      }
    }
    this.geocodeAddress(site, true);
  }

  // determine if two AmSite objects are the same
  // this should be implemented in an equals() method in the model
  public compareSites(site1: AmSite, site2: AmSite) : boolean {
    if (site1.pk === site2.pk) {
      return true;
    }
    /*
        site1.xcoord === site2.xcoord &&
        site1.ycoord === site2.ycoord &&
        site1.siteType === site2.siteType &&
        site1.siteId === site2.siteId &&
        site1.name === site2.name &&
        site1.owner === site2.owner &&
        site1.franchisee === site2.franchisee &&
        site1.address === site2.address &&
        site1.crossStreet === site2.crossStreet &&
        site1.city === site2.city &&
        site1.state === site2.state &&
        site1.zip === site2.zip &&
        site1.taSource === site2.taSource &&
        site1.xmlLocation === site2.xmlLocation &&
        site1.xmlTradearea === site2.xmlTradearea &&
        site1.createType === site2.createType &&
      site1.grouping === site2.grouping*/
    return false;
  }
}
