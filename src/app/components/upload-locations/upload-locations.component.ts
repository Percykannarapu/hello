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
  public failedSites: GeocodingResponse[] = [];

  private geocodingResponse: GeocodingResponse;
  public displayGcSpinner: boolean = false;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: String = 'Site';
  public headers: any;

  @ViewChild('fileUpload1') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService, 
              private messageService: MessageService, private mapService: MapService) { }

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
        if (column === 'Y' || column === 'latitude') {
          latFlag = true;
          headerPosition.lat = count;
          this.headers[j] = 'Latitude';
        }
        if (column === 'X' || column === 'longitude') {
          lonFlag = true;
          headerPosition.lon = count;
          this.headers[j] = 'Longitude';
        }
        if (column === 'NAME' || column === 'FIRM' || column === 'BRAND NAME' ){
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
    return false;
  }

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public geocodingFailure(geocodingResponse: any) : boolean {
    if (geocodingResponse['Match Quality'].toString() === 'E' || geocodingResponse['Match Code'].toString() === 'E') {
      return true;
    }
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
                failedSite.number = UploadLocationsComponent.failedSiteCounter.toString();
                const failedSites = Array.from(this.failedSites);
                failedSites.push(failedSite);
                this.failedSites = failedSites;
                UploadLocationsComponent.failedSiteCounter++;
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
