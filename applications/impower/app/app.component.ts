import { Component, HostListener, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from './app.config';
import { geoTransactionId, mapTransactionId } from './impower-datastore/state/transient/transactions/transactions.reducer';
import { AuthService } from './services/auth.service';
import { FullAppState } from './state/app.interfaces';

@Component({
    selector: 'val-app-root',
    templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  private geoTransaction$ = new BehaviorSubject<number>(null);
  private mapTransaction$ = new BehaviorSubject<number>(null);

  constructor(private store$: Store<FullAppState>,
              private config: AppConfig,
              private authService: AuthService) {
  }

  // @HostListener('window:beforeunload', ['$event'])
  // cleanupTransactions(e: BeforeUnloadEvent) {
  //   const geoId = this.geoTransaction$.getValue();
  //   const mapId = this.mapTransaction$.getValue();
  //   const authValue = this.authService.getAuthorizationHeaderValue();
  //   const deleteUrl = this.config.valServiceBase + this.config.serviceUrlFragments.deleteGeoCacheUrl;
  //   const fetchParams = { method: 'DELETE', keepalive: true, headers: { Authorization: authValue } };
  //
  //   if (geoId != null) {
  //     fetch(deleteUrl + geoId, fetchParams).catch(console.error);
  //   }
  //   if (mapId != null) {
  //     fetch(deleteUrl + mapId, fetchParams).catch(console.error);
  //   }
  //   // this is needed so the web browser doesn't bother the user with the "Are you sure you want to leave?" prompt
  //   // see https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onbeforeunload#example
  //   delete e.returnValue;
  // }

  public ngOnInit() : void {
    // this.store$.select(mapTransactionId).subscribe(this.mapTransaction$);
    // this.store$.select(geoTransactionId).subscribe(this.geoTransaction$);
  }
}
