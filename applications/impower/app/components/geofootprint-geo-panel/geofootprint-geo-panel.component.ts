import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { toUniversalCoordinates } from '@val/common';
import { EsriMapService } from '@val/esri';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { selectGeoAttributeEntities } from 'app/impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import * as fromTransientSelectors from 'app/impower-datastore/state/transient/transient.reducer';
import { GridGeoVar } from 'app/impower-datastore/state/transient/transient.reducer';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { GeoAttribute } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { AppGeoService } from '../../services/app-geo.service';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpProjectVarService } from '../../val-modules/targeting/services/ImpProjectVar.service';

export interface FlatGeo {
   fgId: number;
   geo: ImpGeofootprintGeo;
}

@Component({
  selector: 'val-geofootprint-geo-panel',
  templateUrl: './geofootprint-geo-panel.component.html',
  styleUrls: ['./geofootprint-geo-panel.component.css']
})
export class GeofootprintGeoPanelComponent implements OnInit {
   // Data store observables
   public  nonNullProject$: Observable<ImpProject>;
   public  gridAudiences$: Observable<Audience[]>;
   public  allProjectVars$: Observable<ImpProjectVar[]>;
   public  allLocations$: Observable<ImpGeofootprintLocation[]>;
   public  allGeos$: Observable<ImpGeofootprintGeo[]>;
   public  allMustCovers$: Observable<string[]>;
   public  allAttributes$: Observable<{ [geocode: string] : GeoAttribute }>;
   public  allVars$: Observable<GridGeoVar>;

   private gridAudiencesBS$ = new BehaviorSubject<Audience[]>([]);

   public  allImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  displayedImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

   // Observables for unique values to filter on in the grid
   public  uniqueCity$: Observable<SelectItem[]>;
   public  uniqueState$: Observable<SelectItem[]>;
   public  uniqueMarket$: Observable<SelectItem[]>;
   public  uniqueOwnerGroup$: Observable<SelectItem[]>;
   public  uniqueCoverageDesc$: Observable<SelectItem[]>;
   public  uniqueDma$: Observable<SelectItem[]>;

   // Target Audience Variable Column Order
   public  variableColOrder: Map<string, number> = new Map<string, number>();

   // Miscellaneous variables
   public  numGeosActive: number = 0;
   public  numGeosInactive: number = 0;
   public  dedupeGrid: boolean = false;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private impProjectVarService: ImpProjectVarService,
               private impGeofootprintGeoService: ImpGeofootprintGeoService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               private appStateService: AppStateService,
               private esriMapService: EsriMapService,
               private confirmationService: ConfirmationService,
               private appGeoService: AppGeoService,
               private store$: Store<FullAppState>,
               private logger: LoggingService
               ) { }

   ngOnInit() {
      // Subscribe to the data stores
      this.nonNullProject$ = this.appStateService.currentProject$
                                 .pipe(filter(project => project != null),
                                       map(project => Object.create(project))
                                      //,tap(data => { this.logger.debug.log("OBSERVABLE FIRED: appStateService"); })
                                      );

      this.allProjectVars$ = this.impProjectVarService.storeObservable
                                 .pipe(map(pvars => Array.from(pvars)),
                                       tap(pvars => {
                                      // this.logger.debug.log("OBSERVABLE FIRED: allProjectVars");
                                         // PB COL_ORDER this.setVariableOrderFromProjectVars(pvars);
                                      }));

      this.allLocations$  = this.impGeofootprintLocationService.storeObservable
                                .pipe(map(locs => Array.from(locs)),
                                      tap(locs => {
                                        if (locs != null && locs.length > 0) {
                                       // this.logger.debug.log("OBSERVABLE FIRED: impGeofootprintLocationService - Locs:", locs);
                                          this.rankGeographies();
                                        }
                                      }));

      this.allGeos$ = this.impGeofootprintGeoService.storeObservable
                          .pipe(map(geos => Array.from(geos.filter(geo => geo.impGeofootprintTradeArea.isActive && geo.impGeofootprintLocation.isActive))),
                                tap(geos => {
                                  if (geos != null && geos.length > 0) {
                                  // this.logger.debug.log("OBSERVABLE FIRED: impGeofootprintGeoService - " + geos.length + " Geos: ", geos);
                                  // PB COL_ORDER this.setVariableOrder();
                                     this.rankGeographies();
                                     // TODO: When geos are in redux, trigger this when geo creation is complete
                                     // this.targetAudienceService.applyAudienceSelection();
                                  }
                                }));

      // The geo grid watches this for changes in must covers to set the column
      this.allMustCovers$ = this.impGeofootprintGeoService.allMustCoverBS$.asObservable();

      this.allAttributes$ = this.store$.pipe(select(selectGeoAttributeEntities));

      // Subscribe to store selectors
      this.store$.select(fromAudienceSelectors.getAudiencesInGrid).subscribe(this.gridAudiencesBS$);
      this.gridAudiences$ = this.store$.select(fromAudienceSelectors.getAudiencesInGrid);

      this.allVars$ = this.store$.pipe(select(fromTransientSelectors.selectGridGeoVars));
    }

   public rankGeographies() {
      // Rank the geos by distance
      this.impGeofootprintGeoService.calculateGeoRanks();

      // Sort the geos
      this.impGeofootprintGeoService.sort(this.impGeofootprintGeoService.defaultSort);

      // DEBUG: See that ranking is working
      //this.logger.debug.log("Rank > 0 Geos:"); this.impGeofootprintGeoService.get().filter(geo => geo.rank > 0).forEach(geo => this.logger.debug.log("geo: ", geo));
   }

   // -----------------------------------------------------------
   // GEO GRID OUTPUT EVENTS
   // -----------------------------------------------------------
   public onZoomGeo(geo: ImpGeofootprintGeo) {
      if (geo != null) {
         this.esriMapService.zoomToPoints(toUniversalCoordinates([geo])).subscribe();
      }
   }

   public onDeleteGeo(geo: ImpGeofootprintGeo) {
      if (geo != null)
      {
         this.confirmationService.confirm({
            message: 'Do you want to delete geocode: ' + geo.geocode + '?',
            header: 'Delete Geography Confirmation',
            icon: 'pi pi-trash',
            accept: () => {
               //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
               //                                         target: 'single-' + this.selectedListType.toLowerCase(), action: 'delete' });
               // this.usageService.createCounterMetric(usageMetricName, metricText, 1);
               this.appGeoService.deleteGeos([geo]);
               this.logger.debug.log('remove successful');
            },
            reject: () => {
               this.logger.debug.log('cancelled remove');
            }
          });
      }
   }

   public onSelectGeo({geo, isSelected}) {
      if (geo.isActive !== isSelected)
      {
         const commonGeos = this.impGeofootprintGeoService.get().filter(g => g.geocode === geo.geocode);
         const includesHomeGeo = commonGeos.some(g => g.impGeofootprintLocation != null && g.impGeofootprintLocation.homeGeocode === g.geocode);
         if (includesHomeGeo && this.impGeofootprintGeoService.mustCovers != null && this.impGeofootprintGeoService.mustCovers.length > 0 && this.impGeofootprintGeoService.mustCovers.includes(geo.geocode) && geo.isActive )
         {
         this.appGeoService.confirmMustCover(geo, isSelected, true);
         }
         else if (this.impGeofootprintGeoService.mustCovers != null && this.impGeofootprintGeoService.mustCovers.length > 0 && this.impGeofootprintGeoService.mustCovers.includes(geo.geocode) && geo.isActive )
         {
          this.appGeoService.confirmMustCover(geo, isSelected, false);
         }
         else if (includesHomeGeo && geo.isActive) {
          this.confirmationService.confirm({
             message: 'You are about to deselect a Home Geo for at least one of the sites.',
             header: 'Home Geo selection',
             acceptLabel: 'Continue',
             rejectLabel: 'Cancel',
             accept: () => {
                   commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
                   setTimeout(() => {
                     this.impGeofootprintGeoService.makeDirty();
                   }, 0);
                   setTimeout(() => {
                     this.impGeofootprintGeoService.makeDirty();
                   }, 0);
             },
             reject: () => {
                    geo.isActive = true;
                    setTimeout(() => {
                       this.impGeofootprintGeoService.makeDirty();
                    }, 0);
                    setTimeout(() => {
                      this.impGeofootprintGeoService.makeDirty();
                    }, 0);
             }
          });
      }
         else {
           commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
           setTimeout(() => {
             this.impGeofootprintGeoService.makeDirty();
           }, 0);
           setTimeout(() => {
             this.impGeofootprintGeoService.makeDirty();
           }, 0);
         }

         const currentProject = this.appStateService.currentProject$.getValue();
         const cpm = currentProject.estimatedBlendedCpm != null ? currentProject.estimatedBlendedCpm : 0;
         const amount: number = geo.hhc * cpm / 1000;
         const metricText = `${geo.geocode}~${geo.hhc}~${cpm}~${amount}~ui=geoGridCheckbox`;
         if (geo.isActive){
             this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'selected', metricText));
         }
         else{
           this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'deselected', metricText));
         }
      }
   }

   public onDedupeToggle(event: any) {
      // This is just to cause createComposite to fire and rebuild the grid
      this.variableColOrder = Object.create(this.variableColOrder);
   }

   public onSetAllGeos(event: any) {
      if (event != null)
      {
         const eventGeos: ImpGeofootprintGeo[] = event.geos;
         this.impGeofootprintGeoService.get().forEach(geo => geo.isActive = event.value);
         this.impGeofootprintGeoService.makeDirty();
      }
   }

   public onSetFilteredGeos(event: any) {
      if (event != null)
      {
         const eventGeos: ImpGeofootprintGeo[] = event.geos;
         this.impGeofootprintGeoService.get().filter(geo => eventGeos.includes(geo)).forEach(geo => { geo.isActive = event.value; this.logger.debug.log('set geo: ' + geo.geocode + ' isActive = ' + geo.isActive); });
         this.impGeofootprintGeoService.makeDirty();
      }
   }

   public onForceRedraw() {
      this.impGeofootprintGeoService.makeDirty();
   }

  public triggerCollapseOnToggle(collapsed: boolean) {
    this.appStateService.triggerChangeInCollapse(collapsed);
  }
}
