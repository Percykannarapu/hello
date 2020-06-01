import { Component, HostListener, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriMapService } from '@val/esri';
import { BehaviorSubject } from 'rxjs';
import { AppConfig } from './app.config';
import { AuthService } from './services/auth.service';
import { FullAppState } from './state/app.interfaces';

@Component({
    selector: 'val-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  private geoTransaction$ = new BehaviorSubject<number>(null);
  private mapTransaction$ = new BehaviorSubject<number>(null);

  constructor(private store$: Store<FullAppState>,
              private config: AppConfig,
              private authService: AuthService,
              private mapService: EsriMapService) {
  }

  @HostListener('window:keydown', ['$event'])
  keyDownEvent(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.mapService.setMousewheelNavigation(true);
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUpEvent(event: KeyboardEvent) {
    if (event.defaultPrevented) return;
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.mapService.setMousewheelNavigation(false);
        break;
    }
  }

  // @HostListener('window:beforeunload')
  // cleanupTransactions() {
  //   const geoId = this.geoTransaction$.getValue();
  //   const mapId = this.mapTransaction$.getValue();
  //   const authValue = this.authService.getAuthorizationHeaderValue();
  //   const deleteUrl = this.config.valServiceBase + this.config.serviceUrlFragments.deleteGeoCacheUrl;
  //
  //   if (geoId != null) {
  //     fetch(deleteUrl + geoId, { method: 'DELETE', keepalive: true, headers: { Authorization: authValue } });
  //   }
  //   if (mapId != null) {
  //     fetch(deleteUrl + mapId, { method: 'DELETE', keepalive: true, headers: { Authorization: authValue } });
  //   }
  // }

  public ngOnInit() : void {
    // this.store$.select(getMapTransactionId).subscribe(this.mapTransaction$);
    // this.store$.select(getGeoTransactionId).subscribe(this.geoTransaction$);
  }
}
