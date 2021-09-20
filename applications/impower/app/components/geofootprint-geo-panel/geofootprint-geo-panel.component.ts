import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { toUniversalCoordinates } from '@val/common';
import { EsriMapService } from '@val/esri';
import { MessageBoxService } from '@val/messaging';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { selectGeoAttributeEntities } from 'app/impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import { PrimeIcons } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { GeoAttribute } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { GridGeoVar, selectGridGeoVars } from '../../impower-datastore/state/transient/transient.selectors';
import { AppGeoService } from '../../services/app-geo.service';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

export interface FlatGeo {
   geoLocNum: string;
   geo: ImpGeofootprintGeo;
   isActive: boolean;
   isMustCover: '1' | '0';
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
   public  allLocations$: Observable<ImpGeofootprintLocation[]>;
   public  allGeos$: Observable<ImpGeofootprintGeo[]>;
   public  allMustCovers$: Observable<string[]>;
   public  allAttributes$: Observable<{ [geocode: string] : GeoAttribute }>;
   public  allVars$: Observable<GridGeoVar>;

   private gridAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
   public  dedupeGrid: boolean = false;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private appGeoService: AppGeoService,
               private appStateService: AppStateService,
               private esriMapService: EsriMapService,
               private impGeofootprintGeoService: ImpGeofootprintGeoService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               private logger: LoggingService,
               private messageService: MessageBoxService,
               private store$: Store<FullAppState>) { }

   ngOnInit() {
      // Subscribe to the data stores
      this.nonNullProject$ = this.appStateService.currentProject$.pipe(filter(project => project != null));
      this.allLocations$  = this.impGeofootprintLocationService.storeObservable;
      this.allGeos$ = this.impGeofootprintGeoService.storeObservable;

      // The geo grid watches this for changes in must covers to set the column
      this.allMustCovers$ = this.impGeofootprintGeoService.allMustCoverBS$.asObservable();

      this.allAttributes$ = this.store$.pipe(select(selectGeoAttributeEntities));

      // Subscribe to store selectors
      this.store$.select(fromAudienceSelectors.getAudiencesInGrid).subscribe(this.gridAudiencesBS$);
      this.gridAudiences$ = this.store$.select(fromAudienceSelectors.getAudiencesInGrid);

      this.allVars$ = this.store$.pipe(select(selectGridGeoVars));
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
      if (geo != null) {
        this.messageService.showDeleteConfirmModal('Do you want to delete geocode: ' + geo.geocode + '?').subscribe(result => {
          if (result) {
            this.appGeoService.deleteGeos([geo]);
            this.logger.debug.log('remove successful');
          }
        });
      }
   }

  public onSelectGeo({ geo, isSelected }) {
    if (geo.isActive !== isSelected) {
      const commonGeos = this.impGeofootprintGeoService.get().filter(g => g.geocode === geo.geocode);
      const includesHomeGeo = commonGeos.some(g => g.impGeofootprintLocation != null && g.impGeofootprintLocation.homeGeocode === g.geocode);
      if (includesHomeGeo && this.impGeofootprintGeoService.mustCovers != null && this.impGeofootprintGeoService.mustCovers.length > 0 && this.impGeofootprintGeoService.mustCovers.includes(geo.geocode) && geo.isActive) {
        this.appGeoService.confirmMustCover(geo, isSelected, true);
      } else if (this.impGeofootprintGeoService.mustCovers != null && this.impGeofootprintGeoService.mustCovers.length > 0 && this.impGeofootprintGeoService.mustCovers.includes(geo.geocode) && geo.isActive) {
        this.appGeoService.confirmMustCover(geo, isSelected, false);
      } else if (includesHomeGeo && geo.isActive) {
        this.messageService.showTwoButtonModal('You are about to deselect a Home Geo for at least one site.', 'Home Geo Deactivation', PrimeIcons.QUESTION_CIRCLE, 'Continue')
          .subscribe(result => {
            if (result) {
              commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
              this.impGeofootprintGeoService.makeDirty();
            } else {
              geo.isActive = true;
              this.impGeofootprintGeoService.makeDirty();
            }
          });
      } else {
        commonGeos.forEach(dupGeo => dupGeo.isActive = isSelected);
        this.impGeofootprintGeoService.makeDirty();
      }

      const currentProject = this.appStateService.currentProject$.getValue();
      const cpm = currentProject.estimatedBlendedCpm ?? 0;
      const amount: number = geo.hhc * cpm / 1000;
      const metricText = `${geo.geocode}~${geo.hhc}~${cpm}~${amount}~ui=geoGridCheckbox`;
      if (geo.isActive) {
        this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'selected', metricText));
      } else {
        this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'deselected', metricText));
      }
    }
  }

   public onSetAllGeos(event: any) {
      if (event != null)
      {
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

  public triggerCollapseOnToggle(collapsed: boolean) {
    this.appStateService.triggerChangeInCollapse(collapsed);
  }
}
