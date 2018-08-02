import { Component, OnInit } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { map } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { UsageService } from '../../services/usage.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { siteListUpload } from './upload.rules';
import { AppMessagingService } from '../../services/app-messaging.service';

@Component({
  selector: 'val-add-locations-tab',
  templateUrl: './add-locations-tab.component.html'
})
export class AddLocationsTabComponent implements OnInit {

  hasFailures$: Observable<boolean>;
  totalCount$: Observable<number>;
  failures$: Observable<ImpGeofootprintLocation[]>;

  siteTypes = ImpClientLocationTypeCodes;

  private spinnerKey = 'ADD_LOCATION_TAB_SPINNER';

  constructor(private appLocationService: AppLocationService,
              private geocoderService: AppGeocodingService,
              private usageService: UsageService,
              private messageService: AppMessagingService) {}

  ngOnInit() {
    this.failures$ = combineLatest(this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$).pipe(
      map(([sites, competitors]) => [...sites, ...competitors])
    );
    this.hasFailures$ = this.appLocationService.hasFailures$;
    this.totalCount$ = this.appLocationService.totalCount$;
  }

  onUpload(csvData: string[], siteType: SuccessfulLocationTypeCodes) {
    const requests = this.geocoderService.createRequestsFromRaw(csvData, siteType, siteListUpload);
    this.processSiteRequests(requests, siteType);
  }

  remove(site: ImpGeofootprintLocation) {
    this.appLocationService.deleteLocations([site]);
  }

  accept(site: ImpGeofootprintLocation) {
    site.clientLocationTypeCode = site.clientLocationTypeCode.replace('Failed ', '');
    this.appLocationService.notifySiteChanges();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'failure', action: 'accept' });
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }

  resubmit(site: ImpGeofootprintLocation) {
    const currentSiteType = ImpClientLocationTypeCodes.parse(site.clientLocationTypeCode);
    const newSiteType = ImpClientLocationTypeCodes.markSuccessful(currentSiteType);
    this.processSiteRequests(new ValGeocodingRequest(site, true), newSiteType);
    this.appLocationService.deleteLocations([site]);
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'failure', action: 'resubmit' });
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }

  processSiteRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes) {
    console.log('Processing requests:', siteOrSites);
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const pluralize = sites.length > 1 ? 's' : '';
    this.messageService.startSpinnerDialog(this.spinnerKey, `Geocoding ${sites.length} ${siteType}${pluralize}`);
    const locationCache: ImpGeofootprintLocation[] = [];
    this.appLocationService.geocode(sites, siteType).subscribe(
      locations => locationCache.push(...locations),
      err => this.handleError('Geocoding Error', 'There was an error geocoding the provided sites', err),
      () => {
        const successfulLocations = locationCache.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
        this.appLocationService.persistLocationsAndAttributes(locationCache);
        if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
        this.messageService.stopSpinnerDialog(this.spinnerKey);
      }
    );
  }

  private handleError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.messageService.stopSpinnerDialog(this.spinnerKey);
    this.messageService.showGrowlError(errorHeader, errorMessage);
    console.error(errorMessage, errorObject);
  }
}
