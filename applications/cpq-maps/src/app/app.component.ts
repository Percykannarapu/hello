import { Component, ElementRef, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { selectors } from '@val/esri';
import { filter } from 'rxjs/internal/operators/filter';
import { take } from 'rxjs/operators';
import { FullState } from './cpq-map/state';
import { ApplicationStartup } from './cpq-map/state/init/init.actions';

@Component({
  selector: 'cpq-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private elementRef: ElementRef<HTMLDivElement>,
              private store$: Store<FullState>) {}

  ngOnInit() {
    const el = this.elementRef.nativeElement;
    const groupId = Number(el.getAttribute('groupId'));
    const mediaPlanId = Number(el.getAttribute('mediaPlanId'));
    const analysisLevel: string = el.getAttribute('analysisLevel') || 'atz';
    const radius = Number(el.getAttribute('radius'));
    const threshold: string = el.getAttribute('threshold');
    const promoDateFrom: Date = new Date(Number(el.getAttribute('promoDateFrom')));
    const promoDateTo: Date = new Date(Number(el.getAttribute('promoDateTo')));

    this.store$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.store$.dispatch(new ApplicationStartup({ groupId, mediaPlanId, radius, analysisLevel, threshold, promoDateFrom, promoDateTo }));
    });
  }
}
