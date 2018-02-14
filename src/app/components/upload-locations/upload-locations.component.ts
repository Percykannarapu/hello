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
import { MessageService } from 'primeng/components/common/messageservice';
import { GeocoderComponent } from '../geocoder/geocoder.component';
import { GeocodingResponseService } from '../../val-modules/targeting/services/GeocodingResponse.service';

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
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: String = 'Site';
  public headers: any;

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService,
    private messageService: MessageService, private mapService: MapService, private geocodingRespService: GeocodingResponseService) { }

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
        const csvRecord = csvRecords[i].toString().replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').split(',');
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

        });
      } else {
        console.log('csvFormattedData length:::' + csvFormattedData.length);
        this.parseCsvResponse(csvFormattedData, true);
        this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
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
        this.headers[j] = 'Street';
      }
      if (column === 'CITY') {
        cityFlag = true;
        headerPosition.city = count;
        this.headers[j] = 'City';
      }
      if (column === 'STATE' || column === 'ST') {
        stateFlag = true;
        headerPosition.state = count;
        this.headers[j] = 'State';
      }
      if (column === 'ZIP' || column === 'CODE' || column === 'POSTAL') {
        zipFlag = true;
        headerPosition.zip = count;
        this.headers[j] = 'zip';
      }
      if (column === 'Y' || column === 'LATITUDE') {
        latFlag = true;
        headerPosition.lat = count;
        this.headers[j] = 'Latitude';
      }
      if (column === 'X' || column === 'LONGITUDE') {
        lonFlag = true;
        headerPosition.lon = count;
        this.headers[j] = 'Longitude';
      }
      if (!nameFlag) {
        if (column.includes('NAME') || column.includes('FIRM')) {
          nameFlag = true;
          headerPosition.name = count;
          this.headers[j] = 'Name';
        }
      }
      if (!numberFlag) {
        if (column.includes('NUMBER') || column.includes('NBR') || column.includes('ID') || column.includes('NUM') || column.includes('#')) {
          numberFlag = true;
          headerPosition.number = count;
          this.headers[j] = 'Number';
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
    site1['name'] = row['Name'];
    site1['number'] = row['Number'];

    site1['street'] = row['Street'];
    site1['city'] = row['City'];
    site1['state'] = row['State'];
    site1['zip'] = row['ZIP'];

    Object.keys(row).forEach(site => {
      if (['Number', 'Name', 'Address', 'City', 'State', 'ZIP',
        'Geocode Status', 'Latitude', 'Longitude', 'Match Code',
        'Match Quality', 'Original Address', 'Original City',
        'Original State', 'Original ZIP', 'Market'].indexOf(site) < 0) {

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
  public compareSites(site1: GeocodingResponse, site2: GeocodingResponse): boolean {
    if (site1.number === site2['Number']) {
      return true;
    }
  }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public geocodingFailure(geocodingResponse: any): boolean {
    if (geocodingResponse['Match Quality'].toString() === 'E' || geocodingResponse['Match Code'].toString().substr(0, 1) === 'E') {
      return true;
    }
    return false;
  }

  private async parseCsvResponse(restResponses: RestResponse[], display?: boolean): Promise<GeocodingResponse[]> {
    const geocodingResponseList: GeocodingResponse[] = [];
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

      if (geocodingResponse.number == null) {
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
      // console.log('sites list structure:::' + JSON.stringify(geocodingResponseList, null, 2));

      await this.geocoderService.calculateHomeGeo(geocodingResponseList);
      this.geocoderService.addSitesToMap(geocodingResponseList, this.selector);
      this.mapService.callTradeArea();
      //Hide the spinner on error
      this.displayGcSpinner = false;
    }
    return geocodingResponseList;
  }
  private async handleError(error: Error) {
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: `${error}` });
    //Hide the spinner on error
    this.displayGcSpinner = false;
    return;
  }
}
