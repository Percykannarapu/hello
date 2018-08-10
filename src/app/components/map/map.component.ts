import { Component, OnInit } from '@angular/core';
import { MapStateTypeCodes } from '../../models/app.enums';
import { Observable } from 'rxjs';
import { AppStateService } from '../../services/app-state.service';
import { map } from 'rxjs/operators';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppGeoService } from '../../services/app-geo.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { UsageService } from '../../services/usage.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';

@Component({
  selector: 'val-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {

  private stateCursorMap: Map<MapStateTypeCodes, string>;

  states = MapStateTypeCodes;

  currentAnalysisLevel$: Observable<string>;
  mapState$: Observable<MapStateTypeCodes>;
  cursor$: Observable<string>;

  constructor(private appStateService: AppStateService,
               private esriMapService: EsriMapService,
               private usageService: UsageService,
               private appTradeAreaService: AppTradeAreaService,
               private appGeoService: AppGeoService,
               private impGeoService: ImpGeofootprintGeoService) {
    this.stateCursorMap = new Map<MapStateTypeCodes, string>([
      [MapStateTypeCodes.SelectPoly, 'copy'],
      [MapStateTypeCodes.DrawPoint, 'cell'],
      [MapStateTypeCodes.MeasureLine, 'crosshair'],
      [MapStateTypeCodes.DrawLine, 'crosshair'],
      [MapStateTypeCodes.DrawPoly, 'crosshair'],
      [MapStateTypeCodes.RemoveGraphics, 'default'],
      [MapStateTypeCodes.Popups, 'default'],
      [MapStateTypeCodes.Labels, 'default']
    ]);
  }

  ngOnInit() {
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
    this.mapState$ = this.appStateService.currentMapState$;
    this.cursor$ = this.appStateService.currentMapState$.pipe(
      map(state => this.stateCursorMap.has(state) ? this.stateCursorMap.get(state) : 'default')
    );

  }

  onMapStateChange(newState: MapStateTypeCodes) : void {
    this.appStateService.setMapState(newState);
  }

  onClearSelections() : void {
    console.log(' fired Clear selections:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'clear-all' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }

  onRevert() : void {
    console.log(' fired onRevertToTradeArea:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = true);
    this.impGeoService.makeDirty();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'revert' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }

  onZoom() : void {
    this.appTradeAreaService.zoomToTradeArea();
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'trade-area', action: 'zoom' });
    this.usageService.createCounterMetric(usageMetricName, null, null);
  }
}
