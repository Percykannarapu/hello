import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../models/AccountLocation';
import { AccountLocations } from '../../models/AccountLocations';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message, DataTableModule } from 'primeng/primeng';
import { GeofootprintMaster } from '../../models/GeofootprintMaster';
import { GeofootprintSite } from '../../models/GeofootprintSite';
import { GeofootprintTaName } from '../../models/GeofootprintTaName';
import { GeofootprintTradeArea } from '../../models/GeofootprintTradeArea';
import { GeofootprintVar } from '../../models/GeofootprintVar';
import { GeofootprintGeo } from '../../models/geofootprintGeo.model';
import { AmSite } from '../../val-modules/targeting/models/AmSite';
import { RestResponse } from '../../models/RestResponse';
import { DefaultLayers } from '../../models/DefaultLayers';
import 'rxjs/add/operator/toPromise';
import { Observable } from 'rxjs/Rx';
import { AmSiteService } from '../../val-modules/targeting/services/AmSite.service';
import { MetricService } from './../../val-modules/common/services/metric.service';
import { Points } from '../../models/Points';
import { GeocodingAttributes } from '../../models/GeocodingAttributes';

// this interface holds information on what position the columns in a CSV file are in
interface CsvHeadersPosition {
  street?: number;
  city?: number;
  state?: number;
  zip?: number;
  lat?: number;
  lon?: number;
  storeNumber?: number;
  name?: number;
  number?: number;
}


@Component({
  //providers: [GeocoderService, MapService],
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {

  private static failedSiteCounter: number = 1;
  public street: string;
  public city: string;
  public state: string;
  public zip: string;
  public xcoord: string;
  public ycoord: string;
  public name: string;
  public number: number;
  public CSVMessage: string;
  public geocodingErrors: Message[] = [];
  public mapView: __esri.MapView;
  public displayGcSpinner: boolean = false;
  public failedSites: GeocodingResponse[] = [];
  public displayFailureWindow: boolean = false;
  public selector: string;

  private geocodingResponse: GeocodingResponse;
  private esriMap: __esri.Map;
  public headers: any;
  public profileId: number;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  //public pointsArray: Points[] = []; // moved to mapservices

  // get the map from the service and add the new graphic
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  @ViewChild('fileUpload') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService, private mapService: MapService, private amSiteService: AmSiteService, private metricService: MetricService) { }

  ngOnInit() {
  }

  // collect the information entered by the user on the geocorder form and 
  // create an AmSite, then invoke the geocoder
  public async onGeocode(selector) {
    try {
      const site: any = new GeocodingResponse();
      site.number = this.amSiteService.getNewSitePk().toString();
      site.street = this.street;
      site.city = this.city;
      site.state = this.state;
      site.zip = this.zip.toString();
      this.geocodeAddress(site);

      if (this.metricService === null)
        console.log('METRIC SERVICE IS NULL');
      this.metricService.add('LOCATIONS', 'Test', 'Yep, Test');

    } catch (error) {
      this.handleError(error);
    }
  }

  // geocode an GeocodingResponse by invoking the geocoding service
  public async geocodeAddress(site: GeocodingResponse, display: boolean = true) {
    const siteList: any[] = [];
    siteList.push(site);
    const observable = this.geocoderService.multiplesitesGeocode(siteList);
    observable.subscribe((res) => {
      this.parseCsvResponse([res], display);
      this.disableshowBusiness = false;
    }, err => this.handleError(err), null);
  }

  // add all of the geocoded sites in the amSites array to the map
  private async addSitesToMap(sitesList: GeocodingResponse[], selector) {
    try {
      const loader = EsriLoaderWrapperService.esriLoader;
      const [Graphic] = await loader.loadModules(['esri/Graphic']);
      const graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
      for (const site of sitesList) {
        //console.log('creating popup for site: ' + amSite.pk);
        await this.createPopup(site)
          .then(res => this.createGraphic(site, res, selector))
          .then(res => { graphics.push(res); })
          .catch(err => this.handleError(err));
      } 
      await this.updateLayer(graphics)
        .then(res => { this.mapService.zoomOnMap(graphics); })
        .then(res => this.amSiteService.add(sitesList))
        .then(res => this.amSiteService.createGrid(sitesList))
        .catch(err => this.handleError(err));
    } catch (error) {
      this.handleError(error);
    }
  }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public geocodingFailure(geocodingResponse: any) : boolean {
    if (geocodingResponse['Match Quality'].toString() === 'E' || geocodingResponse['Match Code'].toString().substr(0, 1) === 'E') {
      return true;
    }
    return false;
  }

  public clearFields(){
    //
  }


  // create a PopupTemplate for the site that will be displayed on the map
  private async createPopup(site: GeocodingResponse) : Promise<__esri.PopupTemplate> {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate] = await loader.loadModules(['esri/PopupTemplate']);
    const popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    const popupAttributesList: GeocodingAttributes[] = site.geocodingAttributesList;
    popupTemplate.title = `Sites`;
    let template  =  `<table> <tbody>`;
        for (const popupAttribute of  popupAttributesList){
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
    // give our site a blue color
    if (selector === 'Competitor'){
      color = {
        a: 1,
        r: 255,
        g: 0,
        b: 0
      };
    }else{
      color = {
        a: 1,
        r: 35,
        g: 93,
        b: 186
        
      };
    }

    await this.mapService.createGraphic(site.latitude, site.longitude, color, popupTemplate, Number(site.number))
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
    this.zip = '48152';
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
   geocodeCSV(event) {
    
    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      
      this.displayGcSpinner = true;
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      this.headers = csvRecords[0].split(',');
      let headerPosition: any = {};
      try {
        headerPosition = this.verifyCSVColumns(this.headers);
        console.log('header details after edit:' + this.headers);
      }catch (error) {
        this.handleError(error);
        return;
      }
      const observables: Observable<RestResponse>[] = new Array<Observable<RestResponse>>();
      let csvFormattedData: any = [];
      const restResponseList: RestResponse[] = [];
      
      // make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {
          const siteList: any[] = [];
          const site = {};
          const csvRecord = csvRecords[i].toString().replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').split(',');
          //console.log('csvRecord dat::' + csvRecords[i].toString().replace(/,(?!(([^"]*"){2})*[^"]*$)/g, ''));
        if ( csvRecord.length === this.headers.length){

          for (let j = 0; j < this.headers.length; j++){
              site[this.headers[j]] = csvRecord[j];
          }
          if (headerPosition.lat === undefined && headerPosition.lon === undefined){
              site['status'] = 'SUCCESS';
              siteList.push(site);
              observables.push(this.geocoderService.multiplesitesGeocode(siteList));
          }
          else{
               siteList.push(site);
               
               siteList.forEach(siteData => {
                  site['status'] = 'PROVIDED';  
                  const restResp: RestResponse = {
                    payload:    siteList,
                    exception:  null,
                    returnCode: 200
                  };
                  restResponseList.push(restResp);
               });
               csvFormattedData =  restResponseList;
          }
        }else{
          // TO assign to failed list if headers length < datarecord length
        }

      }
      if (headerPosition.lat === undefined && headerPosition.lon === undefined){
          Observable.forkJoin(observables).subscribe(res => {
            console.log('forkJoin:::' + res.length);
              this.parseCsvResponse(res, true);
              this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
              this.displayGcSpinner = false;
          });
        }else{
        console.log('csvFormattedData length:::' + csvFormattedData.length);  
        this.parseCsvResponse(csvFormattedData, true);
        this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
        this.displayGcSpinner = false;
      }
    };
  }

 // check the column headers accourding to the business rules above and figure out the positions of all the headers
 private verifyCSVColumns(columns: string[]) : any {
  let addressFlag: boolean = false;
  let cityFlag: boolean = false;
  let stateFlag: boolean = false;
  let zipFlag: boolean = false;
  let latFlag: boolean = false;
  let lonFlag: boolean = false;
  let nameFlag: boolean = false;
  let numberFlag: boolean = false;
  let count: number = 0;
  const headerPosition: any = {};
  this.disableshowBusiness = false; //enable the search business button
  for (let j = 0; j < columns.length; j++){
      let column = columns[j];
      column = column.toUpperCase();
      if (columns[0].includes('NAME')){
        nameFlag = true;
        headerPosition.name = count;
        this.headers[j] = 'name';
      }
      if (column === 'STREET' || column === 'ADDRESS') {
        addressFlag = true;
        headerPosition.street = count;
        this.headers[j] = 'street';
      }
      if (column === 'CITY') {
        cityFlag = true;
        headerPosition.city = count;
        this.headers[j] = 'city';
      }
      if (column === 'STATE' || column === 'ST') {
        stateFlag = true;
        headerPosition.state = count;
        this.headers[j] = 'state';
      }
      if (column === 'ZIP' || column === 'CODE' || column === 'POSTAL') {
        zipFlag = true;
        headerPosition.zip = count;
        this.headers[j] = 'zip';
      }
      if (column === 'Y') {
        latFlag = true;
        headerPosition.lat = count;
        this.headers[j] = 'latitude';
      }
      if (column === 'X') {
        lonFlag = true;
        headerPosition.lon = count;
        this.headers[j] = 'longitude';
      }
      if (column === 'NAME' || column === 'FIRM'  ){
        nameFlag = true;
        headerPosition.name = count;
        this.headers[j] = 'name';
      }
      if (column.includes('NUMBER') || column.includes('NBR') || column === 'ID' || column === 'NUM' || column.includes('#')){
        numberFlag = true;
        headerPosition.number = count;
        this.headers[j] = 'number';
      }
      count++;
  }
  
    if (!addressFlag) {
      const validationError: string = 'Either the City and State must be entered or a Postal Code';
      if (!zipFlag) {
        if (!cityFlag && !stateFlag) {
          throw new Error(validationError);
        }
      }
    }
    return headerPosition;
  }

  // show the modal window that the user will user to correct geocoding errors
  public onViewFailures() {
    this.displayFailureWindow = true;
  }

  // resubmit a geocoding request for an GeocodingResponse that failed to geocode previously
  public async onResubmit(row) {
    const site: GeocodingResponse = new GeocodingResponse();
    site.addressline = row.address;
    site.city = row.city;
    site.state = row.state;
    site.zip = row.zip;
    site.number = row.pk;
    this.onRemove(row);
    this.geocodeAddress(site, true);
  }

  // remove an GeocodingResponse from the list of sites that failed to geocode
  public async onRemove(row) {
    console.log('on remove');
    const site: GeocodingResponse = new GeocodingResponse();
    site.addressline = row.address;
    site.city = row.city;
    site.state = row.state;
    site.zip = row.zip;
    site.number = row.number;
    for (let i = 0; i < this.failedSites.length; i++) {
      if (this.compareSites(site, this.failedSites[i])) {
        const failedSites = Array.from(this.failedSites);
        failedSites.splice(i, 1);
        this.failedSites = failedSites;
      }
    }
  }

  // determine if two AmSite objects are the same
  // this should be implemented in an equals() method in the model
  public compareSites(site1: GeocodingResponse, site2: GeocodingResponse) : boolean {
    if (site1.number === site2.number) {
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

  private parseCsvResponse(restResponses: RestResponse[], display?: boolean) : GeocodingResponse[] {
    const geocodingResponseList: GeocodingResponse[] = []; 
    for (const restResponse of restResponses) {
      const locationResponseList: any[] = restResponse.payload;
      const geocodingResponse: GeocodingResponse = new GeocodingResponse(); 
      const geocodingAttrList: GeocodingAttributes[] = [];
     // const geocodingResponse = geocodingResponseList[0];
     // for (const geocodingResponse of geocodingResponseList){
            // geocoding failures get pushed into the failedSites array for manual intervention by the user
              const locRespListMap: Map<string, any> = locationResponseList[0];
              if (locRespListMap['status'] !== 'PROVIDED' && this.geocodingFailure(locRespListMap)) {
                const failedSite: GeocodingResponse = new GeocodingResponse();
                locationResponseList[0].status = 'ERROR';
                failedSite.status = 'ERROR';
                failedSite.latitude = locRespListMap['Latitude'];
                failedSite.longitude = locRespListMap['Longitude'];
                failedSite.addressline = locRespListMap['Address'];
                failedSite.city = locRespListMap['City'];
                failedSite.state = locRespListMap['State'];
                failedSite.zip = locRespListMap['ZIP'];
                failedSite.number = GeocoderComponent.failedSiteCounter.toString();
                const failedSites = Array.from(this.failedSites);
                failedSites.push(failedSite);
                this.failedSites = failedSites;
                GeocoderComponent.failedSiteCounter++;
                continue;
              }
          geocodingResponse.latitude    =      locRespListMap['Latitude'];
          geocodingResponse.longitude   =      locRespListMap['Longitude'];
          geocodingResponse.addressline =      locRespListMap['Address'];
          geocodingResponse.city        =      locRespListMap['City'];
          geocodingResponse.state       =      locRespListMap['State'];
          geocodingResponse.zip         =      locRespListMap['ZIP'];
          geocodingResponse.number      =      locRespListMap['Number'];
          geocodingResponse.name        =      locRespListMap['Name'];
          geocodingResponse.matchCode   =      locRespListMap['Match Code']; 
         
          let geocodingAttr = null;
           for (const [k, v] of Object.entries(locationResponseList[0])){
                  geocodingAttr = new GeocodingAttributes();
                  geocodingAttr.attributeName = k;
                  geocodingAttr.attributeValue = v;
                  geocodingAttrList.push(geocodingAttr);
           }
           geocodingResponse.geocodingAttributesList = geocodingAttrList;
           
         //  this.amSiteService.sitesList = [...this.amSiteService.sitesList, geocodingResponse];
         //  this.amSiteService.unselectedSitesList = [...this.amSiteService.unselectedSitesList, geocodingResponse];

          const points = new Points();
          points.latitude =  locationResponseList[0].latitude;
          points.longitude = locationResponseList[0].longitude;
          MapService.pointsArray.push(points);
          
          geocodingResponseList.push(geocodingResponse);
          //impGeoFootprintLocationList.push(amSite);
     // }
    }
    if (display) {
     // console.log('sites list structure:::' + JSON.stringify(geocodingResponseList, null, 2));
      this.addSitesToMap(geocodingResponseList, this.selector);
      this.mapService.callTradeArea();
    }
    return geocodingResponseList;
  }
}
