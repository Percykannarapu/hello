import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValGeocodingService } from '../../services/app-geocoding.service';
import { ValSiteListService } from '../../services/app-site-list.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { Observable } from 'rxjs';
import { ValGeocodingResponse } from '../../models/val-geocoding-response.model';

@Component({
  selector: 'val-geocoder',
  templateUrl: './geocoder.component.html',
  styleUrls: ['./geocoder.component.css']
})
export class GeocoderComponent implements OnInit {
  public failureCount$: Observable<number>;
  public geocodingFailures$: Observable<ValGeocodingResponse[]>;
  public hasFailures$: Observable<boolean>;
  public currentManualSiteType: string = 'Site';
  public siteModel: ValGeocodingRequest;
  public compModel: ValGeocodingRequest;
  public currentModel: ValGeocodingRequest;

  private spinnerMessage: string = 'Geocoding Locations';
  private messagingKey: string = 'GeocoderComponentKey';

  constructor(public config: AppConfig,
    public geocodingService: ValGeocodingService,
    private siteListService: ValSiteListService,
    private messageService: AppMessagingService,
    private usageService: UsageService) {
    this.hasFailures$ = this.geocodingService.hasFailures$;
    this.geocodingFailures$ = this.geocodingService.geocodingFailures$;
    this.failureCount$ = this.geocodingService.failureCount$;
  }

  public ngOnInit(): void {
    this.siteModel = new ValGeocodingRequest({});
    this.compModel = new ValGeocodingRequest({});
    this.currentModel = this.siteModel;
  }

  public onSiteTypeChange($event): void {
    if ($event === 'Site') {
      this.currentModel = this.siteModel;
    } else {
      this.currentModel = this.compModel;
    }
    this.currentManualSiteType = $event;
  }

  // resubmit a geocoding request for an GeocodingResponse that failed to geocode previously
  public onResubmit(row) {
    this.geocodingService.removeFailedGeocode(row);
    this.messageService.startSpinnerDialog(this.messagingKey, this.spinnerMessage);
    this.siteListService.geocodeAndPersist([row], this.currentManualSiteType).then(() => {
      this.messageService.stopSpinnerDialog(this.messagingKey);
    });
  }

  // remove an GeocodingResponse from the  list of sites that failed to geocode
  public onRemove(row) {
    this.geocodingService.removeFailedGeocode(row);
  }


  public onGeocode() {
    const number = this.currentModel.number != null ? 'Number=' + this.currentModel.number + '~' : '';
    const name = this.currentModel.name != null ? 'Name=' + this.currentModel.name + '~' : '';
    const street = this.currentModel.street != null ? 'Street=' + this.currentModel.street + '~' : '';
    const city = this.currentModel.city != null ? 'City=' + this.currentModel.city + '~' : '';
    const state = this.currentModel.state != null ? 'State=' + this.currentModel.state + '~' : '';
    const zip = this.currentModel.zip != null ? 'ZIP=' + this.currentModel.zip + '~' : '';
    const market = this.currentModel.Market != null ? 'market=' + this.currentModel.Market + '~' : '';
    const x = this.currentModel.longitude != null ? 'X=' + this.currentModel.longitude + '~' : '';
    const y = this.currentModel.latitude != null ? 'Y=' + this.currentModel.latitude : '';
    const metricText = number + name + street + city + state + zip + market + x + y;
    if (this.currentModel.canBeGeocoded()) {
      this.messageService.startSpinnerDialog(this.messagingKey, this.spinnerMessage);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'single-' + this.currentManualSiteType.toLowerCase(), action: 'add' });
      this.usageService.createCounterMetric(usageMetricName, metricText, 1);
      this.siteListService.geocodeAndPersist([this.currentModel], this.currentManualSiteType).then(() => {
        this.messageService.stopSpinnerDialog(this.messagingKey);
      });
    }
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
    this.currentModel.Market = 'Test Market';
    this.currentModel.latitude = '39.967208';
    this.currentModel.longitude = '-85.988858';
  }
}
