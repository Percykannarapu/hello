import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray } from '@val/common';
import { EsriPoiService, PoiConfiguration, ShadingDefinition, shadingSelectors } from '@val/esri';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Audience } from '../../impower-datastore/state/transient/audience/audience.model';
import { FullAppState } from '../../state/app.interfaces';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';

@Component({
  selector: 'val-map-settings-sidebar',
  templateUrl: './map-settings-sidebar.component.html',
  styleUrls: ['./map-settings-sidebar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MapSettingsSidebarComponent implements OnInit {
  sideNavVisible = false;

  shadingDefinitions$: Observable<ShadingDefinition[]>;
  poiConfigurations$: Observable<PoiConfiguration[]>;
  audiences$: Observable<Audience[]>;
  geos$: Observable<ImpGeofootprintGeo[]>;
  analysisLevel$: Observable<string>;
  locationCount$: Observable<number>;
  tradeAreaCount$: Observable<number>;

  constructor(private appStateService: AppStateService,
              private impGeoDataStore: ImpGeofootprintGeoService,
              private poiService: EsriPoiService,
              private store$: Store<FullAppState>) {}

  ngOnInit() : void {
    this.analysisLevel$ = this.appStateService.analysisLevel$;
    this.audiences$ = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null),
      filterArray(aud => aud.audienceSourceType !== 'Combined/Converted' && aud.audienceSourceType !== 'Combined' && aud.audienceSourceType !== 'Converted')
    );
    this.shadingDefinitions$ = this.store$.select(shadingSelectors.allLayerDefs).pipe(
       filter((defs) => defs != null),
    );
    this.poiConfigurations$ = this.poiService.allPoiConfigurations$.pipe(
      filter(configs => configs != null)
    );
    this.locationCount$ = this.appStateService.clientLocationCount$;
    this.tradeAreaCount$ = this.appStateService.tradeAreaCount$;
    this.geos$ = this.impGeoDataStore.storeObservable.pipe(
      filter(geos => geos != null),
      filterArray(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive &&
                            g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive &&
                            g.isActive && g.isDeduped === 1)
    );
  }
}
