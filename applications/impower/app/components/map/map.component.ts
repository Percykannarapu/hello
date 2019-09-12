import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../../services/app-map.service';
import { AppStateService } from '../../services/app-state.service';
import { AppGeoService } from '../../services/app-geo.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { AppRendererService } from '../../services/app-renderer.service';
import { select, Store } from '@ngrx/store';
import { filter, take } from 'rxjs/operators';
import { FullAppState, LocalAppState } from '../../state/app.interfaces';
import { CreateMapUsageMetric, CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { EsriApi, selectors } from '@val/esri';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ConfirmationService } from 'primeng/api';

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
  selectedPanelButton: any;
  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private impGeoService: ImpGeofootprintGeoService,
              private rendererService: AppRendererService,
              private confirmationService: ConfirmationService,
              private store$: Store<FullAppState>,
              private config: AppConfig) {}

  ngOnInit() {
    console.log('Initializing Application Map Component');
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.setupApplication());
    this.store$.pipe(
      select(selectors.getEsriFeaturesSelected),
      filter(features => features != null && features.length > 0)
    ).subscribe(features => this.onPolysSelected(features));
  }

  fnSelectedButton(button) {
    this.selectedPanelButton = button;
  }

  onClearSelections() : void {
    console.log(' fired Clear selections:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'clear-all'));
  }

  onRevert() : void {
    console.log(' fired onRevertToTradeArea:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = true);
    this.impGeoService.makeDirty();
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'revert'));
  }

  onZoom() : void {
    this.appTradeAreaService.zoomToTradeArea();
    this.store$.dispatch(new CreateMapUsageMetric('trade-area', 'zoom'));
  }

  onViewExtentChanged(view: __esri.MapView) : void {
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    if (analysisLevel != null) {
      const layerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
      this.appStateService.setVisibleGeocodes(layerId);
    }
    this.saveMapViewData(view);
  }

  private setupApplication() : void {
    this.appMapService.setupMap();
    this.setupMapFromStorage();
  }

  private checkFilters(features: __esri.Graphic[], currentProject: ImpProject) : any {
    const includeValassis = currentProject.isIncludeValassis;
    const includeAnne = currentProject.isIncludeAnne;
    const includeSolo = currentProject.isIncludeSolo;
    const includePob = !currentProject.isExcludePob;
    let outerCheck: boolean = true;
    const filteredFeatures: __esri.Graphic[] = [];
    features.forEach((feature, index) => {
      const currentAttribute = feature.attributes;
      if (currentAttribute != null) {
        let innerCheck: boolean = true;
        switch (currentAttribute['owner_group_primary']) {
          case 'VALASSIS':
          innerCheck = includeValassis ? (innerCheck && true) : false;
            break;
          case 'ANNE':
          innerCheck = includeAnne ? (innerCheck && true) : false;
            break;
          default:
          innerCheck = innerCheck;
        }
        if (currentAttribute['cov_frequency'] === 'Solo') {
          innerCheck = includeSolo ? (innerCheck && true) : false;
        }
        if (currentAttribute['pob'] === 'B') {
          innerCheck = includePob ? (innerCheck && true) : false;
        }
        if (innerCheck) {
          filteredFeatures.push(feature);
        } 
        outerCheck = outerCheck && innerCheck;
      }     
    });
    return { outerCheck, filteredFeatures };
  }

  private geosRespectingFilters(features: __esri.Graphic[]) : void {
    const currentProject = this.appStateService.currentProject$.getValue();
    // if (currentProject == null || geosInObj == null || geos == null || geos.length === 0) return;
    const response = this.checkFilters(features, currentProject);
    const isRespectingFilters: boolean = response.outerCheck;
    const filteredFeatures: __esri.Graphic[] = response.filteredFeatures;
    if (!isRespectingFilters) {
      this.confirmationService.confirm({
        message: 'You are about to select geographies outside of your desired filtered criteria. Are you sure you want to include these geographies?',
        header: 'Filter Warning',
        accept: () => {
          this.appStateService.filterFlag.next(true);
          this.appMapService.selectMultipleGeocode(features, this.selectedPanelButton, true);
        },
        reject: () => {
          this.appStateService.filterFlag.next(true);
          this.appMapService.selectMultipleGeocode(features, this.selectedPanelButton, false, filteredFeatures);
        }
      });
    } else {
      this.appStateService.filterFlag.next(true);
      this.appMapService.selectMultipleGeocode(features, this.selectedPanelButton, true);
    }
  }

  private onPolysSelected(polys: __esri.Graphic[]) : void {
    if (this.selectedPanelButton === 3) {
      this.geosRespectingFilters(polys);
    } else if (this.selectedPanelButton === 8) {
      this.appMapService.selectMultipleGeocode(polys, this.selectedPanelButton);
    }   
  }

  private saveMapViewData(mapView: __esri.MapView) {
    const mapHeight = mapView.container.clientHeight > 50 ? mapView.container.clientHeight : 400;
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(mapView.viewpoint.toJSON()));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(mapHeight + 10));
  }

  private setupMapFromStorage() : void {
    const vpString = localStorage.getItem(VIEWPOINT_KEY);
    const heightString = localStorage.getItem(HEIGHT_KEY);
    const heightNum = Number(heightString);
    if (vpString) {
      const vp = JSON.parse(vpString);
      this.appMapService.setViewpoint(EsriApi.Viewpoint.fromJSON(vp));
    }
    if (Number.isNaN(heightNum) || heightNum < 50) {
      this.mapHeight$.next(400);
    } else {
      this.mapHeight$.next(heightNum);
    }
  }
}
