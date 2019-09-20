import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriMapService, EsriUtils, selectors } from '@val/esri';
import { Observable, Subject } from 'rxjs';
import { filter, map, skip, take, takeUntil, withLatestFrom } from 'rxjs/operators';
import { AppMapService } from '../../services/app-map.service';
import { FullAppState, getRouterSlice } from '../../state/app.interfaces';
import { MoveToSite, SetBatchMode, SetMapReady } from '../../state/batch-map/batch-map.actions';
import { getBatchMapReady, getLastSiteFlag, getNextSiteNumber } from '../../state/batch-map/batch-map.selectors';
import { CreateNewProject, ProjectLoad } from '../../state/data-shim/data-shim.actions';
import Timeout = NodeJS.Timeout;

@Component({
  templateUrl: './batch-map.component.html',
  styleUrls: ['./batch-map.component.scss']
})
export class BatchMapComponent implements OnInit, OnDestroy {

  mapViewIsReady$: Observable<boolean>;
  nextSiteNumber$: Observable<string>;
  isLastSite$: Observable<boolean>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<FullAppState>,
              private appMapService: AppMapService,
              private esriMapService: EsriMapService) { }

  ngOnInit() {
    this.store$.dispatch(new SetBatchMode());
    this.store$.dispatch(new CreateNewProject());
    this.store$.select(selectors.getMapReady).pipe(
      filter(ready => ready),
      take(1),
    ).subscribe(() => this.setupMap());
    this.mapViewIsReady$ = this.store$.select(getBatchMapReady);
    this.nextSiteNumber$ = this.store$.select(getNextSiteNumber);
    this.isLastSite$ = this.store$.select(getLastSiteFlag);
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  onGoToSite(siteNum: string) : void {
    this.store$.dispatch(new MoveToSite({ siteNum }));
  }

  private setupMap() : void {
    console.log('Setup Map called');
    EsriUtils.setupWatch(this.esriMapService.mapView, 'updating').pipe(
      takeUntil(this.destroyed$)
    ).subscribe(result => this.store$.dispatch(new SetMapReady({ mapReady: !result.newValue })));
    this.appMapService.setupMap(true);
    this.store$.select(getBatchMapReady).pipe(
      filter(ready => ready),
      take(1),
      withLatestFrom(this.store$.select(getRouterSlice)),
      map(([, slice]) => slice.state.params),
      filter(params => params.id != null)
    ).subscribe(params => this.loadBatchProject(params.id));
  }

  private loadBatchProject(projectId: number) : void {
    this.store$.dispatch(new ProjectLoad({ projectId, isReload: false }));
  }
}
