import { Component } from '@angular/core';
import { AppConfig } from '../../app.config';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { AppStateService } from '../../services/app-state.service';
import { CachedObservable } from '../../val-modules/api/models/CachedObservable';
import { AppGeoService } from '../../services/app-geo.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';

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
               private appStateService: AppStateService,
               private usageService: UsageService) {
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
  }

  onClearAllSelections() {
    console.log(' fired Clear selections:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'clear-all' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }

  public onZoomToTA() {
    this.appTradeAreaService.zoomToTradeArea();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'trade-area', action: 'zoom' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }

  onRevertToTradeArea() {
    console.log(' fired onRevertToTradeArea:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = true);
    this.impGeoService.makeDirty();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'revert' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }
}
