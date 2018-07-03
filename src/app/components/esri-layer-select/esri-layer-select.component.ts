import { Component } from '@angular/core';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { AppConfig } from '../../app.config';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { AppStateService } from '../../services/app-state.service';
import { CachedObservable } from '../../val-modules/api/models/CachedObservable';
import { AppGeoService } from '../../services/app-geo.service';

@Component({
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent {

  public currentAnalysisLevel$: CachedObservable<string>;

  constructor(private appTradeAreaService: AppTradeAreaService,
               private impGeoService: ImpGeofootprintGeoService,
               private appGeoService: AppGeoService,
               private queryService: EsriQueryService,
               private config: AppConfig,
               private appStateService: AppStateService) {
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
  }

  onClearAllSelections() {
    console.log(' fired Clear selections:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
  }

  public onZoomToTA() {
    this.appTradeAreaService.zoomToTradeArea();
  }

  onRevertToTradeArea() {
    console.log(' fired onRevertToTradeArea:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = true);
    this.impGeoService.makeDirty();
  }
}
