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
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

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
  public successCount: number;
  public count: number;
  public failureCount: number;

  private spinnerMessage: string = 'Geocoding Locations';
  private messagingKey: string = 'GeocoderComponentKey';

  constructor(public config: AppConfig,
              public geocodingService: ValGeocodingService,
              private siteListService: ValSiteListService,
              private messageService: AppMessagingService,
              private usageService: UsageService, 
              private locationService: ImpGeofootprintLocationService) {

                    this.hasFailures$ = this.geocodingService.hasFailures$;
                    this.geocodingFailures$ = this.geocodingService.geocodingFailures$;
                    this.failureCount$ = this.geocodingService.failureCount$;
                    // this.totalCount = this.geocodingService.totalCount;
  }

  public ngOnInit(): void {
    this.siteModel = new ValGeocodingRequest({});
    this.compModel = new ValGeocodingRequest({});
    this.currentModel = this.siteModel;

    const s = this.locationService.storeObservable.subscribe(loc => {
        this.successCount = loc.length;
        this.calculateCounts();
      });   
    const f = this.failureCount$.subscribe(n => {
        this.failureCount = n;
        this.calculateCounts();
      });
      
  }
  
  public calculateCounts(){
    this.count = this.successCount + this.failureCount;
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
  public onResubmit(row: ValGeocodingResponse) {
    this.geocodingService.removeFailedGeocode(row);
    this.messageService.startSpinnerDialog(this.messagingKey, this.spinnerMessage);
    this.siteListService.geocodeAndPersist([row.toGeocodingRequest()], this.currentManualSiteType).then(() => {
      this.messageService.stopSpinnerDialog(this.messagingKey);
    });
  }

  public onAccept(row: ValGeocodingResponse) {
    const valGeoList: ValGeocodingResponse[] = [];
    valGeoList.push(row);
        
    this.geocodingService.removeFailedGeocode(row);

    if (row['userHasEdited'] != null && row['userHasEdited'] === true) {
      row['Geocode Status'] = 'PROVIDED';
   } else row['Geocode Status'] = 'SUCCESS';
    this.siteListService.handlePersist(valGeoList.map(r => r.toGeoLocation(this.currentManualSiteType)));

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
    const dupNumber = this.locationService.get().filter(loc => (loc.locationNumber != null && this.currentModel != null && this.currentModel.number != null)
                                                              ? loc.locationNumber.toString() === this.currentModel.number.toString() : false);
    if (this.currentModel.canBeGeocoded() && dupNumber.length == 0) {
      this.messageService.startSpinnerDialog(this.messagingKey, this.spinnerMessage);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'single-' + this.currentManualSiteType.toLowerCase(), action: 'add' });
      this.usageService.createCounterMetric(usageMetricName, metricText, 1);
      this.siteListService.geocodeAndPersist([this.currentModel], this.currentManualSiteType).then(() => {
        this.messageService.stopSpinnerDialog(this.messagingKey);
      });
    }
    else{
      this.handleError(`Site Number already exist on the project.`);
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

  public loadTecumseh() {
   this.clearFields();
   this.currentModel.name = 'Tecumseh All Owner Groups within 20 miles';
   this.currentModel.street = '411 E Chicago Blvd';
   this.currentModel.city = 'Tecumseh';
   this.currentModel.state = 'MI';
   this.currentModel.zip = '49286';
   this.currentModel.Market = 'Test Market';
   this.currentModel.latitude = '42.004672';
   this.currentModel.longitude = '-83.939051';
 }

  private handleError(message: string) : void {
   // this.messageService.stopSpinnerDialog(this.spinnerKey);
    this.messageService.showGrowlError('Geocoding Error', message);
  }
}
