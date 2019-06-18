import { GeoVar } from './../../impower-datastore/state/transient/geo-vars/geo-vars.model';
import { GeoAttribute } from '../../impower-datastore/state/geo-attributes/geo-attributes.model';
import { selectGeoAttributeEntities } from '../../impower-datastore/state/impower-datastore.selectors';
import { ImpProjectVarService } from '../../val-modules/targeting/services/ImpProjectVar.service';
import { Component, OnInit } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { SelectItem } from 'primeng/components/common/selectitem';
import { AppStateService } from '../../services/app-state.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintVarService } from '../../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintVar } from '../../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { TargetAudienceService } from '../../services/target-audience.service';
import { ConfirmationService } from 'primeng/primeng';
import { select, Store } from '@ngrx/store';
import { FullAppState } from '../../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../../state/usage/targeting-usage.actions';
import { EsriMapService } from '@val/esri';
import { AppGeoService } from '../../services/app-geo.service';
import { GridGeoVar } from 'app/impower-datastore/state/transient/transient.reducer';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromTransientSelectors from 'app/impower-datastore/state/transient/transient.reducer';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

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
   //public  allVars$: Observable<{ [geocode: string] : GeoVar }>;
   public  allVars$: Observable<GridGeoVar>;
   //public  allVars$: Observable<ImpGeofootprintVar[]>;

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
               private impGeofootprintVarService: ImpGeofootprintVarService,
               private appStateService: AppStateService,
               private targetAudienceService: TargetAudienceService,
               private esriMapService: EsriMapService,
               private confirmationService: ConfirmationService,
               private appGeoService: AppGeoService,
               private store$: Store<FullAppState>
               ) { }

   ngOnInit() {
      // Subscribe to the data stores
      this.nonNullProject$ = this.appStateService.currentProject$
                                 .pipe(filter(project => project != null),
                                       map(project => Object.create(project))
                                      //,tap(data => { console.log("OBSERVABLE FIRED: appStateService"); })
                                      );

      this.allProjectVars$ = this.impProjectVarService.storeObservable
                                 .pipe(map(pvars => Array.from(pvars)),
                                       tap(pvars => {
                                      // console.log("OBSERVABLE FIRED: allProjectVars");
                                         // PB COL_ORDER this.setVariableOrderFromProjectVars(pvars);
                                      }));

      this.allLocations$  = this.impGeofootprintLocationService.storeObservable
                                .pipe(map(locs => Array.from(locs)),
                                      tap(locs => {
                                        if (locs != null && locs.length > 0) {
                                       // console.log("OBSERVABLE FIRED: impGeofootprintLocationService - Locs:", locs);
                                          this.rankGeographies();
                                        }
                                      }));

      this.allGeos$ = this.impGeofootprintGeoService.storeObservable
                          .pipe(map(geos => Array.from(geos)),
                                tap(geos => {
                                  if (geos != null && geos.length > 0) {
                                  // console.log("OBSERVABLE FIRED: impGeofootprintGeoService - " + geos.length + " Geos: ", geos);
                                  // PB COL_ORDER this.setVariableOrder();
                                     this.rankGeographies();
                                     // TODO: When geos are in redux, trigger this when geo creation is complete
                                     // this.targetAudienceService.applyAudienceSelection();
                                  }
                                }));

      // The geo grid watches this for changes in must covers to set the column
      this.allMustCovers$ = this.impGeofootprintGeoService.allMustCoverBS$.asObservable();

      this.allAttributes$ = this.store$.pipe(select(selectGeoAttributeEntities));

      // this.allVars$ = this.impGeofootprintVarService.storeObservable
      //                     .pipe(map(vars => Array.from(vars))
      //                       // ,tap(data => console.log("OBSERVABLE FIRED: impGeofootprintVarService", data))
      //                          );

      // Subscribe to store selectors
      this.store$.select(fromAudienceSelectors.getAudiencesInGrid).subscribe(this.gridAudiencesBS$);
      this.gridAudiences$ = this.store$.select(fromAudienceSelectors.getAudiencesInGrid);

      this.allVars$ = this.store$.pipe(select(fromTransientSelectors.selectGridGeoVars));
    //this.allVars$ = this.store$.pipe(select(fromGeoVarSelectors.allGeoVars));
    }

   public rankGeographies() {
      // Rank the geos by distance
      this.impGeofootprintGeoService.calculateGeoRanks();

      // Sort the geos
      this.impGeofootprintGeoService.sort(this.impGeofootprintGeoService.defaultSort);

      // DEBUG: See that ranking is working
      //console.log("Rank > 0 Geos:"); this.impGeofootprintGeoService.get().filter(geo => geo.rank > 0).forEach(geo => console.log("geo: ", geo));
   }

  /* PB COL_ORDER
   public setVariableOrderFromProjectVars(projectVars: ImpProjectVar[]) {
      let varName: string = null;

      if (projectVars != null) {
         const newVariableColOrder: Map<string, number> = new Map<string, number>();

         // Build the map, massaging the variable names
         projectVars.forEach (pvar => {
            switch (pvar.source) {
               case 'Online_Interest':
                  varName = pvar.fieldname + ' (Interest)';
                  break;

               case 'Online_VLH':
                  varName = pvar.fieldname + ' (VLH)';
                  break;

               case 'Online_Pixel':
                  varName = pvar.fieldname + ' (Pixel)';
                  break;

               case 'Online_In-Market':
                  varName = pvar.fieldname + ' (In-Market)';
                  break;

               default:
                  varName = pvar.fieldname;
                  break;
            }
            // console.log("### 1 - settingVariableOrder for varName: " + varName + " to " + pvar.sortOrder);
            newVariableColOrder.set(varName, pvar.sortOrder);
         });

         // Set the final map as a whole
         this.variableColOrder = newVariableColOrder;
         console.log('newVariableColOrder =', newVariableColOrder);
      }
   }

   public setVariableOrder() {
      if (this.targetAudienceService.getAudiences().length > 0)
      {
         this.variableColOrder = new Map<string, number>();

         for (const audience of this.targetAudienceService.getAudiences()) {
            if (audience.audienceSourceType === 'Online') {
               if (audience.audienceSourceName === 'Interest') {
                  this.variableColOrder.set(audience.audienceName + ' (Interest)', audience.audienceCounter);
               } else if (audience.audienceSourceName === 'VLH') {
                  this.variableColOrder.set(audience.audienceName + ' (VLH)', audience.audienceCounter);
               } else if (audience.audienceSourceName === 'Pixel') {
                  this.variableColOrder.set(audience.audienceName + ' (Pixel)', audience.audienceCounter);
               } else if (audience.audienceSourceName === 'Audience-TA') {
                  this.variableColOrder.set(audience.secondaryId, audience.audienceCounter);
               } else {
                  this.variableColOrder.set(audience.audienceName + ' (In-Market)', audience.audienceCounter);
               }
            } else {
               this.variableColOrder.set(audience.audienceName, audience.audienceCounter);
            }
         }
         console.log('variableColOrder =', this.variableColOrder);
      }
   }*/

   // -----------------------------------------------------------
   // GEO GRID OUTPUT EVENTS
   // -----------------------------------------------------------
   public onZoomGeo(geo: ImpGeofootprintGeo) {
      if (geo != null) {
         this.esriMapService.zoomOnMap({ min: geo.xcoord, max: geo.xcoord }, { min: geo.ycoord, max: geo.ycoord }, 1);
      }
   }

   public onDeleteGeo(geo: ImpGeofootprintGeo) {
      if (geo != null)
      {
         this.confirmationService.confirm({
            message: 'Do you want to delete geocode: ' + geo.geocode + '?',
            header: 'Delete Geography Confirmation',
            icon: 'ui-icon-trash',
            accept: () => {
               //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
               //                                         target: 'single-' + this.selectedListType.toLowerCase(), action: 'delete' });
               // this.usageService.createCounterMetric(usageMetricName, metricText, 1);
               this.impGeofootprintGeoService.addDbRemove(geo);
               this.impGeofootprintGeoService.remove(geo);
               console.log('remove successful');
            },
            reject: () => {
               console.log('cancelled remove');
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
      // console.log("-".padEnd(80, "-"));
      // console.log("onSetAllGeos - event: ", event);
      // console.log("-".padEnd(80, "-"));
      if (event != null)
      {
         const eventGeos: ImpGeofootprintGeo[] = event.geos;
         this.impGeofootprintGeoService.get().forEach(geo => geo.isActive = event.value);
         this.impGeofootprintGeoService.makeDirty();
      }
   }

   public onSetFilteredGeos(event: any) {
      // console.log("-".padEnd(80, "-"));
      // console.log("onSetFilteredGeos - event: ", event);
      // console.log("-".padEnd(80, "-"));
      if (event != null)
      {
         const eventGeos: ImpGeofootprintGeo[] = event.geos;
         this.impGeofootprintGeoService.get().filter(geo => eventGeos.includes(geo)).forEach(geo => { geo.isActive = event.value; console.log('set geo: ' + geo.geocode + ' isActive = ' + geo.isActive); });
         this.impGeofootprintGeoService.makeDirty();
      }
   }

   public onForceRedraw() {
      this.impGeofootprintGeoService.makeDirty();
   }
}
