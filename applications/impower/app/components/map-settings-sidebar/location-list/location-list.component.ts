import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray } from '@val/common';
import { duplicatePoiConfiguration, EsriPoiService, PoiConfiguration } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { AppLocationService } from '../../../services/app-location.service';
import { PoiRenderingService } from '../../../services/poi-rendering.service';
import { FullAppState } from '../../../state/app.interfaces';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationListComponent implements OnInit, OnDestroy {

  @Input() poiConfigurations: PoiConfiguration[];

  currentOpenId: string;

  sites$: Observable<ImpGeofootprintLocation[]>;
  siteLabels$: Observable<SelectItem[]>;
  siteSymbologyAttributes$: Observable<SelectItem[]>;
  competitors$: Observable<ImpGeofootprintLocation[]>;
  competitorLabels$: Observable<SelectItem[]>;
  competitorSymbologyAttributes$: Observable<SelectItem[]>;

  private destroyed$ = new Subject<void>();

  constructor(private locationService: AppLocationService,
              private appPoiService: PoiRenderingService,
              private esriPoiService: EsriPoiService,
              private store$: Store<FullAppState>,
              private logger: LoggingService) { }

  duplicatePoi(config: PoiConfiguration) : PoiConfiguration {
    return duplicatePoiConfiguration(config);
  }

  ngOnInit() : void {
    this.siteLabels$ = this.locationService.siteLabelOptions$;
    this.siteSymbologyAttributes$ = this.locationService.siteLabelOptions$.pipe(filterArray(s => s.title === 'all'));
    this.competitorLabels$ = this.locationService.competitorLabelOptions$;
    this.competitorSymbologyAttributes$ = this.locationService.competitorLabelOptions$.pipe(filterArray(s => s.title === 'all'));
    this.sites$ = this.locationService.activeClientLocations$;
    this.competitors$ = this.locationService.activeCompetitorLocations$;
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  toggleVisibility(event: MouseEvent, poi: PoiConfiguration) : void {
    if (poi.id == null) return;
    this.esriPoiService.updatePoiConfig({ id: poi.id, changes: { visible: !poi.visible }});
    if (event != null) event.stopPropagation();
  }

  openConfiguration(poi: PoiConfiguration) {
    this.currentOpenId = poi.id;
  }

  applyConfiguration(definition: PoiConfiguration) : void {
    const newPoi: PoiConfiguration = duplicatePoiConfiguration(definition);
    this.logger.debug.log('Applying Configuration changes. New values:', newPoi);
    this.esriPoiService.upsertPoiConfig(newPoi);
  }
}
