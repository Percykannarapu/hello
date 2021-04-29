import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { simpleFlatten } from '@val/common';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import * as fromAudienceSelectors from '../../../impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';

@Component({
  selector: 'val-audiences-online',
  templateUrl: './audiences-online.component.html',
  styleUrls: ['./audiences-online.component.scss']
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
    this.reservedAudiences$ = this.store$.select(fromAudienceSelectors.getCreatedAudiences).pipe(
      takeUntil(this.destroyed$),
      map(audiences => audiences.map(a => a.compositeSource != null ? a.compositeSource.map(cs => cs.id) : [])),
      map(ids => simpleFlatten(ids)),
      map(audienceIds => new Set<number>(audienceIds))
    );
  }
}
