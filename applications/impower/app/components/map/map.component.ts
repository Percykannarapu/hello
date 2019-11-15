import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import {select, Store} from '@ngrx/store';
import { EsriApi, selectors } from '@val/esri';
import {ConfirmationService} from 'primeng/api';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { debounceTime, filter, take, takeUntil } from 'rxjs/operators';
import {AppConfig} from '../../app.config';
import {AppGeoService} from '../../services/app-geo.service';
import {AppMapService} from '../../services/app-map.service';
import {AppRendererService} from '../../services/app-renderer.service';
import {AppStateService} from '../../services/app-state.service';
import {AppTradeAreaService} from '../../services/app-trade-area.service';
import {FullAppState} from '../../state/app.interfaces';
import {CreateMapUsageMetric, CreateProjectUsageMetric} from '../../state/usage/targeting-usage.actions';
import {ImpProject} from '../../val-modules/targeting/models/ImpProject';
import {ImpGeofootprintGeoService} from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { getMapVars } from '../../impower-datastore/state/transient/map-vars/map-vars.selectors';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'val-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  currentAnalysisLevel$: Observable<string>;
  mapHeight$: BehaviorSubject<number> = new BehaviorSubject<number>(400);
  selectedPanelButton: number;

  private destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private impGeoService: ImpGeofootprintGeoService,
              private rendererService: AppRendererService,
              private confirmationService: ConfirmationService,
              private cd: ChangeDetectorRef,
              private store$: Store<FullAppState>) {}

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
    this.store$.pipe(
      select(getMapVars)
    ).subscribe((mapVars) => {
      console.log('In Map Component selector:::');
      // this.rendererService.getMapVars(mapVars);
    });
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
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
    this.saveMapViewData(view);
  }

  private setupApplication() : void {
    this.appStateService.notifyMapReady();
    this.appMapService.watchMapViewProperty('stationary').pipe(
      filter(result => result.newValue),
      debounceTime(500),
      takeUntil(this.destroyed$)
    ).subscribe(() => this.appStateService.refreshVisibleGeos());
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
