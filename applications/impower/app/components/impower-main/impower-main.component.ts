import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';

@Component({
  templateUrl: './impower-main.component.html',
  styleUrls: ['./impower-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpowerMainComponent implements OnInit, OnDestroy {

  private destroyed$ = new Subject<void>();

  constructor(private stateService: AppStateService,
              private messageService: MessageService,
              private cd: ChangeDetectorRef) { }

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
