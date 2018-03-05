import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingService } from '../../services/val-geocoding.service';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';

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
              private locationService: ImpGeofootprintLocationService,
              private attributeService: ImpGeofootprintLocAttribService) { }

  public ngOnInit() : void {
    this.siteModel = new ValGeocodingRequest({});
    this.compModel = new ValGeocodingRequest({});
    this.currentModel = this.siteModel;
  }

  public onSiteTypeChange($event) : void {
    if ($event === 'Site') {
      this.currentModel = this.siteModel;
    } else {
      this.currentModel = this.compModel;
    }
    this.currentManualSiteType = $event;
  }

  // resubmit a geocoding request for an GeocodingResponse that failed to geocode previously
  public  onResubmit(row) {
    this.geocodingService.removeFailedGeocode(row);
    this.handleGeocodingAndPersisting(row);
  }

  // remove an GeocodingResponse from the list of sites that failed to geocode
  public onRemove(row) {
    this.geocodingService.removeFailedGeocode(row);
  }

  public onGeocode() {
    this.handleGeocodingAndPersisting([this.currentModel]);
  }

  private handleGeocodingAndPersisting(data: ValGeocodingRequest[]) {
    this.displayGcSpinner = true;
    this.geocodingService.geocodeLocations(data).then((result: ValGeocodingResponse[]) => {
      this.handlePersist(result.map(r => r.toGeoLocation(this.currentManualSiteType)));
      this.displayGcSpinner = false;
    });
  }

  private handlePersist(data: ImpGeofootprintLocation[]) : void {
    const flatten = (previous: ImpGeofootprintLocAttrib[], current: ImpGeofootprintLocAttrib[]) => {
      previous.push(...current);
      return previous;
    };
    const attributes: ImpGeofootprintLocAttrib[] = data.map(l => l['_attributes']).reduce(flatten, []);
    data.forEach(d => delete d['_attributes']);
    this.locationService.add(data);
    this.attributeService.add(attributes);
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
