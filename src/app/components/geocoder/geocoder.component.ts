import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { InputTextModule, ButtonModule, SharedModule, FileUploadModule, GrowlModule, Message } from 'primeng/primeng';


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

  private geocodingResponse: GeocodingResponse;
  private esriMap: __esri.Map;

  //get the map from the service and add the new graphic
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private geocoderService: GeocoderService, private mapService: MapService, private esriLoader: EsriLoaderService) { }

  ngOnInit() {
    /*this.mapService.getMap().then(esriMap => {
      this.esriMap = esriMap;
    })*/
  }

  geocodeAddress() {
    console.log("Geocoding request received in GeocoderComponent for: " + this.street + " " + this.city + " " + this.state + " " + this.zip);
    var accountLocation: AccountLocation = {
      street: this.street,
      city: this.city,
      state: this.state,
      postalCode: this.zip
    }
    console.log("Calling GeocoderService")
    var observable = this.geocoderService.geocode(accountLocation);
    observable.subscribe((res) => {
      this.geocodingResponse = res.payload;
      console.log("In GeocoderComponent got back GeocodingResponse: " + JSON.stringify(this.geocodingResponse, null, 4));
      this.xcoord = String(this.geocodingResponse.latitude);
      this.ycoord = String(this.geocodingResponse.longitude);
      if(this.geocodingResponse.locationQualityCode == "E") {
        const growlMessage: Message = {
          summary: "Failed to geocode your address",
          severity: "error",
          detail: JSON.stringify(accountLocation, null, 4)
        }
        this.geocodingErrors[0] = growlMessage;
        return;
      }
      this.mapService.plotMarker(this.geocodingResponse.latitude, this.geocodingResponse.longitude);
    });
  }

  loadVPW() {
    this.street = "1995 Victor Pkwy";
    this.city = "Livonia";
    this.state = "MI";
    this.zip = 48152;
  }

  showCSVMessage() {
    console.log("fired message");
    this.CSVMessage = "Yeah, I wish this worked too";
  }

  geocodeCSV(event) {
    console.log("fired geocodeCSV()");
    var input = event.target;
    var reader = new FileReader();
    reader.readAsText(input.files[0]);
    reader.onload = (data) => {
      console.log("read file data");
      const csvData = reader.result;
      const csvRecords = csvData.split(/\r\n|\n/);
      const headers = csvRecords[0].split(',');

      //make sure to start loop at 1 to skip headers
      for (let i = 1; i < csvRecords.length; i++) {
        const data = csvRecords[i].split(',');
        if (data.length == headers.length) {
          const csvRecord = [];
          for (let j = 0; j < headers.length; j++) {
            csvRecord.push(data[j]);
          }
          this.street = csvRecord[0];
          this.city = csvRecord[1];
          this.state = csvRecord[2];
          this.zip = csvRecord[3];
          this.geocodeAddress();
        }
      }
    }
  }
}
