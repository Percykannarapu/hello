import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LiveIndicatorService } from '../../core/live-indicator.service';
import { AppState } from '../../state/messaging.interfaces';
import { busyIndicatorMessage, showBusyIndicator } from '../../state/messaging.selectors';

@Component({
  selector: 'val-busy-indicator',
  templateUrl: './busy-indicator.component.html',
  styleUrls: ['./busy-indicator.component.css']
})
export class BusyIndicatorComponent implements OnInit {

  public currentBusyMessage$: Observable<string>;
  public currentBusyState$: Observable<boolean>;

  public currentLiveMessage$: Observable<string>;
  public currentLiveState$: Observable<boolean>;

  constructor(private store$: Store<AppState>,
              private liveService: LiveIndicatorService) { }

  ngOnInit() {
    this.currentBusyMessage$ = this.store$.pipe(select(busyIndicatorMessage));
    this.currentBusyState$ = this.store$.pipe(select(showBusyIndicator));
    this.currentLiveMessage$ = this.liveService.source$;
    this.currentLiveState$ = combineLatest([this.liveService.hasSource$, this.liveService.source$]).pipe(
      map(([hasSource, message]) => hasSource && message != null && message.length > 0)
    );
  }

}
