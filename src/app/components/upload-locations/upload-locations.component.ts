import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { GeocodingAttributes } from '../../models/GeocodingAttributes';
import { Message } from 'primeng/primeng';
import { MessageService } from 'primeng/components/common/messageservice';
import { GeocodingResponseService } from '../../val-modules/targeting/services/GeocodingResponse.service';

@Component({
  selector: 'val-upload-locations',
  templateUrl: './upload-locations.component.html',
  styleUrls: ['./upload-locations.component.css'],
  providers: [MessageService]
})
export class UploadLocationsComponent implements OnInit {

  private static failedSiteCounter: number = 1;
  public failedSites: any[] = [];

  public displayGcSpinner: boolean = false;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: string = 'Site';
  public allHeaders: string[];
  private additionalHeaders: string[];
  public growlMessages: Message[] = [];
  public displaySpinnerMessage: string = 'Geocoding Locations';

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService,
    private messageService: MessageService,
    private mapService: MapService,
    private geocodingRespService: GeocodingResponseService) { }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public static geocodingFailure(geocodingResponse: any) : boolean {
    return geocodingResponse['Match Quality'] === 'E' || geocodingResponse['Match Code'].startsWith('E');
  }

  // this should be implemented in an equals() method in the model
  public static compareSites(site1: GeocodingResponse, site2: GeocodingResponse) : boolean {
    return site1.number === site2['Number'];
  }

  /**
   * Manually transforms a Fuse payload into a Fuse response so we can bypass Fuse for pre-geocoded sites
   * @param inputSite - The site to transform
   * @returns {any} - The site in Fuse response shape
   */
  private static transformSite(inputSite: any) : any {
    const result = {};
    for (const [k, v] of Object.entries(inputSite)) {
      let newKey: string;
      switch (k.toUpperCase()) {
        case 'STREET':
          newKey = 'Address';
          break;
        case 'CITY':
          newKey = 'City';
          break;
        case 'STATE':
          newKey = 'State';
          break;
        case 'ZIP':
          newKey = 'ZIP';
          break;
        case 'LATITUDE':
          newKey = 'Latitude';
          break;
        case 'LONGITUDE':
          newKey = 'Longitude';
          break;
        case 'NAME':
          newKey = 'Name';
          break;
        case 'NUMBER':
          newKey = 'Number';
          break;
        case 'MARKET':
          newKey = 'Market';
          break;
        default:
          newKey = k;
      }
      result[newKey] = v;
    }
    return result;
  }

  private static prepSiteForFuse(inputSite: any) : any {
    const result = {};
    for (const [k, v] of Object.entries(inputSite)) {
      // since we're sending to Fuse anyway, don't include anything that looks like lat/lon
      if (!(k.toUpperCase() === 'LATITUDE' || k.toUpperCase() === 'LONGITUDE')) {
        result[k] = v;
      }
    }
    return result;
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
      this.allHeaders = csvRecords[0].split(',');
      this.additionalHeaders = [];
      let headerPositions: any = {};

      try {
        headerPositions = this.verifyCSVColumns(this.allHeaders);
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

        if (csvColumns.length === this.allHeaders.length) {
          for (let j = 0; j < csvColumns.length; j++) {
            // console.log('importing - site[' + this.headers[j] + '] = ' + csvColumns[j]);
            site[this.allHeaders[j]] = csvColumns[j];
          }
          if (headerPositions.lat == null || headerPositions.lon == null ||
            site[this.allHeaders[headerPositions.lat]] == null || site[this.allHeaders[headerPositions.lat]] === '' ||
            site[this.allHeaders[headerPositions.lon]] == null || site[this.allHeaders[headerPositions.lon]] === '') {
            site['Geocode Status'] = 'SUCCESS';
            sitesWithoutGeocode.push(UploadLocationsComponent.prepSiteForFuse(site));
          } else {
            site['Geocode Status'] = 'PROVIDED';
            sitesWithGeocode.push(UploadLocationsComponent.transformSite(site));
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
      let isStandard = false;
      column = column.toUpperCase().trim();

      if (column === 'STREET' ||
          column === 'ADDRESS' ||
          column === 'ADDR') {
        addressFlag = true;
        headerPosition.street = count;
        this.allHeaders[j] = 'street';
        isStandard = true;
      }
      if (column === 'CITY' ||
          column === 'CTY' ) {
        cityFlag = true;
        headerPosition.city = count;
        this.allHeaders[j] = 'city';
        isStandard = true;
      }
      if (column === 'STATE' ||
          column === 'ST') {
        stateFlag = true;
        headerPosition.state = count;
        this.allHeaders[j] = 'state';
        isStandard = true;
      }
      if (column === 'ZIP' ||
          column === 'CODE' ||
          column === 'POSTAL' ||
          column === 'POSTAL CODE') {
        zipFlag = true;
        headerPosition.zip = count;
        this.allHeaders[j] = 'zip';
        isStandard = true;
      }
      if (column === 'Y' ||
          column === 'Y (OPTIONAL)' ||
          column === 'Y(OPTIONAL)' ||
          column === 'Y OPTIONAL' ||
          column === 'LATITUDE' ||
          column === 'LAT') {
        latFlag = true;
        headerPosition.lat = count;
        this.allHeaders[j] = 'latitude';
        isStandard = true;
      }
      if (column === 'X' ||
          column === 'X (OPTIONAL)' ||
          column === 'X(OPTIONAL)' ||
          column === 'X OPTIONAL' ||
          column === 'LONGITUDE') {
        lonFlag = true;
        headerPosition.lon = count;
        this.allHeaders[j] = 'longitude';
        isStandard = true;
      }
      if (!nameFlag) {
        if (column.includes('NAME') ||
            column.includes('FIRM')) {
          nameFlag = true;
          headerPosition.name = count;
          this.allHeaders[j] = 'name';
          isStandard = true;
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
          this.allHeaders[j] = 'number';
          isStandard = true;
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
         this.allHeaders[j] = 'Market';
        isStandard = true;
      }

      if (!isStandard) {
        //add the header to the additional headers array
        this.additionalHeaders.push(column);
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
    currentSite['Name']   = row['Name'];
    currentSite['Number'] = row['Number'];
    currentSite['Address'] = row['Original Address'];
    currentSite['City']   = row['Original City'];
    currentSite['State']  = row['Original State'];
    currentSite['ZIP']    = row['Original ZIP'];

    Object.keys(row).forEach(site => {
      if (['Number', 'Name', 'Address', 'City', 'State', 'ZIP',
           'Geocode Status', 'Latitude', 'Longitude', 'Match Code',
           'Match Quality', 'Original Address', 'Original City',
           'Original State', 'Original ZIP'].indexOf(site) < 0) {
        currentSite[site] = row[site];
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
    site.addressline = row.Address;
    site.city = row.City;
    site.state = row.State;
    site.zip = row.ZIP;
    site.number = row.Number;
    for (let i = 0; i < this.failedSites.length; i++) {
      if (UploadLocationsComponent.compareSites(site, this.failedSites[i])) {
        this.failedSites.splice(i, 1);
      }
    }
  }

  private async parseGeoResponse(geoResponses: any[]) : Promise<GeocodingResponse[]> {
    let geocodingResponseList: GeocodingResponse[] = [];
    for (const geoResponse of geoResponses) {
      const geocodingResponse: GeocodingResponse = new GeocodingResponse();
      const geocodingAttrList: GeocodingAttributes[] = [];

      if (geoResponse['Geocode Status'] !== 'PROVIDED' && UploadLocationsComponent.geocodingFailure(geoResponse)) {
        geoResponse['Geocode Status'] = 'ERROR';
        this.failedSites.push(geoResponse); //push to failed sites
        UploadLocationsComponent.failedSiteCounter++;
        continue;
      }

      // where there are two options, the first is the Fuse response field, the second is the client supplied (normalized)
      geocodingResponse.latitude = geoResponse['Latitude']; // || geoResponse['latitude'];
      geocodingResponse.longitude = geoResponse['Longitude']; // || geoResponse['longitude'];
      geocodingResponse.addressline = geoResponse['Address']; // || geoResponse['street'];
      geocodingResponse.city = geoResponse['City']; // || geoResponse['city'];
      geocodingResponse.state = geoResponse['State']; // || geoResponse['state'];
      geocodingResponse.zip = geoResponse['ZIP']; // || geoResponse['zip'];
      geocodingResponse.number = geoResponse['Number']; // || geoResponse['number'];
      geocodingResponse.name = geoResponse['Name']; // || geoResponse['name'];
      geocodingResponse.orgAddr = geoResponse['Original Address'];
      geocodingResponse.orgCity = geoResponse['Original City'];
      geocodingResponse.orgState = geoResponse['Original State'];
      geocodingResponse.zip10 = geoResponse['Original ZIP'];
      geocodingResponse.status = geoResponse['Geocode Status'];
      geocodingResponse.marketName = geoResponse['Market']; // || geoResponse['market'];
      geocodingResponse.matchCode = geoResponse['Match Code'];
      geocodingResponse.locationQualityCode = geoResponse['Match Quality'];

      if (geocodingResponse.number == null || geocodingResponse.number == '') {
        geocodingResponse.number = this.geocodingRespService.getNewSitePk().toString();
        geoResponse['Number'] = geocodingResponse.number;
      }

      for (const [k, v] of Object.entries(geoResponse)) {
        //if (this.additionalHeaders.indexOf(k.toUpperCase()) > -1) {
          const geocodingAttr = new GeocodingAttributes();
          geocodingAttr.attributeName = k;
          geocodingAttr.attributeValue = v;
          geocodingAttrList.push(geocodingAttr);
        //}
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
