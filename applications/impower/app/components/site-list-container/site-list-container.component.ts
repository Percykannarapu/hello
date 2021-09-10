import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isEmpty, toUniversalCoordinates } from '@val/common';
import { EsriMapService } from '@val/esri';
import { ErrorNotification, StopBusyIndicator } from '@val/messaging';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { ConfirmationService } from 'primeng/api';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppEditSiteService } from '../../services/app-editsite.service';
import { AppGeocodingService } from '../../services/app-geocoding.service';
import { AppLocationService, HomeGeoQueryResult } from '../../services/app-location.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { LocalAppState } from '../../state/app.interfaces';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';

@Component({
  selector: 'val-site-list-container',
  templateUrl: './site-list-container.component.html',
  // changeDetection: ChangeDetectionStrategy.OnPush
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
      private esriMapService: EsriMapService,
      private confirmationService: ConfirmationService,
      private store$: Store<LocalAppState>,
      private appEditSiteService: AppEditSiteService,
      private domainFactory: ImpDomainFactoryService,
      private logger: LoggingService) {}

   ngOnInit() {
      // Subscribe to the data stores
      this.allLocations$  = this.impGeofootprintLocationService.storeObservable
                                .pipe(map(locs => Array.from(locs))
                                 //  ,tap(locs => {
                                 //     if (locs != null && locs.length > 0) {
                                 //       this.logger.info.log("CONTAINER OBSERVABLE FIRED: locationService - Locs:", locs);
                                 //     }})
                                     );

      this.allAttributes$ = this.impGeofootprintLocAttribService.storeObservable
                                .pipe(map(attribs => Array.from(attribs))
//                                   ,tap(data => this.logger.debug.log("CONTAINER OBSERVABLE FIRED: impGeofootprintGeoAttribService", data))
                                     );

      this.allGeos$ = this.impGeofootprintGeoService.storeObservable
                          .pipe(map(geos => Array.from(geos))
//                             ,tap(geos => this.logger.debug.log("SITE-LIST-CONTAINER - allGeos$ fired", geos))
                               );

   }


   // -----------------------------------------------------------
   // GRID OUTPUT EVENTS
   // -----------------------------------------------------------

   public onEditLocations(data) {
     const siteType = data.siteType;
     const site = data.site;
     const oldData = data.oldData;
     this.oldData = oldData;
    const locations = this.appStateService.currentProject$.getValue().getImpGeofootprintLocations();
    if (locations.filter(loc => loc.locationNumber === site.number).length > 0 && oldData.locationNumber != site.number && siteType !== ImpClientLocationTypeCodes.Competitor){
      this.store$.dispatch(ErrorNotification({ message: 'Site Number already exist on the project.', notificationTitle: 'Geocoding Error' }));
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

   private processEditRequests(siteOrSites: ValGeocodingRequest, siteType: SuccessfulLocationTypeCodes, oldData) {
    const newLocation: ValGeocodingRequest = oldData;
    const attrbs: ImpGeofootprintLocAttrib[] = oldData.impGeofootprintLocAttribs;
    const ifAddressChanged: boolean = (oldData.locState != siteOrSites['state'] || oldData.locZip != siteOrSites['zip'] || oldData.locCity != siteOrSites['city'] || oldData.locAddress != siteOrSites['street']);
    const ifLatLongChanged: boolean = newLocation.xcoord != siteOrSites['longitude'] || newLocation.ycoord != siteOrSites['latitude'];
    const homeZipFlag: boolean = attrbs.filter(la => la.attributeCode === 'Home Zip Code').length > 0
      ? attrbs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue != siteOrSites['Home Zip Code']
      : !isEmpty(siteOrSites['Home Zip Code']);
    const homeAtzFlag: boolean = attrbs.filter(la => la.attributeCode === 'Home ATZ').length > 0
      ? attrbs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue != siteOrSites['Home ATZ']
      : !isEmpty(siteOrSites['Home ATZ']);
    const homeDigitalAtzFlag: boolean = attrbs.filter(la => la.attributeCode === 'Home Digital ATZ').length > 0
      ? attrbs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue != siteOrSites['Home Digital ATZ']
      : !isEmpty(siteOrSites['Home Digital ATZ']);
    const homeCarrierRouteFlag: boolean = attrbs.filter(la => la.attributeCode === 'Home Carrier Route').length > 0
      ? attrbs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue != siteOrSites['Home Carrier Route']
      : !isEmpty(siteOrSites['Home Carrier Route']);
    const anyChangeInHomeGeoFields: boolean = homeZipFlag || homeAtzFlag || homeDigitalAtzFlag || homeCarrierRouteFlag;
    const editedLocation: ImpGeofootprintLocation = oldData;
    editedLocation.locationNumber = siteOrSites['number'];
    editedLocation.locationName = siteOrSites['name'];
    editedLocation.marketName = siteOrSites['Market'];
    editedLocation.marketCode = siteOrSites['Market Code'];
    this.impGeofootprintLocationService.update(oldData, editedLocation);

    // this radius editing stuff has a bit of work to go before it's ready for use
    // let ifRadiusChanged: boolean = false;
    // if (newLocation.impGeofootprintTradeAreas !== null && newLocation.impGeofootprintTradeAreas.length > 0) {
    //   const newRadius: number[] = [siteOrSites.RADIUS1, siteOrSites.RADIUS2, siteOrSites.RADIUS3];
    //   editedLocation.radius1 = newRadius[0];
    //   editedLocation.radius2 = newRadius[1];
    //   editedLocation.radius3 = newRadius[2];
    //   for (let i = 0; i < newLocation.impGeofootprintTradeAreas.length; i++) {
    //      const index = editedLocation.impGeofootprintTradeAreas[i].taNumber - 1;
    //      if (editedLocation.impGeofootprintTradeAreas[i].taType === 'RADIUS' &&
    //          editedLocation.impGeofootprintTradeAreas[i].taRadius !== newRadius[index]) {
    //         ifRadiusChanged = true;
    //         editedLocation.impGeofootprintTradeAreas[i].taRadius = newRadius[index];
    //      }
    //   }
    //   if (ifRadiusChanged)
    //   {
    //      const tradeAreaModels = editedLocation.impGeofootprintTradeAreas.filter(ta => ta.taRadius != null);
    //      const transformedAreas = tradeAreaModels.map(ta => ({ radius: Number(ta.taRadius), selected: ta.isActive, taNumber: ta.taNumber }));
    //      this.appTradeAreaService.deleteTradeAreas(editedLocation.impGeofootprintTradeAreas);
    //      this.appTradeAreaService.applyRadiusTradeAreasToLocations(transformedAreas, [editedLocation]);
    //   }
    // }

    if ((ifAddressChanged || ifLatLongChanged) && anyChangeInHomeGeoFields) {
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
    } else if (!ifAddressChanged && !ifLatLongChanged && anyChangeInHomeGeoFields) {
      const attributeList: HomeGeoQueryResult[] = [{
        homeAtz: siteOrSites['Home ATZ'],
        homeDigitalAtz: siteOrSites['Home Digital ATZ'],
        homePcr: siteOrSites['Home Carrier Route'],
        homeZip: siteOrSites['Home Zip Code'],
        homeDma: siteOrSites['Home DMA'],
        homeCounty: siteOrSites['Home County'],
        homeDmaName: siteOrSites['Home DMA Name'],
        siteNumber: siteOrSites.number,
        abZip: editedLocation.locZip.substring(0, 5)
      }];
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
        'dtz': 'homeDigitalAtz'
      };
      if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code').length > 0) {
         if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue !== attributeList[0].homeZip
            || editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue !== '') {
            editedTags.push('zip');
         }
      } else if (attributeList[0].homeZip !== '' && homeZipFlag) {
         this.domainFactory.createLocationAttribute(editedLocation, 'Home Zip Code', attributeList[0].homeZip);
      }
      if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ').length > 0) {
         if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue !== attributeList[0].homeAtz
            || editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue !== '') {
            editedTags.push('atz');
         }
      } else if (attributeList[0].homeAtz !== '' && homeAtzFlag) {
         this.domainFactory.createLocationAttribute(editedLocation, 'Home ATZ', attributeList[0].homeAtz);
      }
      if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route').length > 0) {
         if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue !== attributeList[0].homePcr
            || editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue !== '') {
            editedTags.push('pcr');
         }
      } else if (attributeList[0].homePcr !== '' && homeCarrierRouteFlag) {
         this.domainFactory.createLocationAttribute(editedLocation, 'Home Carrier Route', attributeList[0].homePcr);
      }
      if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ').length > 0) {
         if (editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue !== attributeList[0].homeDigitalAtz
            || editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue !== '') {
            editedTags.push('dtz');
         }
      } else if (attributeList[0].homeDigitalAtz !== '' && homeDigitalAtzFlag) {
         this.domainFactory.createLocationAttribute(editedLocation, 'Home Digital ATZ', attributeList[0].homeDigitalAtz);
      }
      editedTags.forEach(tag => {
        editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[tag])[0].attributeValue = attributeList[0][tagToFieldName[tag]];
      });
      if (analysisLevel != null) {
         //  const attrValue = editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[analysisLevel.toLowerCase()])[0].attributeValue;
         const attr = editedLocation.impGeofootprintLocAttribs.filter(la => la.attributeCode === tagToField[analysisLevel.toLowerCase()]);
          editedLocation.homeGeocode = attr.length > 0 ? attr[0].attributeValue : '';
      }
      this.impGeofootprintLocationService.update(oldData, editedLocation);
      this.appLocationService.processHomeGeoAttributes(attributeList, this.impGeofootprintLocationService.get().filter(l => l.locationNumber === oldData.locationNumber));
      // this.store$.dispatch(new ValidateEditedHomeGeoAttributes({oldData, siteOrSites, siteType, editedTags, attributeList}));
    } else {
      if ((!siteOrSites['latitude'] && !siteOrSites['longitude']) || ifAddressChanged) {
          siteOrSites['latitude'] = null;
          siteOrSites['longitude'] = null;
          this.logger.info.log('geocodeAndHomeGeocode will fire');
          this.geocodeAndHomegeocode(oldData, siteOrSites, siteType);
      } else if (ifLatLongChanged) {
          this.geocodeAndHomegeocode(oldData, siteOrSites, siteType);
          this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      } /*else {
        const editedLocation: ImpGeofootprintLocation = oldData;
        editedLocation.locationNumber = siteOrSites['number'];
        editedLocation.locationName = siteOrSites['name'];
        editedLocation.marketName = siteOrSites['Market'];
        editedLocation.marketCode = siteOrSites['Market Code'];
        this.impGeofootprintLocationService.update(oldData, editedLocation);
      }*/
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
    const customTradeAreaCheck = this.tradeAreaService.get().filter(ta => ta.taType === 'CUSTOM');
    let dataBuffer: string = '';
    if (customTradeAreaCheck != null && customTradeAreaCheck.length > 0) {
         const customTradeAreaGeos = (matchingLocation[0].impGeofootprintTradeAreas[0].impGeofootprintGeos);
         const locationNumber = matchingLocation[0].locationNumber;
         this.logger.info.log(customTradeAreaGeos);
         dataBuffer = 'Store,Geo';
         for (let i = 0; i < customTradeAreaGeos.length; i++) {
           dataBuffer = dataBuffer + '\n' + locationNumber + ',' + customTradeAreaGeos[i].geocode;
         }
         this.appEditSiteService.sendCustomData({'data': dataBuffer});
     }
     this.siteListService.deleteLocations(matchingLocation);
  }

  public onToggleLocations(event: any) {
     //this.logger.info.log('### site-list-container.onToggleLocations - event:', event);
     this.siteListService.setLocationsActive(event.sites, event.isActive);
  }

   public onDeleteLocations(event: any) {
      // this.logger.debug.log("-".padEnd(80, "-"));
      // this.logger.debug.log("SITE LIST CONTAINER - onDeleteAllLocations fired - location: ", event.locations);
      // this.logger.debug.log("event:", event);
      // this.logger.debug.log("-".padEnd(80, "-"));
      this.siteListService.deleteLocations(event.locations);
      const target = 'single-' + event.selectedListType.toLowerCase();
      this.store$.dispatch(new CreateLocationUsageMetric(target, 'delete', event.metricText));
   }

   public onDeleteAllLocations(selectedListType: string) {
      // this.logger.debug.log("-".padEnd(80, "-"));
      // this.logger.debug.log("SITE LIST CONTAINER - onDeleteAllLocations fired - selectedListType: ", selectedListType);
      // this.logger.debug.log("-".padEnd(80, "-"));
      const allLocations = this.impGeofootprintLocationService.get().filter(a => a.clientLocationTypeCode === selectedListType || a.clientLocationTypeCode === `Failed ${selectedListType}`);
      this.siteListService.deleteLocations(allLocations);
      const target = selectedListType.toLowerCase() + '-list';
      this.store$.dispatch(new CreateLocationUsageMetric(target, 'delete', null, allLocations.length));
      this.appStateService.clearUserInterface();
      const siteCode = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(selectedListType));
      this.appStateService.setProvidedTradeAreas(false, siteCode );
   }

   public onMakeDirty() {
      // this.logger.debug.log("-".padEnd(80, "-"));
      // this.logger.debug.log("SITE LIST CONTAINER - onMakeDirty");
      // this.logger.debug.log("-".padEnd(80, "-"));
      this.impGeofootprintGeoService.makeDirty();
      this.tradeAreaService.makeDirty();
      this.impGeofootprintLocAttribService.makeDirty();
      this.impGeofootprintLocationService.makeDirty();
   }

   public onZoomToLocation(loc: ImpGeofootprintLocation) {
      this.esriMapService.zoomToPoints(toUniversalCoordinates([loc])).pipe(take(1)).subscribe();
      this.appStateService.closeOverlays();
   }
}
