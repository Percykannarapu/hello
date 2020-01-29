import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { AppBusinessSearchService, BusinessSearchCategory, BusinessSearchRequest, BusinessSearchResponse } from '../../services/app-business-search.service';
import { AppEditSiteService } from '../../services/app-editsite.service';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { AppLocationService } from '../../services/app-location.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { FullAppState } from '../../state/app.interfaces';
import { resetNamedForm } from '../../state/forms/forms.actions';
import { Geocode } from '../../state/homeGeocode/homeGeo.actions';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { BusinessSearchComponent, SearchEventData } from './business-search/business-search.component';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';
import { siteListUpload } from './upload.rules';

@Component({
  selector: 'val-add-locations-tab',
  templateUrl: './add-locations-tab.component.html'
})
export class AddLocationsTabComponent implements OnInit {

  @ViewChild('businessSearch', { static: true }) businessSearchComponent: BusinessSearchComponent;
  @ViewChild('manualSiteEntry', { static: true }) manualSiteEntry: ManualEntryComponent;
  @ViewChild('manualCompetitorEntry', { static: true }) manualCompetitorEntry: ManualEntryComponent;

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
              private appTradeAreaService: AppTradeAreaService,
              private audienceTradeAreaService: ValAudienceTradeareaService,
              private appStateService: AppStateService,
              private store$: Store<FullAppState>,
              private appEditSiteService: AppEditSiteService) {}

  ngOnInit() {
    this.appEditSiteService.editLocationData$.subscribe(message => {
      if (message != null) {
        this.manuallyGeocode(message.siteData, message.type, message.isEdit);
      }
    });

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.failures$ = combineLatest([this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$]).pipe(
        map(([sites, competitors]) => [...sites, ...competitors])
      );
      this.hasFailures$ = this.appLocationService.hasFailures$;
      this.totalCount$ = this.appLocationService.totalCount$;
    });


    this.searchCategories$ = this.businessSearchService.getCategories();
    this.appStateService.clearUI$.subscribe(() => {
      //this.businessSearchComponent.clear();
      this.manualSiteEntry.clear();
      this.manualCompetitorEntry.clear();
    });
  }

  onUpload(csvData: string[], siteType: SuccessfulLocationTypeCodes) {
    this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode == siteType).forEach(site => {
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.locationNumber);
    });
    const requests = this.geocoderService.createRequestsFromRaw(csvData, siteType, siteListUpload);
    if (requests.length > 0){
      this.validateHomeDmaIfExists(requests);
      this.processSiteRequests(requests, siteType);
    }
  }

  validateHomeDmaIfExists(requests: ValGeocodingRequest[]) {
    requests.forEach(req => {
      if (req['Home DMA'] != null && req['Home DMA'] != undefined && req['Home DMA'].length != 0 && !Number.isNaN(parseInt(req['Home DMA'], 10)) && req['Home DMA'].length === 3) req['Home DMA'] = '0' + req['Home DMA'];
    });
  }

  manuallyGeocode(site: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    this.store$.dispatch(resetNamedForm({ path: 'addLocation' }));
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
      this.processSiteRequests(site,  siteType, isEdit);
      if (siteType !== ImpClientLocationTypeCodes.Competitor)
            this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    }
  }

  processSiteRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    //console.log('Processing requests:', siteOrSites);
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const reCalculateHomeGeos = false;
    const isLocationEdit: boolean =  (isEdit !== null && isEdit !== undefined) ? isEdit : false;
    //this.store$.dispatch(new StartBusyIndicatorx({ key: this.spinnerKey, message: `Geocoding ${sites.length} ${siteType}${pluralize}` }));
    this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
    /*const locationCache: ImpGeofootprintLocation[] = [];
    this.appLocationService.geocode(sites, siteType).subscribe(
      locations => locationCache.push(...locations),
      err => this.handleError('Geocoding Error', 'There was an error geocoding the provided sites', err),
      () => {
        const successfulLocations = locationCache.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
        this.appLocationService.persistLocationsAndAttributes(locationCache);
        if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
        if (isEdit == true) {
          this.tradeAreaApplyOnEdit();
        }
      }
    );*/
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
