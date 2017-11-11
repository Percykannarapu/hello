import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { AccountLocation } from '../../Models/AccountLocation';
import { GeocoderService } from '../../services/geocoder.service';
import { GeocodingResponse } from '../../Models/GeocodingResponse';
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { InputTextModule, ButtonModule } from 'primeng/primeng';


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
      this.mapService.plotMarker(this.geocodingResponse.latitude, this.geocodingResponse.longitude);
    });
  } 
}
