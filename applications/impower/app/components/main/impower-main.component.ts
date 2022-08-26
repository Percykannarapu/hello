import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { InfoNotification } from '@val/messaging';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { setNetworkStatus } from '../../impower-datastore/state/application-state/application-state.actions';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';

@Component({
  templateUrl: './impower-main.component.html',
  styleUrls: ['./impower-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpowerMainComponent implements OnInit, OnDestroy {

  private destroyed$ = new Subject<void>();

  constructor(private stateService: AppStateService,
              private messageService: MessageService,
              private store$: Store<FullAppState>,
              private cd: ChangeDetectorRef) { }

  @HostListener('window:online', ['$event'])
  onOnline(event: Event) : void {
    this.store$.dispatch(setNetworkStatus({ isOnline: true }));
    this.store$.dispatch(InfoNotification({ message: 'ImPower is Online', notificationTitle: 'Network Status', sticky: true }));
  }

  @HostListener('window:offline', ['$event'])
  onOffline(event: Event) : void {
    this.store$.dispatch(setNetworkStatus({ isOnline: false }));
    this.store$.dispatch(InfoNotification({ message: 'ImPower is Offline', notificationTitle: 'Network Status', sticky: true }));
  }

  ngOnInit() : void {
    this.messageService.messageObserver.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.cd.markForCheck();
    });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  closeOverlays() : void {
    this.stateService.closeOverlays();
  }
}
