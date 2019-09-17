import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { selectors } from '@val/esri';
import { filter, take } from 'rxjs/operators';
import { AppMapService } from '../../services/app-map.service';
import { FullAppState } from '../../state/app.interfaces';

@Component({
  templateUrl: './batch-map.component.html',
  styleUrls: ['./batch-map.component.scss']
})
export class BatchMapComponent implements OnInit {

  constructor(private store$: Store<FullAppState>,
              private appMapService: AppMapService) { }

  ngOnInit() {
    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.appMapService.setupMap());
  }

}
