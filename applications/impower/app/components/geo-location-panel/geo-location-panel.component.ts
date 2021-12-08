import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-geo-location-panel',
  templateUrl: './geo-location-panel.component.html',
  styleUrls: ['./geo-location-panel.component.scss']
})
export class GeoLocationPanelComponent implements OnInit {

  locationCount$: Observable<number>;
  geoCount$: Observable<number>;
  index: number = 0;

  constructor(private appStateService: AppStateService) { }

  ngOnInit() : void {
    this.locationCount$ = this.appStateService.clientLocationCount$;
    this.geoCount$ = this.appStateService.totalGeoCount$;

    this.appStateService.clearUI$.subscribe(() => {
      this.index = 0;
    });
  }

  handleTabChange(e: { originalEvent: Event, index: number }) {
      this.index = e.index;
  }
}
