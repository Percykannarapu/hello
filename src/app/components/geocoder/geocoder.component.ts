import { Component, OnInit } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';

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
    this.geocoderService.geocode(accountLocation);
  }

}
