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
import { AppStateService } from '../../services/app-state.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { LocalAppState } from '../../state/app.interfaces';
import { Store } from '@ngrx/store';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { ErrorNotification, StopBusyIndicator } from '@val/messaging';
import { EsriMapService } from '@val/esri';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { AppEditSiteService } from '../../services/app-editsite.service';
import { ConfirmationService } from 'primeng/api';

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
      private appLocationService: AppLocationService,
      private geocoderService: AppGeocodingService,
      private appStateService: AppStateService,
      private appTradeAreaService: AppTradeAreaService,
      private audienceTradeAreaService: ValAudienceTradeareaService,
      private esriMapService: EsriMapService,
      private confirmationService: ConfirmationService,
      private store$: Store<LocalAppState>,
      private appEditSiteService: AppEditSiteService) {}

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

   }


   // -----------------------------------------------------------
   // GRID OUTPUT EVENTS
   // -----------------------------------------------------------

  resubmit(site: ImpGeofootprintLocation) {
    const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home Digital ATZ']);
    site.impGeofootprintLocAttribs.forEach(attr => {
      if (homeGeoColumnsSet.has(attr.attributeCode)){
        attr.attributeValue = '';
      }
    });
    const currentSiteType = ImpClientLocationTypeCodes.parse(site.clientLocationTypeCode);
    const newSiteType = ImpClientLocationTypeCodes.markSuccessful(currentSiteType);
    let isRadii: boolean = false;
    if (site.radius1 != null || site.radius2 != null || site.radius3 != null){
      isRadii = true;
    }
    const newRequest = new ValGeocodingRequest(site, true, isRadii);
    newRequest['resubmit'] = true;
    newRequest['Original Address'] = site.locAddress;
    newRequest['Original City'] = site.locCity;
    newRequest['Original State'] = site.locState;
    newRequest['Original ZIP'] = site.locZip;
    delete newRequest['latitude'];
    delete newRequest['longitude'];
    this.processEditRequests(newRequest, newSiteType, site, true);
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

   private processEditRequests(siteOrSites: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, oldData, resubmit?: boolean) {
    //console.log('Processing requests:', siteOrSites);
    const newLocation: ValGeocodingRequest = oldData;
    const ifAddressChanged: boolean = (oldData.locState != siteOrSites['state'] || oldData.locZip != siteOrSites['zip'] || oldData.locCity != siteOrSites['city'] || oldData.locAddress != siteOrSites['street']);
    const ifLatLongChanged: boolean = newLocation.xcoord != siteOrSites['longitude'] || newLocation.ycoord != siteOrSites['latitude'];
    const anyChangeinHomeGeoFields: boolean = (oldData.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue != siteOrSites['Home Zip Code']) ||
    (oldData.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue != siteOrSites['Home ATZ']) ||
    (oldData.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue != siteOrSites['Home Digital ATZ']) ||
    (oldData.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue != siteOrSites['Home Carrier Route']);
    if ((ifAddressChanged || ifLatLongChanged) && anyChangeinHomeGeoFields) {
      this.confirmationService.confirm({
        message: 'Geocoding and/or Home Geocoding is required and will override any changes made to the Home Geocode fields.',
        header: 'Edit Warning',
        acceptLabel: 'OK',
        accept: () => {
          siteOrSites['Home Zip Code'] = null;
          siteOrSites['Home ATZ'] = null;
          siteOrSites['Home Carrier Route'] = null;
          siteOrSites['Home Digital ATZ'] = null;
          this.geocodeAndHomegeocode(oldData, siteOrSites, siteType);
        }
      });
    } else if (!ifAddressChanged && !ifLatLongChanged && anyChangeinHomeGeoFields) {
      const editedLocation = this.impGeofootprintLocationService.get().filter(l => l.locationNumber === oldData.locationNumber);
      const attributeList = [{'homeAtz': siteOrSites['Home ATZ'],
      'homeDtz': siteOrSites['Home Digital ATZ'],
      'homePcr': siteOrSites['Home Carrier Route'],
      'homeZip': siteOrSites['Home Zip Code'],
      'siteNumber': siteOrSites.number,
      'geocoderZip': editedLocation[0].locZip.substring(0, 5),
      'abZip': editedLocation[0].locZip.substring(0, 5)}];
      const analysisLevel: string = this.appStateService.analysisLevel$.getValue();
      const editedTags: string[] = [];
      const tagToField = {
        'zip': 'Home Zip Code',
        'atz': 'Home ATZ',
        'pcr': 'Home Carrier Route',
        'dtz': 'Home Digital ATZ'
      };
      const tagToFieldName = {
        'zip': 'homeZip',
        'atz': 'homeAtz',
        'pcr': 'homePcr',
        'dtz': 'homeDtz'
      };
      if (editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue !== attributeList[0].homeZip
          || editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue !== '') {
        editedTags.push('zip');
      }
      if (editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue !== attributeList[0].homeAtz
          || editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue !== '') {
        editedTags.push('atz');
      }
      if (editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue !== attributeList[0].homePcr
          || editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue !== '') {
        editedTags.push('pcr');
      }
      if (editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue !== attributeList[0].homeDtz
          || editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue !== '') {
        editedTags.push('dtz');
      }
      editedTags.forEach(tag => {
        editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[tag])[0].attributeValue = attributeList[0][tagToFieldName[tag]];
      });
      if (analysisLevel != null) {
          editedLocation[0].homeGeocode = editedLocation[0].impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[analysisLevel.toLowerCase()])[0].attributeValue;
      }
      this.impGeofootprintLocationService.update(oldData, editedLocation[0]);
      this.appLocationService.processHomeGeoAttributes(attributeList, this.impGeofootprintLocationService.get().filter(l => l.locationNumber === oldData.locationNumber));
      // this.store$.dispatch(new ValidateEditedHomeGeoAttributes({oldData, siteOrSites, siteType, editedTags, attributeList}));
    }
    else {
      if ((!siteOrSites['latitude'] && !siteOrSites['longitude']) || ifAddressChanged) { 
          siteOrSites['latitude'] = null;
          siteOrSites['longitude'] = null;
          this.geocodeAndHomegeocode(oldData, siteOrSites, siteType);
      } else if (ifLatLongChanged) {
          this.geocodeAndHomegeocode(oldData, siteOrSites, siteType);
          this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      } else {
        const editedLocation: ImpGeofootprintLocation = oldData;
        editedLocation.locationNumber = siteOrSites['number'];
        editedLocation.locationName = siteOrSites['name'];
        editedLocation.marketName = siteOrSites['Market'];
        editedLocation.marketCode = siteOrSites['Market Code'];
        this.impGeofootprintLocationService.update(oldData, editedLocation);
      }
    }
  }

  private geocodeAndHomegeocode(oldData: ImpGeofootprintLocation, siteOrSites: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes) : void {
        delete siteOrSites['Home Zip Code'];
        delete siteOrSites['Home ATZ'];
        delete siteOrSites['Home Carrier Route'];
        delete siteOrSites['Home Digital ATZ'];
        if (oldData != null){
          this.handleCustomTradeAreaIfExistAndEdit(oldData);
          this.appEditSiteService.sendEditLocationData({'siteData': siteOrSites, 'type': siteType, 'isEdit': true});
        }
  }

  private handleCustomTradeAreaIfExistAndEdit(oldData: ImpGeofootprintLocation) : void {
    const matchingLocation = this.impGeofootprintLocationService.get().filter(l => l.locationNumber == oldData.locationNumber);
    const customTradeAreaCheck = this.tradeAreaService.get().filter(ta => ta.taType === 'CUSTOM').length;
    let databuffer: string = '';
    if ( customTradeAreaCheck != undefined && customTradeAreaCheck != null && customTradeAreaCheck > 0) {
         const customTradeAreaGeos = (matchingLocation[0].impGeofootprintTradeAreas[0].impGeofootprintGeos);
         const locationNumber = matchingLocation[0].locationNumber;
         console.log(customTradeAreaGeos);
         databuffer = 'Store,Geo';
         for (let i = 0; i < customTradeAreaGeos.length; i++) {
           databuffer = databuffer + '\n' + locationNumber + ',' + customTradeAreaGeos[i].geocode;
         }
         this.appEditSiteService.sendCustomData({'data': databuffer});
     }
     this.siteListService.deleteLocations(matchingLocation);
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
