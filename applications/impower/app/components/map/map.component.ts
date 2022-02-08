import { Component, OnInit } from '@angular/core';
import Viewpoint from '@arcgis/core/Viewpoint';
import { select, Store } from '@ngrx/store';
import { isEmpty, toNullOrNumber } from '@val/common';
import { SelectedButtonTypeCodes, selectors } from '@val/esri';
import { DialogService } from 'primeng/dynamicdialog';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AppGeoService } from '../../services/app-geo.service';
import { AppMapService } from '../../services/app-map.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { ManualGeoService } from '../../services/manual-geo.service';
import { FullAppState } from '../../state/app.interfaces';
import { CreateNewProject } from '../../state/data-shim/data-shim.actions';
import { CreateMapUsageMetric, CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ManualGeoDialogComponent } from '../dialogs/manual-geo-dialog/manual-geo-dialog.component';

const VIEWPOINT_KEY = 'IMPOWER-MAPVIEW-VIEWPOINT';
const HEIGHT_KEY = 'IMPOWER-MAP-HEIGHT';

@Component({
  selector: 'val-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  providers: [DialogService]
})
export class MapComponent implements OnInit {
  currentAnalysisLevel$: Observable<string>;
  mapHeight$: BehaviorSubject<number> = new BehaviorSubject<number>(400);
  toolbarButtons = [
    SelectedButtonTypeCodes.ShowPopups,
    SelectedButtonTypeCodes.XY,
    SelectedButtonTypeCodes.SelectSinglePoly,
    SelectedButtonTypeCodes.SelectMultiplePolys,
    SelectedButtonTypeCodes.UnselectMultiplePolys,
    SelectedButtonTypeCodes.MeasureDistance
  ];

  showLayerProgress$ = this.appMapService.showLayerProgress$;

  constructor(private appStateService: AppStateService,
              private appMapService: AppMapService,
              private appTradeAreaService: AppTradeAreaService,
              private appGeoService: AppGeoService,
              private dialogService: DialogService,
              private impGeoService: ImpGeofootprintGeoService,
              private logger: LoggingService,
              private manualGeoService: ManualGeoService,
              private store$: Store<FullAppState>) {}

  ngOnInit() {
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.setupApplication());
  }

  onClearSelections() : void {
    this.appGeoService.clearAllGeos(true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = false);
    this.impGeoService.makeDirty();
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'clear-all'));
  }

  onRevert() : void {
    this.appGeoService.clearAllGeos(true, true, true);
    this.impGeoService.get().forEach(geo => geo.isActive = true);
    this.impGeoService.makeDirty();
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'revert'));
  }

  onZoom() : void {
    this.appTradeAreaService.zoomToTradeArea();
    this.store$.dispatch(new CreateMapUsageMetric('trade-area', 'zoom'));
  }

  onViewExtentChanged(view: __esri.MapView) : void {
    const mapHeight = view.container.clientHeight > 50 ? view.container.clientHeight : 400;
    localStorage.setItem(VIEWPOINT_KEY, JSON.stringify(view.viewpoint.toJSON()));
    localStorage.setItem(HEIGHT_KEY, JSON.stringify(mapHeight));
  }

  private setupApplication() : void {
    this.appMapService.setupMap();
    this.setupMapFromStorage();
    this.setupManualSelections();
    this.appStateService.notifyMapReady();
    setTimeout(() => this.store$.dispatch(new CreateNewProject()), 0);
  }

  private setupMapFromStorage() : void {
    const vpString = localStorage.getItem(VIEWPOINT_KEY);
    const heightString = localStorage.getItem(HEIGHT_KEY);
    const heightNum = toNullOrNumber(heightString) ?? 400;
    if (heightNum < 50) {
      this.mapHeight$.next(400);
    } else {
      this.mapHeight$.next(heightNum);
    }
    if (!isEmpty(vpString)) {
      const vp = JSON.parse(vpString);
      // using set timeout here to ensure map height is set before the viewpoint, avoiding the southerly creep of the map view
      setTimeout(() => this.appMapService.setViewpoint(Viewpoint.fromJSON(vp)));
    }
  }

  private setupManualSelections() : void {
    this.manualGeoService.setupManualGeoSelections(
      this.appStateService.currentProject$,
      this.appStateService.activeClientLocations$,
      this.impGeoService.storeObservable
    ).subscribe(response => {
      this.dialogService.open(ManualGeoDialogComponent, {
        data: response,
        header: 'Manual Selection',
        width: '25vw',
        styleClass: 'val-table-dialog'
      });
    });
  }
}
