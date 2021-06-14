import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppStateService } from 'app/services/app-state.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { openImpowerHelpDialog } from 'app/state/menu/menu.selectors';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

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
