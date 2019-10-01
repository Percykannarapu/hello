import { Component, OnDestroy, OnInit } from '@angular/core';
import { Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { EsriMapService, selectors } from '@val/esri';
import { Observable, Subject } from 'rxjs';
import { filter, map, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppMapService } from '../../services/app-map.service';
import { FullAppState, getRouteParams, getRouteQueryParams } from '../../state/app.interfaces';
import { MoveToSite, SetBatchMode, SetMapReady } from '../../state/batch-map/batch-map.actions';
import { getBatchMapReady, getLastSiteFlag, getNextSiteNumber } from '../../state/batch-map/batch-map.selectors';
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

  mapViewIsReady$: Observable<boolean>;
  nextSiteNumber$: Observable<string>;
  isLastSite$: Observable<boolean>;
  height$: Observable<number>;

  private typedParams$: Observable<BatchMapQueryParams>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<FullAppState>,
              private config: AppConfig,
              private appMapService: AppMapService,
              private esriMapService: EsriMapService) { }

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
    this.mapViewIsReady$ = this.store$.select(getBatchMapReady);
    this.nextSiteNumber$ = this.store$.select(getNextSiteNumber);
    this.isLastSite$ = this.store$.select(getLastSiteFlag);
    this.typedParams$ = this.store$.select(getRouteQueryParams).pipe(
      map(params => BatchMapComponent.convertParams(params))
    );
    this.height$ = this.typedParams$.pipe(
      map(params => params.height)
    );
    this.config.isBatchMode = true;
    this.store$.dispatch(new SetBatchMode());
    this.store$.dispatch(new CreateNewProject());
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  onGoToSite(siteNum: string) : void {
    this.store$.dispatch(new MoveToSite({ siteNum }));
  }

  private setupMap() : void {
    console.log('Setup Map called');
    this.esriMapService.watchMapViewProperty('updating').pipe(
      takeUntil(this.destroyed$)
    ).subscribe(result => this.store$.dispatch(new SetMapReady({ mapReady: !result.newValue })));
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
