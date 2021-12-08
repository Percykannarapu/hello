import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { AppLocationService } from '../../services/app-location.service';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-locations',
  templateUrl: './locations.component.html'
})
export class LocationsComponent implements OnInit {

  index = 0;
  hasLocationFailures$: Observable<boolean>;

  constructor(private appStateService: AppStateService,
              private appLocationService: AppLocationService) { }

  ngOnInit() {
    // Conditionally show the Failed Locations Tab when there are failures
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.hasLocationFailures$ = this.appLocationService.hasFailures$;
    });

    this.appStateService.clearUI$.subscribe(() => {
      this.index = 0;
    });
  }

  handleChange(e: { originalEvent: Event, index: number }) {
    this.index = e.index;
  }

}
