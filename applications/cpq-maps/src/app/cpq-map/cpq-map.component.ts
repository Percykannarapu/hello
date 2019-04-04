import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, take, takeUntil, filter } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { FullState, localSelectors } from './state';
import { AppMapService } from './services/app-map.service';
import { selectors } from '@val/esri';

@Component({
  selector: 'cpq-map',
  templateUrl: './cpq-map.component.html',
  styleUrls: ['./cpq-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpqMapComponent implements OnInit, OnDestroy {

  private componentDestroyed = new Subject<void>();

  public panelSize = 'small';

  constructor(private appMapService: AppMapService,
              private store$: Store<FullState>) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getAppReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() =>
      this.store$.pipe(
        select(selectors.getEsriLabelConfiguration),
        map(config => config.pobEnabled),
        distinctUntilChanged(),
        takeUntil(this.componentDestroyed)
      ).subscribe(showPOBs => this.appMapService.updateLabelExpressions(showPOBs))
    );
  }

  ngOnDestroy() : void {
    this.componentDestroyed.next();
  }

  public onPanelChange(event: any) {
    this.panelSize = event;
  }
}
