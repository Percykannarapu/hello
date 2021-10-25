import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { UserService } from 'app/services/user.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { siteListFileParser } from '../../../common/file-parsing-rules';
import { ValGeocodingRequest } from '../../../common/models/val-geocoding-request.model';
import { AppEditSiteService } from '../../../services/app-editsite.service';
import { AppGeocodingService } from '../../../services/app-geocoding.service';
import { AppLocationService } from '../../../services/app-location.service';
import { AppLoggingService } from '../../../services/app-logging.service';
import { AppStateService } from '../../../services/app-state.service';
import { AppTradeAreaService } from '../../../services/app-trade-area.service';
import { FullAppState } from '../../../state/app.interfaces';
import { Geocode } from '../../../state/homeGeocode/homeGeo.actions';
import { CreateLocationUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ManualEntryComponent } from './manual-entry/manual-entry.component';

@Component({
  selector: 'val-add-locations-tab',
  templateUrl: './add-locations-tab.component.html'
})
export class AddLocationsTabComponent implements OnInit {

  @ViewChild('manualSiteEntry', { static: true }) manualSiteEntry: ManualEntryComponent;
  @ViewChild('manualCompetitorEntry', { static: true }) manualCompetitorEntry: ManualEntryComponent;

  isProd: boolean = environment.production;

  hasFailures$: Observable<boolean>;
  totalCount$: Observable<number>;
  failures$: Observable<ImpGeofootprintLocation[]>;

  siteTypes = ImpClientLocationTypeCodes;

  constructor(private appLocationService: AppLocationService,
              private impGeofootprintLocationService: ImpGeofootprintLocationService,
              private geocoderService: AppGeocodingService,
              private appTradeAreaService: AppTradeAreaService,
              private appStateService: AppStateService,
              private logger: AppLoggingService,
              private store$: Store<FullAppState>,
              private appEditSiteService: AppEditSiteService,
              private userService: UserService) {}

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


    this.appStateService.clearUI$.subscribe(() => {
      this.manualSiteEntry.clear();
      this.manualCompetitorEntry.clear();
    });
  }

  onUpload(csvData: string[], siteType: SuccessfulLocationTypeCodes) {
    this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode == siteType).forEach(site => {
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.locationNumber);
    });
    const requests = this.geocoderService.createRequestsFromRaw(csvData, siteType, siteListFileParser);
    const hasUserGrant = this.userService.userHasGrants(['IMPOWER_UNRESTRICTED_SITES']);
    this.logger.debug.log('File Upload valid count', requests.length);
    if (requests.length > 0){
      if (requests.length > 2000 && !hasUserGrant){
        this.store$.dispatch(ErrorNotification({ message: 'You are limited to 2,000 sites per analysis. Please reduce your site list and try again', notificationTitle: 'Location Upload Error' }));
      } else {
        this.validateHomeDmaIfExists(requests);
        this.processSiteRequests(requests, siteType);
      }
    }
  }

  validateHomeDmaIfExists(requests: ValGeocodingRequest[]) {
    requests.forEach(req => {
      if (req['Home DMA'] != null && req['Home DMA'] != undefined && req['Home DMA'].length != 0 && !Number.isNaN(parseInt(req['Home DMA'], 10)) && req['Home DMA'].length === 3)
        req['Home DMA'] = '0' + req['Home DMA'];
    });
  }

  manuallyGeocode(site: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    //validate Manually added geocodes
    const locations = this.impGeofootprintLocationService.get();
    if (locations.filter(loc => loc.locationNumber === site.number.trim() || loc.locationNumber.toLowerCase() === site.number.toLowerCase()).length > 0 && siteType !== ImpClientLocationTypeCodes.Competitor){
      this.store$.dispatch(ErrorNotification({ message: 'Site Number already exist on the project.', notificationTitle: 'Geocoding Error' }));
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
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const reCalculateHomeGeos = false;
    const isLocationEdit: boolean =  (isEdit !== null && isEdit !== undefined) ? isEdit : false;
    this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
  }
}
