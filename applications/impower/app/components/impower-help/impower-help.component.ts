import { Component, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { openImpowerHelpDialog, openExistingDialogFlag } from 'app/state/menu/menu.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { filter, take } from 'rxjs/operators';
import { LocalAppState } from 'app/state/app.interfaces';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'val-impower-help',
  templateUrl: './impower-help.component.html',
  styleUrls: ['./impower-help.component.scss']
})
export class ImpowerHelpComponent implements OnInit {

  showImpowerHelpDialog$: Observable<boolean>;
  showDialog: boolean = false;
  items: MenuItem[];
  @ViewChild('op', {static: true}) op: OverlayPanel;
  toggleOverlay = ({ originalEvent }) => this.op.toggle(originalEvent);

  constructor(private store$: Store<LocalAppState>,
              private stateService: AppStateService) { }

  ngOnInit() {
    this.showImpowerHelpDialog$ = this.store$.select(openImpowerHelpDialog);
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
    ).subscribe(() => {
      this.store$.select(openImpowerHelpDialog).subscribe(event => {
        if (event != null){
          this.op.toggle(event);
        }
      });
    });
  }
}