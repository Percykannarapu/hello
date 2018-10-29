import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { map } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { UsageService } from '../../services/usage.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { siteListUpload } from './upload.rules';
import { AppMessagingService } from '../../services/app-messaging.service';
import { environment } from '../../../environments/environment';
import { AppBusinessSearchService, BusinessSearchCategory, BusinessSearchRequest, BusinessSearchResponse } from '../../services/app-business-search.service';
import { BusinessSearchComponent, SearchEventData } from './business-search/business-search.component';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-add-locations-tab',
  templateUrl: './add-locations-tab.component.html'
})
export class AddLocationsTabComponent implements OnInit {

  @ViewChild('businessSearch') businessSearchComponent: BusinessSearchComponent;

  isProd: boolean = environment.production;
  businessSearchLimit: number = 20000;

  hasFailures$: Observable<boolean>;
  totalCount$: Observable<number>;
  failures$: Observable<ImpGeofootprintLocation[]>;
  searchCategories$: Observable<BusinessSearchCategory[]>;
  searchResults$ = new BehaviorSubject<BusinessSearchResponse[]>([]);

  siteTypes = ImpClientLocationTypeCodes;

  private spinnerKey = 'ADD_LOCATION_TAB_SPINNER';

  constructor(private appLocationService: AppLocationService,
              private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private geocoderService: AppGeocodingService,
              private businessSearchService: AppBusinessSearchService,
              private appStateService: AppStateService,
              private usageService: UsageService,
              private messageService: AppMessagingService) {}

  ngOnInit() {
    this.failures$ = combineLatest(this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$).pipe(
      map(([sites, competitors]) => [...sites, ...competitors])
    );
    this.hasFailures$ = this.appLocationService.hasFailures$;
    this.totalCount$ = this.appLocationService.totalCount$;
    this.searchCategories$ = this.businessSearchService.getCategories();
    this.appStateService.clearUI$.subscribe(() => {
      this.businessSearchComponent.clear();
    });
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

  manuallyGeocode(siteOrSites: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes){
    //validate Manually added geocodes
    const locations = this.appStateService.currentProject$.getValue().getImpGeofootprintLocations();
    if (locations.filter(loc => loc.locationNumber === siteOrSites.number).length > 0 ){
      this.messageService.showErrorNotification('Geocoding Error', 'Site Number already exist on the project.');
    }
    else{
      this.processSiteRequests(siteOrSites,  siteType);
    }

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

  onAddBusiness(event: { siteType: string; businesses: BusinessSearchResponse[] }) {
    const siteTypeCode = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(event.siteType));
    const geoRequests: ValGeocodingRequest[] = [];
    event.businesses.forEach(business => {
      const locationId = this.impGeofootprintLocationService.getNextLocationNumber();
      geoRequests.push(new ValGeocodingRequest({
        name: business.firm,
        number: locationId.toString(),
        street: business.address,
        city: business.city,
        state: business.state,
        zip: business.zip,
        longitude: business.x.toString(),
        latitude: business.y.toString(),
        'Market Code': business.pricing_market_name
      }));
    });
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'business-search', action: 'import' });
    const metricName = 'Import as ' + event.siteType;
    this.usageService.createCounterMetric(usageMetricName, metricName, geoRequests.length);
    this.processSiteRequests(geoRequests, siteTypeCode);
  }

  onBusinessSearch(event: SearchEventData) {
    const searchPayload: BusinessSearchRequest = {
      ...event,
      eliminateBlankFirmNames: 'True',
      siteLimit: this.businessSearchLimit.toString(),
      sites: this.impGeofootprintLocationService.get().map(loc => ({
        x: loc.xcoord,
        y: loc.ycoord,
        homeGeocode: loc.homeGeocode || loc.locZip.substring(0, 5),
        locationName: loc.locationName
      }))
    };
    const measures: string[] = [];
    measures.push(`SIC=${searchPayload.sics.map(sic3 =>  sic3.sic)}`.substring(0, 100));
    measures.push(`Miles=${searchPayload.radius}`);
    if (searchPayload.name != null && searchPayload.name.length > 0) {
      measures.push(`BusinessName=${searchPayload.name}`);
    }
    if (searchPayload.city != null && searchPayload.city.length > 0) {
      measures.push(`City=${searchPayload.city}`);
    }
    const metricText = measures.join('~');
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'business-search', action: 'search' });
    this.messageService.startSpinnerDialog(this.spinnerKey, 'Searching...');
    this.businessSearchService.getBusinesses(searchPayload).subscribe(
      results => {
          this.usageService.createCounterMetric(usageMetricName, metricText, results.length);
          this.searchResults$.next(results);
        },
      err => this.handleError('Business Search', 'There was an error retreiving Business Search results', err),
      () => this.messageService.stopSpinnerDialog(this.spinnerKey)
      );
  }

  private handleError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.messageService.stopSpinnerDialog(this.spinnerKey);
    this.messageService.showErrorNotification(errorHeader, errorMessage);
    console.error(errorMessage, errorObject);
  }
}
