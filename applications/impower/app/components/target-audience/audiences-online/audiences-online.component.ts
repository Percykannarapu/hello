import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as fromAudienceSelectors from '../../../impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';

@Component({
  selector: 'val-audiences-online',
  templateUrl: './audiences-online.component.html'
})
export class AudiencesOnlineComponent implements OnInit, OnDestroy {

  activeAccordion: any = null;
  reservedAudiences$: Observable<Set<number>>;
  private destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService,
              private store$: Store<LocalAppState>) { }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.activeAccordion = null;
    });
    this.reservedAudiences$ = this.store$.select(fromAudienceSelectors.getReservedIds).pipe(takeUntil(this.destroyed$));
  }
}
