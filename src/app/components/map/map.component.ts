import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../../services/app-map.service';
import { AppStateService } from '../../services/app-state.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppGeoService } from '../../services/app-geo.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { UsageService } from '../../services/usage.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { EsriApi } from '../../esri/core/esri-api.service';
import { EsriMapService } from '../../esri/services/esri-map.service';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'val-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  currentAnalysisLevel$: Observable<string>;
  mapHeight$: BehaviorSubject<number> = new BehaviorSubject<number>(400);

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private esriMapService: EsriMapService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private impGeoService: ImpGeofootprintGeoService,
              private usageService: UsageService,
              private config: AppConfig) {}

  ngOnInit() {
    console.log('Initializing Application Map Component');
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
  }

  setupApplication() : void {
    this.appMapService.setupMap();
    this.setupMapFromStorage(this.esriMapService.mapView);
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

  onPolysSelected(polys: __esri.Graphic[]) : void {
    this.appMapService.selectMultipleGeocode(polys);
  }

  onViewExtentChanged(view: __esri.MapView) : void {
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    if (analysisLevel != null) {
      const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
      this.appStateService.setVisibleGeocodes(layerId, view.extent);
    }
    this.saveMapViewData(view);
  }

  private saveMapViewData(mapView: __esri.MapView) {
    const mapHeight = mapView.container.clientHeight > 50 ? mapView.container.clientHeight : 400;
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(mapView.viewpoint.toJSON()));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(mapHeight));
  }

  setupMapFromStorage(view: __esri.MapView) : void {
    const vpString = localStorage.getItem(VIEWPOINT_KEY);
    const heightString = localStorage.getItem(HEIGHT_KEY);
    const heightNum = Number(heightString);
    if (vpString) {
      const vp = JSON.parse(vpString);
      view.viewpoint = EsriApi.Viewpoint.fromJSON(vp);
    }
    if (Number.isNaN(heightNum) || heightNum < 50) {
      this.mapHeight$.next(400);
    } else {
      this.mapHeight$.next(heightNum);
    }
  }
}
