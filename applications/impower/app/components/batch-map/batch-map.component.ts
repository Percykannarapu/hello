import { Component, ElementRef, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { isError } from '@val/common';
import { EsriShadingLayersService, selectors as esriSelectors } from '@val/esri';
import { combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, filter, map, take, takeUntil, withLatestFrom, tap } from 'rxjs/operators';
import * as StackTrace from 'stacktrace-js';
import { AppConfig } from '../../app.config';
import { getMapAudienceIsFetching } from '../../impower-datastore/state/transient/audience/audience.selectors';
import { BatchMapService } from '../../services/batch-map.service';
import { FullAppState } from '../../state/app.interfaces';
import { MoveToSite, SetBatchMode } from '../../state/batch-map/batch-map.actions';
import { getBatchMapReady, getCurrentSiteNum, getLastSiteFlag, getMapMoving, getNextSiteNumber } from '../../state/batch-map/batch-map.selectors';
import { CreateNewProject } from '../../state/data-shim/data-shim.actions';
import { BatchMapQueryParams, getRouteParams, getTypedBatchQueryParams } from '../../state/shared/router.interfaces';

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
  lastError: string = null;
  debounceTime = 5000;
  @ViewChild('gotoSpecificSiteInput', {static: false}) specificSiteRef: ElementRef;

  private typedParams$: Observable<BatchMapQueryParams>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<FullAppState>,
              private batchMapService: BatchMapService,
              private esriRendererService: EsriShadingLayersService,
              private config: AppConfig,
              private zone: NgZone) {
    const stdErr = console.error;
    console.error = (...args) => {
      let errorMessage: string;
      if (isError(args[1])) {
        StackTrace.fromError(args[1]).then(frames => {
          errorMessage = args[0] + '<br>' + args[1].message + '<br>' + frames.filter(f => !f.fileName.includes('node_modules')).join('<br>');
          this.zone.run(() => this.lastError = errorMessage);
        });
      } else {
        errorMessage = args.join('<br>');
        this.zone.run(() => this.lastError = errorMessage);
      }
      stdErr(...args);
    };
  }

  ngOnInit() {
    this.typedParams$ = this.store$.select(getTypedBatchQueryParams);

    this.store$.select(esriSelectors.getMapReady).pipe(
      filter(ready => ready),
      take(1),
      withLatestFrom(this.store$.select(getRouteParams)),
      filter(([, params]) => params.id != null)
    ).subscribe(([, params]) => this.batchMapService.initBatchMapping(params.id));

    combineLatest([this.store$.select(getBatchMapReady), this.store$.select(getMapMoving), this.store$.select(getMapAudienceIsFetching), this.store$.select(getTypedBatchQueryParams)]).pipe(
      tap(([, , , params]) => params.height > 2000 ? this.debounceTime = 10000 : 5000),
      map(([ready, moving, fetching]) => ready && !moving && !fetching),
      debounceTime(this.debounceTime),
      takeUntil(this.destroyed$)
    ).subscribe(ready => this.zone.run(() => this.mapViewIsReady = ready));
    this.store$.select(getNextSiteNumber).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(siteNum => this.zone.run(() => this.nextSiteNumber = siteNum));
    this.store$.select(getLastSiteFlag).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(lastSite => this.zone.run(() => this.isLastSite = lastSite));
    this.store$.select(getCurrentSiteNum).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(s => this.zone.run(() => this.currentSiteNumber = s));

    this.height$ = this.typedParams$.pipe(
      map(params => params.height)
    );
    this.config.isBatchMode = true;
    this.store$.dispatch(new SetBatchMode());
    this.store$.dispatch(new CreateNewProject());
    this.esriRendererService.initializeShadingWatchers();
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  onGoToSite(siteNum: string) : void {
    this.mapViewIsReady = false;
    if (siteNum != null) this.store$.dispatch(new MoveToSite({ siteNum }));
  }

  onGoToSpecificSite() : void {
    if (this.specificSiteRef != null) this.onGoToSite(this.specificSiteRef.nativeElement.value);
  }
}
