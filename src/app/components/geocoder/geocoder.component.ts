import { Component, OnInit } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';

@Component({
  providers: [GeocoderService],
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
  
  private geocodingResponse: GeocodingResponse;

  constructor(private geocoderService: GeocoderService) { }

  ngOnInit() {
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
    });
    
  }

  delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}
