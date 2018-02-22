import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RestResponse } from '../../models/RestResponse';
import { AmSite } from '../../val-modules/targeting/models/AmSite';
import { AccountLocations } from '../../models/AccountLocations';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../models/GeocodingResponse';
import { Observable } from 'rxjs/Rx';
import { Points } from '../../models/Points';
import { MapService } from '../../services/map.service';
import { GeocodingAttributes } from '../../models/GeocodingAttributes';
import { SelectItem, GrowlModule, Message } from 'primeng/primeng';
import { MessageService } from 'primeng/components/common/messageservice';
import { GeocoderComponent } from '../geocoder/geocoder.component';
import { GeocodingResponseService } from '../../val-modules/targeting/services/GeocodingResponse.service';
import { AppConfig } from '../../app.config';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';

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
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css'],
  providers: [MessageService]
})
export class UploadLocationsComponent implements OnInit {

  private static failedSiteCounter: number = 1;
  public failedSites: any[] = [];

  private geocodingResponse: GeocodingResponse;
  public displayGcSpinner: boolean = false;
  public handleMsg: boolean = true; //flag for enabling the message after geocoding
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: String = 'Site';
  public headers: any;
  public growlMessages: Message[] = new Array();
  public displaySpinnerMessage: string = 'Geocoding Locations';

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService,
    private messageService: MessageService,
    private mapService: MapService,
    private geocodingRespService: GeocodingResponseService,
    private config: AppConfig) { }

  ngOnInit() {
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


  uploadCSV(event) {

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
      } catch (error) {
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
        let csvRecord = csvRecords[i].toString().replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '');
        csvRecord = csvRecord.replace('"', '').split(',');
        //console.log('csvRecord dat::' + csvRecords[i].toString().replace(/,(?!(([^"]*"){2})*[^"]*$)/g, ''));
        if (csvRecord.length === this.headers.length) {

          for (let j = 0; j < this.headers.length; j++) {
            site[this.headers[j]] = csvRecord[j];
          }
          siteList.push(site);
          if (headerPosition.lat === undefined && headerPosition.lon === undefined) {
            site['Geocode Status'] = 'SUCCESS';

            observables.push(this.geocoderService.multiplesitesGeocode(siteList));
          }
          else {
            siteList.forEach(siteData => {
              site['Geocode Status'] = 'PROVIDED';
              const restResp: RestResponse = {
                payload: siteList,
                exception: null,
                returnCode: 200
              };
              restResponseList.push(restResp);
            });
            csvFormattedData = restResponseList;
          }
        } else {
          // TO assign to failed list if headers length < datarecord length
        }

      }
      if (headerPosition.lat === undefined && headerPosition.lon === undefined) {
        Observable.forkJoin(observables).subscribe(res => {
          console.log('forkJoin:::' + res.length);
          this.parseCsvResponse(res, true);
          this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
          //this.displayGcSpinner = false;

        });
      } else {
        console.log('csvFormattedData length:::' + csvFormattedData.length);
        this.parseCsvLatLongResponse(csvFormattedData, true);
        this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
        //this.displayGcSpinner = false;
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
    for (let j = 0; j < columns.length; j++) {
      let column = columns[j];
      column = column.toUpperCase();

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
      if (column === 'Y' || column === 'LATITUDE') {
        latFlag = true;
        headerPosition.lat = count;
        this.headers[j] = 'latitude';
      }
      if (column === 'X' || column === 'LONGITUDE') {
        lonFlag = true;
        headerPosition.lon = count;
        this.headers[j] = 'longitude';
      }
      if (!nameFlag) {
        if (column.includes('NAME') || column.includes('FIRM')) {
          nameFlag = true;
          headerPosition.name = count;
          this.headers[j] = 'name';
        }
      }
      if (!numberFlag) {
        if (column.includes('NUMBER') || column.includes('NBR') || column.includes('ID') || column.includes('NUM') || column.includes('#')) {
          numberFlag = true;
          headerPosition.number = count;
          this.headers[j] = 'number';
        }
      }
      count++;
    }

    if (!addressFlag) {
      const validationError: string = 'Either the City and State must be entered or a Postal Code';
      if ((!cityFlag || !stateFlag) && !zipFlag) {
        //this.messageService.add({ severity: 'error', summary: 'Failed to geocode File', detail: `${validationError}` });
        //Hide the spinner on error
        this.displayGcSpinner = false;
        throw new Error(validationError);
      }
    }
    if (!nameFlag) {
      const validationError: string = 'Name column not defined in the upload file';
      //this.messageService.add({ severity: 'error', summary: 'Failed to geocode File', detail: `${validationError}` });
      //Hide the spinner on error
      this.displayGcSpinner = false;
      throw new Error(validationError);
    }

    if (!numberFlag) {
      const validationError: string = 'Number column not defined in the upload file';
      //this.messageService.add({ severity: 'error', summary: 'Failed to geocode File', detail: `${validationError}` });
      //Hide the spinner on error
      this.displayGcSpinner = false;
      throw new Error(validationError);
    }
    return headerPosition;
  }

  public onResubmit(row) {
    //const site: GeocodingResponse = new GeocodingResponse();
    const siteList: any[] = [];
    const site1 = {};
    const observables: Observable<RestResponse>[] = new Array<Observable<RestResponse>>();
    site1['name']     = row['Name'];
    site1['number']   = row['Number'];

    site1['street']   = row['Original Address'];
    site1['city']     = row['Original City'];
    site1['state']   = row['Original State'];
    site1['zip']     = row['Original ZIP'];

    Object.keys(row).forEach(site => {
      if (['Number', 'Name', 'Address', 'City', 'State', 'ZIP',
        'Geocode Status', 'Latitude', 'Longitude', 'Match Code',
        'Match Quality', 'Original Address', 'Original City',
        'Original State', 'Original ZIP'].indexOf(site) < 0) {

        site1[site] = row[site];
        //console.log('row:::' + row + ':::Siteval:::'+site)
      }
    });
    site1['Geocode Status'] = 'SUCCESS';
    siteList.push(site1);

    this.onRemove(row);
    observables.push(this.geocoderService.multiplesitesGeocode(siteList));

    Observable.forkJoin(observables).subscribe(res => {
      this.parseCsvResponse(res, true);
    });
  }

  // remove an GeocodingResponse from the list of sites that failed to geocode
  public async onRemove(row) {
    console.log('on remove');
    const site: GeocodingResponse = new GeocodingResponse();
    site.addressline = row.Street;
    site.city = row.City;
    site.state = row.State;
    site.zip = row.ZIP;
    site.number = row.Number;
    for (let i = 0; i < this.failedSites.length; i++) {
      if (this.compareSites(site, this.failedSites[i])) {
        const failedSites = Array.from(this.failedSites);
        failedSites.splice(i, 1);
        this.failedSites = failedSites;
      }
    }
  }

  // this should be implemented in an equals() method in the model
  public compareSites(site1: GeocodingResponse, site2: GeocodingResponse) : boolean {
    if (site1.number === site2['Number']) {
      return true;
    }
  }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public geocodingFailure(geocodingResponse: any) : boolean {
    if (geocodingResponse['Match Quality'].toString() === 'E' || geocodingResponse['Match Code'].toString().substr(0, 1) === 'E') {
      return true;
    }
    return false;
  }

  private async parseCsvResponse(restResponses: RestResponse[], display?: boolean) : Promise<GeocodingResponse[]> {
    let geocodingResponseList: GeocodingResponse[] = [];
    for (const restResponse of restResponses) {
      const locationResponseList: any[] = restResponse.payload;
      const geocodingResponse: GeocodingResponse = new GeocodingResponse();
      const geocodingAttrList: GeocodingAttributes[] = [];
      // const geocodingResponse = geocodingResponseList[0];
      // for (const geocodingResponse of geocodingResponseList){
      // geocoding failures get pushed into the failedSites array for manual intervention by the user
      const locRespListMap: Map<string, any> = locationResponseList[0];
      if (locRespListMap['Geocode Status'] !== 'PROVIDED' && this.geocodingFailure(locRespListMap)) {
        const failedSite: GeocodingResponse = new GeocodingResponse();
        //locationResponseList[0].status = 'ERROR';
        locRespListMap['Geocode Status'] = 'ERROR';
        this.handleMsg = false;

        this.failedSites.push(locRespListMap); //push to failed sites
        UploadLocationsComponent.failedSiteCounter++;
        continue;
      }
      geocodingResponse.latitude = locRespListMap['Latitude'];
      geocodingResponse.longitude = locRespListMap['Longitude'];
      geocodingResponse.addressline = locRespListMap['Address'];
      geocodingResponse.city = locRespListMap['City'];
      geocodingResponse.state = locRespListMap['State'];
      geocodingResponse.zip = locRespListMap['ZIP'];
      geocodingResponse.number = locRespListMap['Number'];
      geocodingResponse.name = locRespListMap['Name'];
      geocodingResponse.matchCode = locRespListMap['Match Code'];
      geocodingResponse.orgAddr = locRespListMap['Original Address'];
      geocodingResponse.orgCity = locRespListMap['Original City'];
      geocodingResponse.orgState = locRespListMap['Original State'];
      geocodingResponse.status = locRespListMap['Geocode Status'];
      geocodingResponse.zip10 = locRespListMap['Original ZIP'];
      geocodingResponse.locationQualityCode = locRespListMap['Match Quality'];
      geocodingResponse.marketName = locRespListMap['Market'];
      // geocodingResponse.orgAddr     =      locRespListMap['Original ']; 

      if (geocodingResponse.number == null || geocodingResponse.number == '') {
        geocodingResponse.number = this.geocodingRespService.getNewSitePk().toString();
        locRespListMap['Number'] = geocodingResponse.number;
      }


      let geocodingAttr = null;
      for (const [k, v] of Object.entries(locationResponseList[0])) {
        geocodingAttr = new GeocodingAttributes();
        geocodingAttr.attributeName = k;
        geocodingAttr.attributeValue = v;
        geocodingAttrList.push(geocodingAttr);
      }
      geocodingResponse.geocodingAttributesList = geocodingAttrList;
      geocodingResponseList.push(geocodingResponse);
      // }
    }

    if (display) {
      if (this.selector === 'Site'){
        this.displaySpinnerMessage = 'Calculating Home Geocodes';
        geocodingResponseList = await this.mapService.calculateHomeGeo(geocodingResponseList);
        this.mapService.callTradeArea();
      }
      //console.log('geocodingResponseList', geocodingResponseList);
      this.geocoderService.addSitesToMap(geocodingResponseList, this.selector);
      //Hide the spinner on error
      this.displayGcSpinner = false;
      
    }
    this.handleMessages(); //Show messages after the geocoding is done
    return geocodingResponseList;
  }

  // for pregeocoded lat long values
  private async parseCsvLatLongResponse(restResponses: RestResponse[], display?: boolean) : Promise<GeocodingResponse[]> {
    let geocodingResponseList: GeocodingResponse[] = [];
    for (const restResponse of restResponses) {
      const locationResponseList: any[] = restResponse.payload;
      const geocodingResponse: GeocodingResponse = new GeocodingResponse();
      const geocodingAttrList: GeocodingAttributes[] = [];

      const locRespListMap: Map<string, any> = locationResponseList[0];
      // if (locRespListMap['Geocode Status'] !== 'PROVIDED' && this.geocodingFailure(locRespListMap)) {
      //   const failedSite: GeocodingResponse = new GeocodingResponse();
      //   //locationResponseList[0].status = 'ERROR';
      //   locRespListMap['Geocode Status'] = 'ERROR';

      //   this.failedSites.push(locRespListMap); //push to failed sites
      //   UploadLocationsComponent.failedSiteCounter++;
      //   continue;
      // }
      console.log('locRespListMap:::', locRespListMap);
      geocodingResponse.status = locRespListMap['Geocode Status'];
      geocodingResponse.city = locRespListMap['city'];
      geocodingResponse.latitude = locRespListMap['latitude'];
      geocodingResponse.longitude = locRespListMap['longitude'];
      geocodingResponse.name = locRespListMap['name'];
      geocodingResponse.number = locRespListMap['number'];
      geocodingResponse.state = locRespListMap['state'];
      geocodingResponse.addressline = locRespListMap['street'];
      geocodingResponse.zip = locRespListMap['zip'];

      // geocodingResponse.matchCode = locRespListMap['Match Code'];
      // geocodingResponse.orgAddr = locRespListMap['Original Address'];
      // geocodingResponse.orgCity = locRespListMap['Original City'];
      // geocodingResponse.orgState = locRespListMap['Original State'];
      // geocodingResponse.status = locRespListMap['Geocode Status'];
      // geocodingResponse.zip10 = locRespListMap['Original ZIP'];
      // geocodingResponse.locationQualityCode = locRespListMap['Match Quality'];
      // geocodingResponse.marketName = locRespListMap['Market'];
      // geocodingResponse.orgAddr     =      locRespListMap['Original ']; 

      if (geocodingResponse.number == null || geocodingResponse.number == '') {
        geocodingResponse.number = this.geocodingRespService.getNewSitePk().toString();
        locRespListMap['number'] = geocodingResponse.number;
      }

      let geocodingAttr = null;
      for (const [k, v] of Object.entries(locationResponseList[0])) {
        geocodingAttr = new GeocodingAttributes();
        geocodingAttr.attributeName = k;
        geocodingAttr.attributeValue = v;
        geocodingAttrList.push(geocodingAttr);
      }
      geocodingResponse.geocodingAttributesList = geocodingAttrList;
      geocodingResponseList.push(geocodingResponse);
      // }
    }
    if (display) {
      
      if (this.selector === 'Site'){
        this.displaySpinnerMessage = 'Calculating Home Geocodes';
        geocodingResponseList = await this.mapService.calculateHomeGeo(geocodingResponseList);
        this.mapService.callTradeArea();
      }
      //console.log('geocodingResponseList', geocodingResponseList);
      this.geocoderService.addSitesToMap(geocodingResponseList, this.selector);
      this.displayGcSpinner = false;
      this.handleMsg = true;
      this.handleMessages();
    }
    return geocodingResponseList;
  }

 

  //Add messages after geocoding
  private async handleMessages() {
    this.messageService.clear();
    if (this.handleMsg){
    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Geocoding Success` });
    } else{
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `Geocoding Error` });
      this.handleMsg = true; //turning the flag back on
    }
    return;
  }

  private async handleError(error: Error) {
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: `${error}` });
    //Hide the spinner on error
    this.displayGcSpinner = false;
    return;
  }
}
