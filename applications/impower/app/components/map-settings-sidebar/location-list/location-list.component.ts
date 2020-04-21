import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriPoiService, PoiConfiguration } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { AppLocationService } from '../../../services/app-location.service';
import { PoiRenderingService } from '../../../services/poi-rendering.service';
import { FullAppState } from '../../../state/app.interfaces';
import { LoggingService } from '../../../val-modules/common/services/logging.service';

@Component({
  selector: 'val-location-list',
  templateUrl: './location-list.component.html',
  styleUrls: ['./location-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationListComponent implements OnInit, OnDestroy {

  @Input() poiConfigurations: PoiConfiguration[];

  currentOpenId: string;

  siteLabels$: Observable<SelectItem[]>;
  competitorLabels$: Observable<SelectItem[]>;

  private destroyed$ = new Subject<void>();

  constructor(private locationService: AppLocationService,
              private appPoiService: PoiRenderingService,
              private esriPoiService: EsriPoiService,
              private store$: Store<FullAppState>,
              private logger: LoggingService) { }

  ngOnInit() : void {
    this.siteLabels$ = this.locationService.siteLabelOptions$;
    this.competitorLabels$ = this.locationService.competitorLabelOptions$;
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  toggleVisibility(event: MouseEvent, poi: PoiConfiguration) : void {
    if (poi.id == null) return;
    const copy = { ...poi, visible: !poi.visible };
    this.esriPoiService.updatePoiConfig(copy);
    if (event != null) event.stopPropagation();
  }

  openConfiguration(poi: PoiConfiguration) {
    this.currentOpenId = poi.id;
  }

  applyConfiguration(definition: PoiConfiguration) : void {
    const newPoi: PoiConfiguration = { ...definition };
    this.logger.debug.log('Applying Configuration changes. New values:', { ...newPoi });
    this.esriPoiService.updatePoiConfig(newPoi);
  }
}
