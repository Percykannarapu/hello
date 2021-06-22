import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as fromAudienceSelectors from '../../../impower-datastore/state/transient/audience/audience.selectors';
import { LocalAppState } from '../../../state/app.interfaces';

@Component({
  selector: 'val-audiences-offline',
  templateUrl: './audiences-offline.component.html'
})
export class AudiencesOfflineComponent implements OnInit, OnDestroy {

  reservedAudiences$: Observable<Set<number>>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<LocalAppState>) { }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.reservedAudiences$ = this.store$.select(fromAudienceSelectors.getReservedIds).pipe(takeUntil(this.destroyed$));
  }
}
