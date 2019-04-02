import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { Observable } from 'rxjs';
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

  constructor(private store$: Store<AppState>) { }

  ngOnInit() {
    this.currentBusyMessage$ = this.store$.pipe(select(busyIndicatorMessage));
    this.currentBusyState$ = this.store$.pipe(select(showBusyIndicator));
  }

}
