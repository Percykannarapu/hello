import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { simpleFlatten } from '@val/common';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as fromAudienceSelectors from '../../../impower-datastore/state/transient/audience/audience.selectors';
import { LocalAppState } from '../../../state/app.interfaces';

@Component({
  selector: 'val-audiences-offline',
  templateUrl: './audiences-offline.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudiencesOfflineComponent implements OnInit, OnDestroy {

  reservedAudiences$: Observable<Set<number>>;
  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<LocalAppState>) { }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.reservedAudiences$ = this.store$.select(fromAudienceSelectors.getCreatedAudiences).pipe(
      takeUntil(this.destroyed$),
      map(audiences => audiences.map(a => a.compositeSource != null ? a.compositeSource.map(cs => cs.id) : [])),
      map(ids => simpleFlatten(ids)),
      map(audienceIds => new Set<number>(audienceIds))
    );
  }
}
