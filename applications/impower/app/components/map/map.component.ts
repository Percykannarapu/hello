import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { SelectedButtonTypeCodes, selectors } from '@val/esri';
import Viewpoint from 'esri/Viewpoint';
import { ConfirmationService } from 'primeng/api';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AppGeoService } from '../../services/app-geo.service';
import { AppMapService } from '../../services/app-map.service';
import { AppRendererService } from '../../services/app-renderer.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { FullAppState } from '../../state/app.interfaces';
import { CreateNewProject } from '../../state/data-shim/data-shim.actions';
import { CreateMapUsageMetric, CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'val-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  currentAnalysisLevel$: Observable<string>;
  mapHeight$: BehaviorSubject<number> = new BehaviorSubject<number>(400);
  selectedPanelButton: number;
  toolbarButtons = [
    SelectedButtonTypeCodes.ShowPopups,
    SelectedButtonTypeCodes.XY,
    SelectedButtonTypeCodes.SelectSinglePoly,
    SelectedButtonTypeCodes.SelectMultiplePolys,
    SelectedButtonTypeCodes.UnselectMultiplePolys,
    SelectedButtonTypeCodes.MeasureDistance
  ];

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private impGeoService: ImpGeofootprintGeoService,
              private rendererService: AppRendererService,
              private confirmationService: ConfirmationService,
              private logger: LoggingService,
              private cd: ChangeDetectorRef,
              private store$: Store<FullAppState>) {}

  private static saveMapViewData(mapView: __esri.MapView) {
    const mapHeight = mapView.container.clientHeight > 50 ? mapView.container.clientHeight : 400;
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(mapView.viewpoint.toJSON()));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(mapHeight + 10));
  }

  ngOnInit() {
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
    this.logger.debug.log(' fired Clear selections:::');
    this.appGeoService.clearAllGeos(true, true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'clear-all'));
  }

  onRevert() : void {
    this.logger.debug.log(' fired onRevertToTradeArea:::');
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
    MapComponent.saveMapViewData(view);
  }

  private setupApplication() : void {
    this.appMapService.setupMap();
    this.setupMapFromStorage();
    this.appStateService.notifyMapReady();
    setTimeout(() => this.store$.dispatch(new CreateNewProject()), 0);
  }

  private checkFilters(features: __esri.Graphic[], currentProject: ImpProject) : any {
    const includeValassis = currentProject.isIncludeValassis;
    const includeAnne = currentProject.isIncludeAnne;
    const includeSolo = currentProject.isIncludeSolo;
    const includePob = !currentProject.isExcludePob;
    let outerCheck: boolean = true;
    const filteredFeatures: __esri.Graphic[] = [];
    features.forEach((feature) => {
      const currentAttribute = feature.attributes;
      if (currentAttribute != null) {
        let innerCheck: boolean = true;
        switch (currentAttribute['owner_group_primary']) {
          case 'VALASSIS':
            innerCheck = includeValassis;
            break;
          case 'ANNE':
            innerCheck = includeAnne;
            break;
        }
        if (currentAttribute['cov_frequency'] === 'Solo') {
          innerCheck = includeSolo ? innerCheck : false;
        }
        if (currentAttribute['pob'] === 'B') {
          innerCheck = includePob ? innerCheck : false;
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
    const response = this.checkFilters(features, currentProject);
    const isRespectingFilters: boolean = response.outerCheck;
    const filteredFeatures: __esri.Graphic[] = response.filteredFeatures;
    let singleSelectFlag: boolean;
    if (this.selectedPanelButton === 1) {
      singleSelectFlag = this.appGeoService.checkGeoOnSingleSelect(features);
    }
    if (!isRespectingFilters && !singleSelectFlag) {
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
      this.cd.markForCheck();
    } else {
      this.appStateService.filterFlag.next(true);
      this.appMapService.selectMultipleGeocode(features, this.selectedPanelButton, true);
    }
  }

  private onPolysSelected(polys: __esri.Graphic[]) : void {
    if (this.selectedPanelButton === 3 || this.selectedPanelButton === 1) {
      this.geosRespectingFilters(polys);
    } else if (this.selectedPanelButton === 8) {
      this.appMapService.selectMultipleGeocode(polys, this.selectedPanelButton);
    }
  }

  private setupMapFromStorage() : void {
    const vpString = localStorage.getItem(VIEWPOINT_KEY);
    const heightString = localStorage.getItem(HEIGHT_KEY);
    const heightNum = Number(heightString);
    if (vpString) {
      const vp = JSON.parse(vpString);
      this.appMapService.setViewpoint(Viewpoint.fromJSON(vp));
    }
    if (Number.isNaN(heightNum) || heightNum < 50) {
      this.mapHeight$.next(400);
    } else {
      this.mapHeight$.next(heightNum);
    }
  }

}
