import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingService } from '../../services/app-geocoding.service';
import { ValSiteListService } from '../../services/app-site-list.service';

@Component({
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {
  public currentManualSiteType: string = 'Site';
  public siteModel: ValGeocodingRequest;
  public compModel: ValGeocodingRequest;
  public currentModel: ValGeocodingRequest;
  public displayGcSpinner: boolean = false;
  public displaySpinnerMessage: string = 'Geocoding Locations';

  constructor(public  config: AppConfig,
              public geocodingService: ValGeocodingService,
              private siteListService: ValSiteListService) { }

  public ngOnInit() : void {
    this.siteModel = new ValGeocodingRequest({});
    this.compModel = new ValGeocodingRequest({});
    this.currentModel = this.siteModel;
  }

  public onSiteTypeChange($event) : void {
    if ($event === 'Site'){
      this.currentModel = this.siteModel;
    } else {
      this.currentModel = this.compModel;
    }
    this.currentManualSiteType = $event;
  }

  // resubmit a geocoding request for an GeocodingResponse that failed to geocode previously
  public  onResubmit(row) {
    this.geocodingService.removeFailedGeocode(row);
    this.displayGcSpinner = true;
    this.siteListService.geocodeAndPersist([row], this.currentManualSiteType).then(() => {
      this.displayGcSpinner = false;
    });
  }

  // remove an GeocodingResponse from the list of sites that failed to geocode
  public onRemove(row) {
    this.geocodingService.removeFailedGeocode(row);
  }

  public onGeocode() {
    this.displayGcSpinner = true;
    this.siteListService.geocodeAndPersist([this.currentModel], this.currentManualSiteType).then(() => {
      this.displayGcSpinner = false;
    });
  }

  public clearFields() {
    if (this.currentManualSiteType === 'Site') {
      this.siteModel = new ValGeocodingRequest({});
    } else {
      this.compModel = new ValGeocodingRequest({});
    }
    this.onSiteTypeChange(this.currentManualSiteType);
  }

  public loadVPW() {
    this.clearFields();
    this.currentModel.name = 'VPW';
    this.currentModel.street = '19975 Victor Pkwy';
    this.currentModel.city = 'Livonia';
    this.currentModel.state = 'MI';
    this.currentModel.zip = '48152';
  }

  public loadSkyZone() {
    this.clearFields();
    this.currentModel.name = 'Sky Zone Trampoline Park';
    this.currentModel.street = '10080 E 121st St #182';
    this.currentModel.city = 'Fishers';
    this.currentModel.state = 'IN';
    this.currentModel.zip = '46037';
    this.currentModel.market = 'Test Market';
    this.currentModel.latitude = 39.967208;
    this.currentModel.longitude = -85.988858;
  }
}
