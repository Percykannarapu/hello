import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from '../../../services/app-state.service';

@Component({
  selector: 'val-audiences-custom',
  templateUrl: './audiences-custom.component.html',
  styleUrls: ['./audiences-custom.component.scss']
})
export class AudiencesCustomComponent implements OnInit, OnDestroy {

  activeTabIndex = 0;
  activeCustomAccordion = -1;

  destroyed$ = new Subject<void>();

  constructor(private appStateService: AppStateService) { }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() => {
      this.activeTabIndex = 0;
      this.activeCustomAccordion = -1;
    });
  }

  onCustomAccordionChange(e: { index: number }){
    this.activeCustomAccordion = e.index;
  }
}
