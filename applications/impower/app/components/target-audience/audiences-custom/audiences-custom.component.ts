import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from '../../../services/app-state.service';

@Component({
  selector: 'val-audiences-custom',
  templateUrl: './audiences-custom.component.html'
})
export class AudiencesCustomComponent implements OnInit, OnDestroy {

  public activeCustomAccordion: any = null;

  private destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService) { }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.activeCustomAccordion = null;
    });
  }
}
