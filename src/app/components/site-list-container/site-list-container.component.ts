import { ImpGeofootprintGeoAttrib } from '../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { AppLocationService } from '../../services/app-location.service';
import { Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { map } from 'rxjs/operators';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { EsriMapService } from '../../esri/services/esri-map.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { AppStateService } from '../../services/app-state.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppState } from '../../state/app.interfaces';
import { Store } from '@ngrx/store';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '../../messaging';

@Component({
  selector: 'val-site-list-container',
  templateUrl: './site-list-container.component.html',
  styleUrls: ['./site-list-container.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteListContainerComponent implements OnInit {
   // Data store observables
   public  allLocations$: Observable<ImpGeofootprintLocation[]>;
   public  allAttributes$: Observable<ImpGeofootprintLocAttrib[]>;
   public  allGeos$: Observable<ImpGeofootprintGeo[]>;
   public  allGeoAttributes$: Observable<ImpGeofootprintGeoAttrib[]>;

   private spinnerKey = 'MANAGE_LOCATION_TAB_SPINNER';
   public oldData: any;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------   
   constructor(
      public  siteListService: AppLocationService,
      private impGeofootprintLocationService: ImpGeofootprintLocationService,
      private impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
      private tradeAreaService: ImpGeofootprintTradeAreaService,
      private impGeofootprintGeoService: ImpGeofootprintGeoService,
      private geoAttributeService: ImpGeofootprintGeoAttribService,
      private appLocationService: AppLocationService,
      private geocoderService: AppGeocodingService,
      private appStateService: AppStateService,
      private esriMapService: EsriMapService,
      private store$: Store<AppState>) {}

   ngOnInit() {
      // Subscribe to the data stores
      this.allLocations$  = this.impGeofootprintLocationService.storeObservable
                                .pipe(map(locs => Array.from(locs))
                                 //  ,tap(locs => { 
                                 //     if (locs != null && locs.length > 0) {
                                 //       console.log("CONTAINER OBSERVABLE FIRED: locationService - Locs:", locs);
                                 //     }})
                                     );

      this.allAttributes$ = this.impGeofootprintLocAttribService.storeObservable
                                .pipe(map(attribs => Array.from(attribs))
//                                   ,tap(data => console.debug("CONTAINER OBSERVABLE FIRED: impGeofootprintGeoAttribService", data))
                                     );

      this.allGeos$ = this.impGeofootprintGeoService.storeObservable
                          .pipe(map(geos => Array.from(geos))
//                             ,tap(geos => console.debug("SITE-LIST-CONTAINER - allGeos$ fired", geos))
                               );

      this.allGeoAttributes$ = this.geoAttributeService.storeObservable
                                   .pipe(map(geoAttrs => Array.from(geoAttrs))
//                                      ,tap(geoAttrs => console.log("SITE-LIST-CONTAINER - allGeoAttributes$ fired - #", (geoAttrs != null) ? geoAttrs.length : null))
                                        );
   }


   // -----------------------------------------------------------
   // GRID OUTPUT EVENTS
   // -----------------------------------------------------------

   resubmit(site: ImpGeofootprintLocation) {
     debugger;
    const currentSiteType = ImpClientLocationTypeCodes.parse(site.clientLocationTypeCode);
    const newSiteType = ImpClientLocationTypeCodes.markSuccessful(currentSiteType);
    const newRequest = new ValGeocodingRequest(site, false);
    delete newRequest['latitude'];
    delete newRequest['longitude'];
    this.processEditRequests(newRequest, newSiteType, this.oldData, true);
    // console.log(this.impGeofootprintLocationService.get());
    this.appLocationService.deleteLocations([site]);
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.store$.dispatch(new CreateLocationUsageMetric('failure', 'resubmit', metricText));
  }

   public onEditLocations(data) {
     const siteType = data.siteType;
     const site = data.site;
     const oldData = data.oldData;
     this.oldData = oldData;
    const locations = this.appStateService.currentProject$.getValue().getImpGeofootprintLocations();
    if (locations.filter(loc => loc.locationNumber === site.number).length > 0 && oldData.locationNumber != site.number && siteType !== ImpClientLocationTypeCodes.Competitor){
      this.store$.dispatch(new ErrorNotification({ message: 'Site Number already exist on the project.', notificationTitle: 'Geocoding Error' }));
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    } else {
      const mktValue = site.Market != null ? `~Market=${site.Market}` : '';
      const metricsText = `Number=${site.number}~Name=${site.name}~Street=${site.street}~City=${site.city}~State=${site.state}~ZIP=${site.zip}${mktValue}`;
      this.store$.dispatch(new CreateLocationUsageMetric('single-site', 'add', metricsText));
      this.processEditRequests(site,  siteType, oldData);
      if (siteType !== ImpClientLocationTypeCodes.Competitor)     
      this.geocoderService.duplicateKeyMap.get(siteType).add(site.number);
    }
   }

   processEditRequests(siteOrSites: ValGeocodingRequest | ValGeocodingRequest[], siteType: SuccessfulLocationTypeCodes, oldData, resubmit?: boolean) {
    console.log('Processing requests:', siteOrSites);
    const sites = Array.isArray(siteOrSites) ? siteOrSites : [siteOrSites];
    const pluralize = sites.length > 1 ? 's' : '';
    this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: `Geocoding ${sites.length} ${siteType}${pluralize}` }));
    const locationCache: ImpGeofootprintLocation[] = [];
    if ((!siteOrSites['latitude'] && !siteOrSites['longitude']) || (oldData.locState != siteOrSites['state'] || oldData.locZip != siteOrSites['zip'] || oldData.locCity != siteOrSites['city'] || oldData.locAddress != siteOrSites['street'])) {
      sites[0]['latitude'] = null;
      sites[0]['longitude'] = null;
      this.appLocationService.geocode(sites, siteType).subscribe(
        locations => locationCache.push(...locations),
        err => this.handleError('Geocoding Error', 'There was an error geocoding the provided sites', err),
        () => {
          const successfulLocations = locationCache.filter(loc => !loc.clientLocationTypeCode.startsWith('Failed'));
          if (!resubmit) this.impGeofootprintLocationService.update(oldData, locationCache[0]);
          if (resubmit) this.impGeofootprintLocationService.add(locationCache);
          if (successfulLocations.length > 0) this.appLocationService.zoomToLocations(successfulLocations);
          this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
        }
      );
    } else {
      const newLocation = oldData;
      newLocation.locationNumber = siteOrSites['number'];
      newLocation.locationName = siteOrSites['name'];
      newLocation.marketName = siteOrSites['Market'];
      newLocation.marketCode = siteOrSites['Market Code'];
      if (newLocation.xcoord != siteOrSites['longitude'] || newLocation.ycoord != siteOrSites['latitude']) {
        newLocation.recordStatusCode = 'PROVIDED';
        newLocation.xcoord = Number(siteOrSites['longitude']);
        newLocation.ycoord = Number(siteOrSites['latitude']);
        // const result = new ImpGeofootprintLocation(newLocation);
        this.appLocationService.queryAllHomeGeos([newLocation], 'ZIP');

      }
      this.impGeofootprintLocationService.update(oldData, newLocation);
      this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
    }
  }
  
  private handleError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
    this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader }));
    console.error(errorMessage, errorObject);
  }

   public onDeleteLocations(event: any) {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onDeleteAllLocations fired - location: ", event.locations);
      // console.debug("event:", event);
      // console.debug("-".padEnd(80, "-"));
      this.siteListService.deleteLocations(event.locations);
      const target = 'single-' + event.selectedListType.toLowerCase();
      this.store$.dispatch(new CreateLocationUsageMetric(target, 'delete', event.metricText));
   }

   public onDeleteAllLocations(selectedListType: string) {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onDeleteAllLocations fired - selectedListType: ", selectedListType);
      // console.debug("-".padEnd(80, "-"));
      const allLocations = this.impGeofootprintLocationService.get().filter(a => a.clientLocationTypeCode === selectedListType || a.clientLocationTypeCode === `Failed ${selectedListType}`);
      this.siteListService.deleteLocations(allLocations);
      const target = selectedListType.toLowerCase() + '-list';
      this.store$.dispatch(new CreateLocationUsageMetric(target, 'delete', null, allLocations.length));
      this.appStateService.clearUserInterface();
      const siteCode = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(selectedListType));
      this.appStateService.setProvidedTradeAreas(false, siteCode );
   }

   public onMakeDirty() {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onMakeDirty");
      // console.debug("-".padEnd(80, "-"));
      this.geoAttributeService.makeDirty();
      this.impGeofootprintGeoService.makeDirty();
      this.tradeAreaService.makeDirty();
      this.impGeofootprintLocAttribService.makeDirty();
      this.impGeofootprintLocationService.makeDirty();
   }

   public onZoomToLocation(loc: ImpGeofootprintLocation) {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onZoomToLocation", loc);
      // console.debug("-".padEnd(80, "-"));
      this.esriMapService.zoomOnMap({ min: loc.xcoord, max: loc.xcoord }, { min: loc.ycoord, max: loc.ycoord }, 1);
      this.appStateService.closeOverlays();
   }
}
