import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { EsriMapService, selectors } from '@val/esri';
import { combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../../services/app-map.service';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState, getRouteParams, getRouteQueryParams } from '../../state/app.interfaces';
import { MoveToSite, SetBatchMode, SetMapReady } from '../../state/batch-map/batch-map.actions';
import { getBatchMapReady, getLastSiteFlag, getMapMoving, getNextSiteNumber, getCurrentSiteNum } from '../../state/batch-map/batch-map.selectors';
import { CreateNewProject, ProjectLoad } from '../../state/data-shim/data-shim.actions';

interface BatchMapQueryParams {
  height: number;
}

const defaultQueryParams: BatchMapQueryParams = {
  height: 850
};

@Component({
  templateUrl: './batch-map.component.html',
  styleUrls: ['./batch-map.component.scss']
})
export class BatchMapComponent implements OnInit, OnDestroy {

  mapViewIsReady: boolean;
  nextSiteNumber: string;
  isLastSite: boolean;
  height$: Observable<number>;
  currentSiteNumber: string;

  private typedParams$: Observable<BatchMapQueryParams>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<FullAppState>,
              private config: AppConfig,
              private appStateService: AppStateService,
              private appMapService: AppMapService,
              private esriMapService: EsriMapService,
              private zone: NgZone) { }

  private static convertParams(params: Params) : BatchMapQueryParams {
    const result = {
      ...defaultQueryParams,
    };
    if (params.height != null && !Number.isNaN(Number(params.height))) result.height = Number(params.height);

    return result;
  }

  ngOnInit() {
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1),
    ).subscribe(() => this.setupMap());

    combineLatest([this.store$.select(getBatchMapReady), this.store$.select(getMapMoving)]).pipe(
      map(([ready, moving]) => ready && !moving),
      takeUntil(this.destroyed$)
    ).subscribe(ready => this.zone.run(() => this.mapViewIsReady = ready));

    this.store$.select(getNextSiteNumber).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(siteNum => this.zone.run(() => this.nextSiteNumber = siteNum));
    this.store$.select(getLastSiteFlag).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(lastSite => this.zone.run(() => this.isLastSite = lastSite));

    this.typedParams$ = this.store$.select(getRouteQueryParams).pipe(
      map(params => BatchMapComponent.convertParams(params))
    );
    this.height$ = this.typedParams$.pipe(
      map(params => params.height)
    );
    this.config.isBatchMode = true;
    this.store$.dispatch(new SetBatchMode());
    this.store$.dispatch(new CreateNewProject());
    this.store$.select(getCurrentSiteNum).subscribe(s => {
      this.currentSiteNumber = s;
    });
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  onGoToSite(siteNum: string) : void {
    if (siteNum != null) this.store$.dispatch(new MoveToSite({ siteNum }));
  }

  private setupMap() : void {
    this.esriMapService.watchMapViewProperty('updating').pipe(
      takeUntil(this.destroyed$),
    ).subscribe(result => this.store$.dispatch(new SetMapReady({ mapReady: !result.newValue })));
    this.appMapService.watchMapViewProperty('stationary').pipe(
      filter(result => result.newValue),
      debounceTime(500),
      takeUntil(this.destroyed$)
    ).subscribe(() => this.appStateService.refreshVisibleGeos());
    this.appMapService.setupMap(true);
    this.store$.select(getBatchMapReady).pipe(
      filter(ready => ready),
      take(1),
      withLatestFrom(this.store$.select(getRouteParams)),
      filter(([, params]) => params.id != null)
    ).subscribe(([, params]) => this.loadBatchProject(params.id));
  }

  private loadBatchProject(projectId: number) : void {
    this.store$.dispatch(new ProjectLoad({ projectId, isReload: false }));
  }
}
