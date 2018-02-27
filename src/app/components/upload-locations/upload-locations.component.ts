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
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: String = 'Site';
  public headers: any;
  public growlMessages: Message[] = [];
  public displaySpinnerMessage: string = 'Geocoding Locations';

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService,
    private messageService: MessageService,
    private mapService: MapService,
    private geocodingRespService: GeocodingResponseService,
    private config: AppConfig) { }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public static geocodingFailure(geocodingResponse: any) : boolean {
    return geocodingResponse['Match Quality'] === 'E' || geocodingResponse['Match Code'].startsWith('E');
  }

  ngOnInit() {
  }


  uploadCSV(event) {
    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = () => {
      this.displayGcSpinner = true;
      const csvFile: string = reader.result;
      const csvRecords = csvFile.split(/\r\n|\n/);
      this.headers = csvRecords[0].split(',');
      let headerPosition: any = {};

      try {
        headerPosition = this.verifyCSVColumns(this.headers);
        console.log('header details after edit:' + this.headers);
      } catch (error) {
        this.handleError(error);
        return;
      }
      const sitesWithGeocode: any[] = [];
      const sitesWithoutGeocode: any[] = [];

      // make sure to start loop at 1 to skip header row
      for (let i = 1; i < csvRecords.length; i++) {
        const site = {};
        const csvRow = csvRecords[i].replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').replace(/"/g, ''); // can't combine both replaces
        const csvColumns = csvRow.split(',');

        if (csvColumns.length === this.headers.length) {
          for (let j = 0; j < this.headers.length; j++) {
            // console.log('importing - site[' + this.headers[j] + '] = ' + csvColumns[j]);
            site[this.headers[j]] = csvColumns[j];
          }
          if (headerPosition.lat == null || headerPosition.lon == null ||
            site[this.headers[headerPosition.lat]] == null || site[this.headers[headerPosition.lat]] === '' ||
            site[this.headers[headerPosition.lon]] == null || site[this.headers[headerPosition.lon]] === '') {
            site['Geocode Status'] = 'SUCCESS';
            sitesWithoutGeocode.push(site);
          } else {
            site['Geocode Status'] = 'PROVIDED';
            sitesWithGeocode.push(site);
          }
        } else {
          // TO assign to failed list if headers length < datarecord length
        }
      }

      if (sitesWithoutGeocode.length > 0) {
        // TODO: deal with responses other than 200
        this.geocoderService.multiplesitesGeocode(sitesWithoutGeocode)
          .subscribe(data => {
          this.parseGeoResponse(data.payload);
        });
      }
      if (sitesWithGeocode.length > 0) {
        // console.log('csvFormattedData length:::' + csvFormattedData.length);
        this.parseGeoResponse(sitesWithGeocode);
      }
      this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
    };
  }

  // check the column headers according to the business rules above and figure out the positions of all the headers
  private verifyCSVColumns(columns: string[]) : any {
    let addressFlag: boolean = false;
    let cityFlag: boolean = false;
    let stateFlag: boolean = false;
    let zipFlag: boolean = false;
    let latFlag: boolean = false;
    let lonFlag: boolean = false;
    let nameFlag: boolean = false;
    let numberFlag: boolean = false;
    let marketFlag: boolean = false;
    let count: number = 0;
    const headerPosition: any = {};

    this.disableshowBusiness = false; //enable the search business button

    for (let j = 0; j < columns.length; j++) {
      let column = columns[j];
      column = column.toUpperCase().trim();

      if (column === 'STREET' ||
          column === 'ADDRESS' ||
          column === 'ADDR') {
        addressFlag = true;
        headerPosition.street = count;
        this.headers[j] = 'street';
      }
      if (column === 'CITY' ||
          column === 'CTY' ) {
        cityFlag = true;
        headerPosition.city = count;
        this.headers[j] = 'city';
      }
      if (column === 'STATE' ||
          column === 'ST') {
        stateFlag = true;
        headerPosition.state = count;
        this.headers[j] = 'state';
      }
      if (column === 'ZIP' ||
          column === 'CODE' ||
          column === 'POSTAL' ||
          column === 'POSTAL CODE') {
        zipFlag = true;
        headerPosition.zip = count;
        this.headers[j] = 'zip';
      }
      if (column === 'Y' ||
          column === 'Y (OPTIONAL)' ||
          column === 'Y(OPTIONAL)' ||
          column === 'Y OPTIONAL' ||
          column === 'LATITUDE' ||
          column === 'LAT') {
        latFlag = true;
        headerPosition.lat = count;
        this.headers[j] = 'latitude';
      }
      if (column === 'X' ||
          column === 'X (OPTIONAL)' ||
          column === 'X(OPTIONAL)' ||
          column === 'X OPTIONAL' ||
          column === 'LONGITUDE') {
        lonFlag = true;
        headerPosition.lon = count;
        this.headers[j] = 'longitude';
      }
      if (!nameFlag) {
        if (column.includes('NAME') ||
            column.includes('FIRM')) {
          nameFlag = true;
          headerPosition.name = count;
          this.headers[j] = 'name';
        }
      }
      if (!numberFlag) {
        if (column.includes('NUMBER') ||
            column.includes('NBR') ||
            column.includes('ID') ||
            column.includes('NUM') ||
            column.includes('#')) {
          numberFlag = true;
          headerPosition.number = count;
          this.headers[j] = 'number';
        }
      }
      if (column === 'MARKET' ||
          column === 'MKT' ||
          column === 'MARKET (OPTIONAL)' ||
          column === 'MARKET(OPTIONAL)' ||
          column === 'MARKET (OPT)' ||
          column === 'MARKET(OPT)')
      {
         marketFlag = true;
         headerPosition.market = count;
         this.headers[j] = 'Market';
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
    const currentSite = {};
    currentSite['name']   = row['Name'];
    currentSite['number'] = row['Number'];
    currentSite['street'] = row['Original Address'];
    currentSite['city']   = row['Original City'];
    currentSite['state']  = row['Original State'];
    currentSite['zip']    = row['Original ZIP'];

    Object.keys(row).forEach(site => {
      if (['Number', 'Name', 'Address', 'City', 'State', 'ZIP',
           'Geocode Status', 'Latitude', 'Longitude', 'Match Code',
           'Match Quality', 'Original Address', 'Original City',
           'Original State', 'Original ZIP'].indexOf(site) < 0) {
        currentSite[site] = row[site];
        //console.log('row:::' + row + ':::Siteval:::'+site)
      }
    });
    currentSite['Geocode Status'] = 'SUCCESS';

    this.onRemove(row);

    this.geocoderService.multiplesitesGeocode([currentSite]).subscribe(res => {
      this.parseGeoResponse([res]);
    });
  }

  // remove an GeocodingResponse from the list of sites that failed to geocode
  public onRemove(row) {
    console.log('on remove');
    const site: GeocodingResponse = new GeocodingResponse();
    site.addressline = row.Street;
    site.city = row.City;
    site.state = row.State;
    site.zip = row.ZIP;
    site.number = row.Number;
    for (let i = 0; i < this.failedSites.length; i++) {
      if (this.compareSites(site, this.failedSites[i])) {
        this.failedSites.splice(i, 1);
      }
    }
  }

  // this should be implemented in an equals() method in the model
  public compareSites(site1: GeocodingResponse, site2: GeocodingResponse) : boolean {
    if (site1.number === site2['Number']) {
      return true;
    }
  }

  private async parseGeoResponse(geoResponses: any[]) : Promise<GeocodingResponse[]> {
    let geocodingResponseList: GeocodingResponse[] = [];
    for (const geoResponse of geoResponses) {
      const geocodingResponse: GeocodingResponse = new GeocodingResponse();
      const geocodingAttrList: GeocodingAttributes[] = [];
      const locRespListMap: Map<string, any> = geoResponse;

      if (locRespListMap['Geocode Status'] !== 'PROVIDED' && UploadLocationsComponent.geocodingFailure(locRespListMap)) {
        locRespListMap['Geocode Status'] = 'ERROR';
        this.failedSites.push(locRespListMap); //push to failed sites
        UploadLocationsComponent.failedSiteCounter++;
        continue;
      }

      // where there are two options, the first is the Fuse response field, the second is the client supplied (normalized)
      geocodingResponse.latitude = locRespListMap['Latitude'] || locRespListMap['latitude'];
      geocodingResponse.longitude = locRespListMap['Longitude'] || locRespListMap['longitude'];
      geocodingResponse.addressline = locRespListMap['Address'] || locRespListMap['street'];
      geocodingResponse.city = locRespListMap['City'] || locRespListMap['city'];
      geocodingResponse.state = locRespListMap['State'] || locRespListMap['state'];
      geocodingResponse.zip = locRespListMap['ZIP'] || locRespListMap['zip'];
      geocodingResponse.number = locRespListMap['Number'] || locRespListMap['number'];
      geocodingResponse.name = locRespListMap['Name'] || locRespListMap['name'];
      geocodingResponse.orgAddr = locRespListMap['Original Address'];
      geocodingResponse.orgCity = locRespListMap['Original City'];
      geocodingResponse.orgState = locRespListMap['Original State'];
      geocodingResponse.zip10 = locRespListMap['Original ZIP'];
      geocodingResponse.status = locRespListMap['Geocode Status'];
      geocodingResponse.marketName = locRespListMap['Market'] || locRespListMap['market'];
      geocodingResponse.matchCode = locRespListMap['Match Code'];
      geocodingResponse.locationQualityCode = locRespListMap['Match Quality'];

      if (geocodingResponse.number == null || geocodingResponse.number == '') {
        geocodingResponse.number = this.geocodingRespService.getNewSitePk().toString();
        locRespListMap['Number'] = geocodingResponse.number;
      }

      let geocodingAttr = null;
      for (const [k, v] of Object.entries(geoResponse)) {
        geocodingAttr = new GeocodingAttributes();
        geocodingAttr.attributeName = k;
        geocodingAttr.attributeValue = v;
        geocodingAttrList.push(geocodingAttr);
      }
      geocodingResponse.geocodingAttributesList = geocodingAttrList;
      geocodingResponseList.push(geocodingResponse);
    }
    if (this.selector === 'Site'){
      this.displaySpinnerMessage = 'Calculating Home Geocodes';
      geocodingResponseList = await this.mapService.calculateHomeGeo(geocodingResponseList);
      this.mapService.callTradeArea();
    }
    this.geocoderService.addSitesToMap(geocodingResponseList, this.selector);
    this.displayGcSpinner = false;
    this.handleMessages(); //Show messages after the geocoding is done
    return geocodingResponseList;
  }

  //Add messages after geocoding
  private handleMessages() {
    this.messageService.clear();
    if (this.failedSites.length === 0) {
      this.messageService.add({ severity: 'success', summary: 'Success', detail: `Geocoding Success` });
    } else {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: `Geocoding Error` });
    }
    return;
  }

  private handleError(error: Error) {
    this.messageService.add({ severity: 'error', summary: 'Geocoding Error', detail: `${error}` });
    //Hide the spinner on error
    this.displayGcSpinner = false;
    return;
  }
}
