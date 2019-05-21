import { Component, ElementRef, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { ApplicationStartup } from './cpq-map/state/shared/shared.actions';
import { FullState } from './cpq-map/state';
import { selectors, SetSelectedLayer } from '@val/esri';
import { ConfigService } from './cpq-map/services/config.service';
import { filter } from 'rxjs/internal/operators/filter';
import { take } from 'rxjs/operators';

@Component({
  selector: 'cpq-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private elementRef: ElementRef,
              private store$: Store<FullState>,
              private configService: ConfigService) {}

  ngOnInit() {
    const el = this.elementRef.nativeElement;
    const groupId = Number(el.getAttribute('groupId'));
    const mediaPlanId = Number(el.getAttribute('mediaPlanId'));
    const analysisLevel: string = el.getAttribute('analysisLevel') || 'atz';
    const radius = Number(el.getAttribute('radius'));
    const threshold: string = el.getAttribute('threshold');

    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.store$.dispatch(new ApplicationStartup({ groupId, mediaPlanId, radius, analysisLevel, threshold }));
      this.store$.dispatch(new SetSelectedLayer({ layerId: this.configService.layers[analysisLevel.toLowerCase()].boundaries.id }));
    });
  }

}
