import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { map } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { siteListUpload } from './upload.rules';
import { environment } from '../../../environments/environment';
import { AppBusinessSearchService, BusinessSearchCategory, BusinessSearchRequest, BusinessSearchResponse } from '../../services/app-business-search.service';
import { BusinessSearchComponent, SearchEventData } from './business-search/business-search.component';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppStateService } from '../../services/app-state.service';
import { LocalAppState } from '../../state/app.interfaces';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '../../messaging';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';

@Component({
  selector: 'val-add-locations-tab',
  templateUrl: './add-locations-tab.component.html'
})
export class AddLocationsTabComponent implements OnInit {

  @ViewChild('businessSearch') businessSearchComponent: BusinessSearchComponent;
  @ViewChild('manualSiteEntry') manualSiteEntry: ManualEntryComponent;
  @ViewChild('manualCompetitorEntry') manualCompetitorEntry: ManualEntryComponent;

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
              private store$: Store<LocalAppState>) {}

  ngOnInit() {
    this.failures$ = combineLatest(this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$).pipe(
      map(([sites, competitors]) => [...sites, ...competitors])
    );
    this.hasFailures$ = this.appLocationService.hasFailures$;
    this.totalCount$ = this.appLocationService.totalCount$;
    this.searchCategories$ = this.businessSearchService.getCategories();
    this.appStateService.clearUI$.subscribe(() => {
      this.businessSearchComponent.clear();
      this.manualSiteEntry.clear();
      this.manualCompetitorEntry.clear();
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
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.store$.dispatch(new CreateLocationUsageMetric('failure', 'accept', metricText));
  }

  resubmit(site: ImpGeofootprintLocation) {
    const currentSiteType = ImpClientLocationTypeCodes.parse(site.clientLocationTypeCode);
    const newSiteType = ImpClientLocationTypeCodes.markSuccessful(currentSiteType);
    const newRequest = new ValGeocodingRequest(site, true);
    delete newRequest['latitude'];
    delete newRequest['longitude'];
    this.appLocationService.deleteLocations([site]);
    this.processSiteRequests(newRequest, newSiteType);
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.store$.dispatch(new CreateLocationUsageMetric('failure', 'resubmit', metricText));
  }

  manuallyGeocode(site: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes){
    //validate Manually added geocodes
    const locations = this.impGeofootprintLocationService.get();
    //const locations = this.appStateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations;
    if (locations.filter(loc => loc.locationNumber === site.number).length > 0 && siteType !== ImpClientLocationTypeCodes.Competitor){
      this.store$.dispatch(new ErrorNotification({ message: 'Site Number already exist on the project.', notificationTitle: 'Geocoding Error' }));
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    } else {
      const mktValue = site.Market != null ? `~Market=${site.Market}` : '';
      const metricsText = `Number=${site.number}~Name=${site.name}~Street=${site.street}~City=${site.city}~State=${site.state}~ZIP=${site.zip}${mktValue}`;
      this.store$.dispatch(new CreateLocationUsageMetric('single-site', 'add', metricsText));
      this.processSiteRequests(site,  siteType);
      if (siteType !== ImpClientLocationTypeCodes.Competitor)
            this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    }
  }

  processSiteRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes) {
    console.log('Processing requests:', siteOrSites);
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const pluralize = sites.length > 1 ? 's' : '';
    this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: `Geocoding ${sites.length} ${siteType}${pluralize}` }));
    const locationCache: ImpGeofootprintLocation[] = [];
    this.appLocationService.geocode(sites, siteType).subscribe(
      locations => locationCache.push(...locations),
      err => this.handleError('Geocoding Error', 'There was an error geocoding the provided sites', err),
      () => {
        const successfulLocations = locationCache.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
        this.appLocationService.persistLocationsAndAttributes(locationCache);
        if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
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
    const metricName = 'Import as ' + event.siteType;
    this.store$.dispatch(new CreateLocationUsageMetric('business-search', 'import', metricName, geoRequests.length));
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
    this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: 'Searching...' }));
    this.businessSearchService.getBusinesses(searchPayload).subscribe(
      results => {
          this.store$.dispatch(new CreateLocationUsageMetric('business-search', 'search', metricText, results.length));
          this.searchResults$.next(results);
        },
      err => this.handleError('Business Search', 'There was an error retrieving Business Search results', err),
      () => this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }))
      );
  }

  private handleError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
    this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader }));
    console.error(errorMessage, errorObject);
  }
}
