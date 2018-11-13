import { ImpGeofootprintGeoAttrib } from './../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';

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
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';
import { ImpClientLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';

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
      private appStateService: AppStateService,
      private esriMapService: EsriMapService,
      private usageService: UsageService,
      private cd: ChangeDetectorRef) {}

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
   public onDeleteLocations(event: any) {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onDeleteAllLocations fired - location: ", event.locations);
      // console.debug("event:", event);
      // console.debug("-".padEnd(80, "-"));
      this.siteListService.deleteLocations(event.locations);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
                                                target: 'single-' + event.selectedListType.toLowerCase(), action: 'delete' });
      this.usageService.createCounterMetric(usageMetricName, event.metricText, null);
   }

   public onDeleteAllLocations(selectedListType: string) {
      // console.debug("-".padEnd(80, "-"));
      // console.debug("SITE LIST CONTAINER - onDeleteAllLocations fired - selectedListType: ", selectedListType);
      // console.debug("-".padEnd(80, "-"));
      const allLocations = this.impGeofootprintLocationService.get().filter(a => a.clientLocationTypeCode === selectedListType || a.clientLocationTypeCode === `Failed ${selectedListType}`);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
      target: selectedListType.toLowerCase() + '-list', action: 'delete' });
      this.siteListService.deleteLocations(allLocations);
      this.usageService.createCounterMetric(usageMetricName, null, allLocations.length);
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
