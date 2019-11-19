import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { Store, select } from '@ngrx/store';
import { FullAppState } from 'app/state/app.interfaces';
import { map, filter, take } from 'rxjs/operators';
import { selectors } from '@val/esri';
import { AppLocationService } from 'app/services/app-location.service';
import { CreateLocationUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { HomeGeocode, Geocode } from 'app/state/homeGeocode/homeGeo.actions';
import { ValGeocodingRequest } from 'app/models/val-geocoding-request.model';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';

@Component({
  selector: 'val-failed-locations-tab',
  templateUrl: './failed-locations-tab.component.html',
  styleUrls: ['./failed-locations-tab.component.css']
})
export class FailedLocationsTabComponent implements OnInit {

  hasFailures$: Observable<boolean>;
  failures$: Observable<ImpGeofootprintLocation[]>;
  totalCount$: Observable<number>;

  constructor(private store$: Store<FullAppState>,
              private fullStateStore$: Store<FullAppState>,
              private appLocationService: AppLocationService) { }

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.failures$ = combineLatest(this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$).pipe(
        map(([sites, competitors]) => [...sites, ...competitors])
      );
      this.hasFailures$ = this.appLocationService.hasFailures$;
      this.totalCount$ = this.appLocationService.totalCount$;
    });
  }

  processSiteRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, isEdit?: boolean) {
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
console.log('### failed-locations-tab - processSiteRequests sites:', sites);
    const reCalculateHomeGeos = false;
    const isLocationEdit =  isEdit;
    this.store$.dispatch(new Geocode({sites, siteType, reCalculateHomeGeos, isLocationEdit}));
  }

  remove(site: ImpGeofootprintLocation | ImpGeofootprintLocation[]) {
    console.log('### failed-locations-tabl.remove - #sites: ' + Array.isArray(site) ? (site as ImpGeofootprintLocation[]).length : 1);
    this.appLocationService.deleteLocations(Array.isArray(site) ? site : [site]);
  }

  accept(sites: ImpGeofootprintLocation[]) {
    const toHomeGeocode: ImpGeofootprintLocation[] = [];
    const reCalculateHomeGeos = false;
    const isLocationEdit =  false;
    let notifySiteChanges: boolean = false;

    sites.forEach(site => {
      site.clientLocationTypeCode = site.clientLocationTypeCode.replace('Failed ', '');
      if (site.recordStatusCode === 'PROVIDED'){
        const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home Digital ATZ']);
        site.impGeofootprintLocAttribs.forEach(attr => {
          if (homeGeoColumnsSet.has(attr.attributeCode)){
            attr.attributeValue = '';
          }
        });
        site.impGeofootprintTradeAreas = [];
        site['homeGeoFound'] = null;
        site.isActive = true;
        toHomeGeocode.push(site);
      }
      else
        notifySiteChanges = true;

      const metricText = AppLocationService.createMetricTextForLocation(site);
      this.store$.dispatch(new CreateLocationUsageMetric('failure', 'accept', metricText));
    });

    if (toHomeGeocode.length > 0)
      this.store$.dispatch(new HomeGeocode({locations: toHomeGeocode, isLocationEdit, reCalculateHomeGeos}));

    if (notifySiteChanges)
      this.appLocationService.notifySiteChanges();
  }

  resubmit(sites: ImpGeofootprintLocation[]) {
    console.log('### add-locations-tab - resubmit - fired');
    let   geocodingRequests: ValGeocodingRequest[];
    const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home Digital ATZ']);
    const siteTypes = new Set(sites.map(site => site.clientLocationTypeCode));
    siteTypes.forEach(siteType => console.log('### siteType:', siteType));

    // Process site requests on a per site type basis (sites, competitors)
    siteTypes.forEach(siteType => {
      geocodingRequests = [];
      const currentSiteType = ImpClientLocationTypeCodes.parse(siteType);
      const updatedSiteType = ImpClientLocationTypeCodes.markSuccessful(currentSiteType);

      sites.filter(site => site.clientLocationTypeCode === siteType).forEach(site => {
        site.impGeofootprintLocAttribs.forEach(attr => {
          if (homeGeoColumnsSet.has(attr.attributeCode)){
            attr.attributeValue = '';
          }
        });
        let isRadii: boolean = false;
        if (site.radius1 != null || site.radius2 != null || site.radius3 != null){
          isRadii = true;
        }

        // Build a new geocoding request
        const newRequest = new ValGeocodingRequest(site, true, isRadii);
        newRequest['resubmit'] = true;
        newRequest['Original Address'] = site.locAddress;
        newRequest['Original City'] = site.locCity;
        newRequest['Original State'] = site.locState;
        newRequest['Original ZIP'] = site.locZip;
        delete newRequest['latitude'];
        delete newRequest['longitude'];
        this.appLocationService.deleteLocations([site]);
        geocodingRequests.push(newRequest);

        // Record site metrics
        const metricText = AppLocationService.createMetricTextForLocation(site);
        this.store$.dispatch(new CreateLocationUsageMetric('failure', 'resubmit', metricText));
      });
      // Process this site types requests
      this.processSiteRequests(geocodingRequests, updatedSiteType, true);
    });
  }
}
