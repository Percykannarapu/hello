import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { disjointSets, distinctUntilFieldsChanged, isEmpty, isNotNil } from '@val/common';
import { MessageBoxService, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { LazyLoadEvent, PrimeIcons } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, shareReplay, startWith, take, takeUntil, tap } from 'rxjs/operators';
import { DualObservableWorker } from '../../../../worker-shared/common/core-interfaces';
import { ActiveTypedGridColumn, GeoGridMetaData, GeoGridResponse, GeoGridRow, GeoGridStats } from '../../../../worker-shared/data-model/custom/grid';
import { GeoGridExportRequest, GeoGridPayload } from '../../../../worker-shared/grid-workers/payloads';
import { getCpmForGeo } from '../../../common/complex-rules';
import { WorkerFactory } from '../../../common/worker-factory';
import { getMetricVarEntities } from '../../../impower-datastore/state/transient/metric-vars/metric-vars.selectors';
import { selectGridGeoVars } from '../../../impower-datastore/state/transient/transient.selectors';
import { AppGeoService } from '../../../services/app-geo.service';
import { AppStateService } from '../../../services/app-state.service';
import { FullAppState } from '../../../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { FileService } from '../../../val-modules/common/services/file.service';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeAreaService } from '../../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ExportFormats, ExportGeoGridComponent } from '../../dialogs/export-geo-grid/export-geo-grid.component';
import { GeoListComponent } from './geo-list/geo-list.component';

function AudienceDistinctComparison(a: Audience[], b: Audience[]) : boolean {
  const aPks = new Set(a.map(x => `${x.audienceIdentifier}-${x.sortOrder}`));
  const bPks = new Set(b.map(x => `${x.audienceIdentifier}-${x.sortOrder}`));
  return disjointSets(aPks, bPks).size === 0;
}

@Component({
  selector   : 'val-geo-list-container',
  templateUrl: './geo-list-container.component.html',
  providers: [DialogService]
})
export class GeoListContainerComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(GeoListComponent) geoGrid: GeoListComponent;

  public workerDataResult$: Observable<GeoGridRow[]>;
  public workerGridStats$: Observable<GeoGridStats>;
  public workerAdditionalAudienceColumns$: Observable<ActiveTypedGridColumn<GeoGridRow>[]>;
  public workerSelectOptions$: Observable<Record<string, string[]>>;

  private allGeocodes = new Set<string>();
  private homeGeocodes = new Set<string>();
  private mustCoverGeocodes = new Set<string>();

  private lastProjectId: number;

  private exportFilename: string = 'geo-grid-export.csv';
  private loadEvent$ = new BehaviorSubject<LazyLoadEvent>(null);
  private workerInstance: DualObservableWorker<GeoGridPayload, GeoGridResponse, GeoGridExportRequest, string>;

  private destroyed$ = new Subject();
  private geoCount: number = 0;
  private requestAccumulator: GeoGridPayload;
  private timeoutHandle: number;

  private geoAttributes: Record<string, Record<string, any>>;

  constructor(private appGeoService: AppGeoService,
              private appStateService: AppStateService,
              private dialogService: DialogService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private logger: LoggingService,
              private messageService: MessageBoxService,
              private store$: Store<FullAppState>) {}

  ngOnInit() {
    this.setupWorker();
    this.setupObservables();
  }

  ngAfterViewInit() {
    this.workerInstance.sendNewMessage({ gridData: { primaryColumnDefs: this.geoGrid.defaultColumns }});
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  public onGridLoad(event: LazyLoadEvent) : void {
    this.loadEvent$.next(event);
  }

  public onExportGrid(event: GeoGridStats) : void {
    const dRef = this.dialogService.open(ExportGeoGridComponent, {
      header: 'Export Geo List',
      width : '25vw',
      data  : { ...event }
    });
    dRef.onClose.pipe(take(1)).subscribe((result: ExportFormats) => {
      if (isNotNil(result)) {
        this.exportFile(result);
      }
    });
  }

  // -----------------------------------------------------------
  // GEO GRID OUTPUT EVENTS
  // -----------------------------------------------------------
  public onZoomGeo(geocode: string) {
    if (!isEmpty(geocode)) {
      this.appGeoService.zoomToGeocode(geocode);
    }
  }

  public onDeleteGeo(ggId: number) {
    this.messageService.showDeleteConfirmModal('Are you sure you want to delete this geo?').subscribe(result => {
      if (result) {
        this.impGeofootprintGeoService.deleteGeosById([ggId]);
      }
    });
  }

  public onSetGeoActive(geocodes: string[], newActiveFlag: boolean) {
    const usableGeocodes = isEmpty(geocodes) ? Array.from(this.allGeocodes) : Array.from(new Set<string>(geocodes));
    const hasMustCovers = usableGeocodes.some(g => this.mustCoverGeocodes.has(g));
    const hasHomeGeo = usableGeocodes.some(g => this.homeGeocodes.has(g));
    if (!newActiveFlag && (hasMustCovers || hasHomeGeo)) {
      const geoSpecifiers: string[] = [];
      if (hasMustCovers) geoSpecifiers.push('Must Cover');
      if (hasHomeGeo) geoSpecifiers.push('Home');
      const messageText = `You are about to deselect a ${geoSpecifiers.join(' & ')} geography`;
      this.messageService.showTwoButtonModal(messageText, 'Geo Deactivation', PrimeIcons.QUESTION_CIRCLE, 'Continue')
          .subscribe(result => {
            if (result) {
              this.processGeoActivations(usableGeocodes, newActiveFlag);
            } else {
              this.sendMessage({}); // just to re-render the grid
            }
          });
    } else {
      this.processGeoActivations(usableGeocodes, newActiveFlag);
    }
  }

  public onColumnSelection(columns: ActiveTypedGridColumn<GeoGridRow>[]) {
    this.workerInstance.sendNewMessage({ gridData: { primaryColumnDefs: columns }});
  }

  private processGeoActivations(usableGeocodes: string[], newActiveFlag: boolean) {
    const currentProject = this.appStateService.currentProject$.getValue();
    this.impGeofootprintGeoService.setActive(usableGeocodes, newActiveFlag);
    for (const geocode of usableGeocodes) {
      const currentAttribute = this.geoAttributes[geocode];
      const cpm = getCpmForGeo(currentAttribute, currentProject);
      const amount: number = currentAttribute.hhc * cpm / 1000;
      const metricText = `${geocode}~${currentAttribute.hhc}~${cpm}~${amount}~ui=geoGridCheckbox`;
      this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', newActiveFlag ? 'selected' : 'deselected', metricText));
    }
  }

  private setupWorker() : void {
    this.workerInstance = WorkerFactory.createGeoGridWorker();
    const workerShare$ = this.workerInstance.start({ }).pipe(
      map(response => response.value),
      tap(value => this.logger.debug.log('Web worker returned result', value)),
      shareReplay()
    );
    this.workerDataResult$ = workerShare$.pipe(
      map(response => response.rows),
      filter(isNotNil),
      startWith([]),
      tap(() => this.geoGrid?.isLazyLoading$.next(false))
    );
    this.workerGridStats$ = workerShare$.pipe(
      map(response => response.stats),
      filter(isNotNil),
      startWith({ geoCount: 0, activeGeoCount: 0, locationCount: 0, activeLocationCount: 0, currentGeoCount: 0, currentActiveGeoCount: 0, columnStats: {} }),
      tap(() => this.geoGrid?.isLazyLoading$.next(false))
    );
    this.workerAdditionalAudienceColumns$ = workerShare$.pipe(
      map(response => response.additionalAudienceColumns),
      filter(isNotNil),
      startWith([]),
      tap(() => this.geoGrid?.isLazyLoading$.next(false))
    );
    this.workerSelectOptions$ = workerShare$.pipe(
      map(response => response.multiSelectOptions),
      filter(isNotNil),
      startWith({}),
      tap(() => this.geoGrid?.isLazyLoading$.next(false))
    );
    workerShare$.pipe(
      map(response => response.metadata),
      filter(isNotNil),
      startWith({} as GeoGridMetaData),
      takeUntil(this.destroyed$)
    ).subscribe(metadata => {
      this.allGeocodes = new Set(metadata?.allFilteredGeocodes ?? []);
      this.homeGeocodes = new Set(metadata?.allHomeGeocodes ?? []);
      this.mustCoverGeocodes = new Set(metadata?.allMustCoverGeocodes ?? []);
    });
  }

  private setupObservables() : void {
    this.appStateService.currentProject$.pipe(
      filter(project => project != null),
      tap(project => {
        // In the event of a project load, clear the grid filters and set the export filename
        if (this.lastProjectId !== project.projectId) {
          this.lastProjectId = project.projectId;
          this.geoGrid.reset();
          this.exportFilename = 'geo-grid' + ((project.projectId != null) ? '-' + project.projectId.toString() : '') + '-export.csv';
        }
      }),
      distinctUntilFieldsChanged(['projectId', 'estimatedBlendedCpm', 'smValassisCpm', 'smSoloCpm', 'smAnneCpm']),
      takeUntil(this.destroyed$)
    ).subscribe(project => this.sendMessage({ gridData: { project }}));

    combineLatest([this.appStateService.allClientLocations$, this.impTradeAreaService.storeObservable, this.impGeofootprintGeoService.storeObservable]).pipe(
      filter(([l, t, g]) => (l.length > 0 && t.length > 0 && g.length > 0) || (l.length === 0 && t.length === 0 && g.length === 0)),
      takeUntil(this.destroyed$)
    ).subscribe(([locations, tradeAreas, geos]) => {
      this.impGeofootprintGeoService.calculateGeoRanks();
      this.sendMessage({ gridData: { locations, tradeAreas, geos }});
    });

    this.store$.select(fromAudienceSelectors.getAudiencesInGrid).pipe(
      distinctUntilChanged(AudienceDistinctComparison),
      takeUntil(this.destroyed$)
    ).subscribe(gridAudiences => this.sendMessage({ gridData: { gridAudiences }}));
    this.impGeofootprintGeoService.allMustCoverBS$.asObservable().pipe(
      takeUntil(this.destroyed$)
    ).subscribe(mustCovers => this.sendMessage({ gridData: { mustCovers }}));
    this.store$.pipe(select(getMetricVarEntities)).pipe(
      takeUntil(this.destroyed$),
      tap(entities => this.geoAttributes = entities)
    ).subscribe(geoAttributes => this.sendMessage({ gridData: { geoAttributes }}));
    this.store$.pipe(select(selectGridGeoVars)).pipe(
      map(gridGeoVar => gridGeoVar.geoVars),
      takeUntil(this.destroyed$),
    ).subscribe(geoVars => this.sendMessage({ gridData: { geoVars }}));
    this.loadEvent$.asObservable().pipe(
      filter(event => isNotNil(event)),
      debounceTime(300),
      takeUntil(this.destroyed$),
    ).subscribe(gridEvent => this.sendMessage({ gridEvent }));
    this.appStateService.totalGeoCount$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(count => this.geoCount = count);
  }

  private sendMessage(payload: GeoGridPayload) {
    const timeout = this.geoCount > 100000 ? 250 : 50;
    if (isNotNil(this.timeoutHandle)) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = null;
    }
    this.requestAccumulator = {
      gridData: {
        ...(this.requestAccumulator?.gridData ?? {}),
        ...(payload.gridData ?? {})
      },
      gridEvent: payload.gridEvent ?? this.requestAccumulator?.gridEvent
    };
    this.timeoutHandle = setTimeout(() => {
      this.geoGrid?.isLazyLoading$.next(true);
      if (Object.keys(this.requestAccumulator.gridData).length === 0) delete this.requestAccumulator.gridData;
      this.logger.debug.log('Request sent to web worker:', this.requestAccumulator);
      this.workerInstance.sendNewMessage(this.requestAccumulator);
      this.requestAccumulator = null;
    }, timeout) as unknown as number;
  }

  private exportFile(format: ExportFormats) {
    const key = 'Grid_Export';
    const exportSetup = {
      activeOnly: false,
      respectFilters: false
    };
    switch (format) {
      case ExportFormats.Selected:
        exportSetup.activeOnly = true;
        break;
      case ExportFormats.AllFiltered:
        exportSetup.respectFilters = true;
        break;
      case ExportFormats.SelectedFiltered:
        exportSetup.respectFilters = true;
        exportSetup.activeOnly = true;
        break;
    }
    this.store$.dispatch(new StartBusyIndicator({ key, message: 'Exporting Geo Grid' }));
    this.workerInstance.sendAlternateMessage(exportSetup).subscribe(result => {
      if (result.rowsProcessed > 0) {
        FileService.downloadUrl(result.value, this.exportFilename);
        this.store$.dispatch(new StopBusyIndicator({ key }));
      }
    });
  }
}
