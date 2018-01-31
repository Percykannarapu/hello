import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RestResponse } from '../../Models/RestResponse';
import { AmSite } from '../../val-modules/targeting/models/AmSite';
import { MessageService } from '../../val-modules/common/services/message.service';
import { AccountLocations } from '../../Models/AccountLocations';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { Observable } from 'rxjs/Rx';
import { Points } from '../../Models/Points';
import { MapService } from '../../services/map.service';


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
  providers: [GeocoderService, MapService]
})
export class UploadLocationsComponent implements OnInit {

  private static failedSiteCounter: number = 1;
  public failedSites: AmSite[] = [];

  private geocodingResponse: GeocodingResponse;
  public displayGcSpinner: boolean = false;
  public disableshowBusiness: boolean = true; // flag for enabling/disabling the show business search button
  public selector: String = 'Site';

  @ViewChild('fileUpload') private fileUploadEl: ElementRef;

  constructor(private geocoderService: GeocoderService, 
              private messageService: MessageService, private mapService: MapService) { }

  ngOnInit() {
  }

  async geocodeCSV(event) {
    
    const input = event.target;
    const reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      this.displayGcSpinner = true; //
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');
      let headerPosition: CsvHeadersPosition = {};
      try {
        headerPosition = this.verifyCSVColumns(headers);
      }catch (error) {
        //this.messageService.clear();
        //this.messageService.add({ severity: 'error', summary: 'Geo Coding Error', detail: `${error}` });
        //return;
      }
      const observables: Observable<RestResponse>[] = new Array<Observable<RestResponse>>();
      const csvFormattedData: any = [];
      
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

        if (headerPosition.lat === undefined && headerPosition.lon === undefined){
          const amSiteList: AccountLocations[] = [];
          const actLocs = new AccountLocations();
          actLocs.name = csvRecord[headerPosition.name];
          actLocs.street = csvRecord[headerPosition.street];
          actLocs.zip = csvRecord[headerPosition.zip];
          actLocs.state = csvRecord[headerPosition.state];
          actLocs.city = csvRecord[headerPosition.city];
          actLocs.number = csvRecord[headerPosition.number];
          amSiteList.push(actLocs);
          observables.push(this.geocoderService.multiplesitesGeocode(amSiteList));
        }else{
          amSite.name = csvRecord[headerPosition.name];
          amSite.address = csvRecord[headerPosition.street];
          amSite.zip = csvRecord[headerPosition.zip];
          amSite.state = csvRecord[headerPosition.state];
          amSite.city = csvRecord[headerPosition.city];
          //amSite.number = csvRecord[headerPosition.number];
          amSite.ycoord = csvRecord[headerPosition.lat];
          amSite.xcoord = csvRecord[headerPosition.lon];
          csvFormattedData.push({payload: amSite});
        }

        //if (headerPosition.lat === undefined || headerPosition.lon === undefined){
          //observables.push(this.geocoderService.geocode(amSite));
        // }else{
        //   amSite.xcoord = csvRecord[headerPosition.lat];
        //   amSite.ycoord = csvRecord[headerPosition.lon];
        //  }
      }
      if (headerPosition.lat === undefined && headerPosition.lon === undefined){
          Observable.forkJoin(observables).subscribe(res => {
            console.log('forkJoin:::' + res.length);
          //  for (const restResponse of res){
              this.parseCsvResponse(res, true);
              this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
              this.displayGcSpinner = false;
           // }
          });
        }else{
        console.log('csvFormattedData length:::' + csvFormattedData.length);  
        this.parseCsvResponse(csvFormattedData, true);
        this.fileUploadEl.nativeElement.value = ''; // reset the value in the file upload element to an empty string
        this.displayGcSpinner = false;
        
      }
    };
  }
  private verifyCSVColumns(columns: string[]) : CsvHeadersPosition {
    let addressFlag: boolean = false;
    let cityFlag: boolean = false;
    let stateFlag: boolean = false;
    let zipFlag: boolean = false;
    let latFlag: boolean = false;
    let lonFlag: boolean = false;
    let nameFlag: boolean = false;
    let numberFlag: boolean = false;
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
      if (column === 'NAME' || column === 'FIRM'){
        nameFlag = true;
        headerPosition.name = count;
      }
      if (column === 'NUMBER' || column === 'NBR' || column === 'ID' || column === 'NUM' || column === '#'){
        numberFlag = true;
        headerPosition.number = count;
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

  // determine if the response from the geocoder was a failure or not based on the codes we get back
  public geocodingFailure(geocodingResponse: GeocodingResponse) : boolean {
    if (geocodingResponse.locationQualityCode === 'E' || geocodingResponse.matchCode.substr(0, 1) === 'E') {
      return true;
    }
    return false;
  }

  private parseCsvResponse(restResponses: RestResponse[], display?: boolean) : AmSite[] {
    const amSites: AmSite[] = new Array<AmSite>();
    //this.pointsArray = [];
    
    for (const restResponse of restResponses) {
      const geocodingResponseList: any = restResponse.payload;
     // const geocodingResponse = geocodingResponseList[0];
     // for (const geocodingResponse of geocodingResponseList){
           const amSite: AmSite = new AmSite();
            // geocoding failures get pushed into the failedSites array for manual intervention by the user
        if (geocodingResponseList.ycoord === undefined && geocodingResponseList.xcoord === undefined){         
          if (this.geocodingFailure(geocodingResponseList[0])) {
            const failedSite: AmSite = new AmSite();
            failedSite.ycoord = geocodingResponseList[0].latitude;
            failedSite.xcoord = geocodingResponseList[0].longitude;
            failedSite.address = geocodingResponseList[0].addressline;
            failedSite.city = geocodingResponseList[0].city;
            failedSite.state = geocodingResponseList[0].state;
            failedSite.zip = geocodingResponseList[0].zip10;
            failedSite.pk = UploadLocationsComponent.failedSiteCounter;
            const failedSites = Array.from(this.failedSites);
            failedSites.push(failedSite);
            this.failedSites = failedSites;
            UploadLocationsComponent.failedSiteCounter++;
            continue;
          }

          amSite.ycoord = geocodingResponseList[0].latitude;
          amSite.xcoord = geocodingResponseList[0].longitude;
          amSite.address = geocodingResponseList[0].addressline;
          amSite.city = geocodingResponseList[0].city;
          amSite.state = geocodingResponseList[0].state;
          amSite.zip = geocodingResponseList[0].zip;
          amSite.siteId = geocodingResponseList[0].number;
          amSite.name = geocodingResponseList[0].name;
          amSite.pk = Number(geocodingResponseList[0].number);

          const points = new Points();
          points.latitude = geocodingResponseList[0].latitude;
          points.longitude = geocodingResponseList[0].longitude;
          MapService.pointsArray.push(points);
        }
        else{
          amSite.ycoord = geocodingResponseList.ycoord;
          amSite.xcoord = geocodingResponseList.xcoord;
          amSite.address = geocodingResponseList.addressline;
          amSite.city = geocodingResponseList.city;
          amSite.state = geocodingResponseList.state;
          amSite.zip = geocodingResponseList.zip;
          amSite.siteId = geocodingResponseList.number;
          amSite.name = geocodingResponseList.name;
          amSite.pk = Number(geocodingResponseList.number);

          const points = new Points();
          points.latitude = geocodingResponseList.ycoord;
          points.longitude = geocodingResponseList.xcoord;
          MapService.pointsArray.push(points);
        }
          
          amSites.push(amSite);
     // }
    }
    if (display) {
      this.geocoderService.addSitesToMap(amSites, this.selector);
      this.mapService.callTradeArea();
    }
    return amSites;
  }

}
