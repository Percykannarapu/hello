import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { pad } from '@val/common';
import { combineLatest, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { LocalState } from '../../state/index';
import { LegendData } from '../../state/app.interfaces';
import { localSelectors } from '../../state/app.selectors';

function colorToHex(color: number[]) {
  const red = pad(Number(color[0]).toString(16), 2);
  const green = pad(Number(color[1]).toString(16), 2);
  const blue = pad(Number(color[2]).toString(16), 2);
  return `#${red}${green}${blue}99`;
}

function LegendEntrySort(a: LegendData, b: LegendData) {
  if (a.sortOrder == null || b.sortOrder == null) {
    return a.groupName.localeCompare(b.groupName);
  } else {
    return a.sortOrder - b.sortOrder;
  }
}

@Component({
  selector: 'cpq-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent implements OnInit, OnDestroy {

  private componentDestroyed$ = new Subject();

  legendTitle: string;
  colorLegendData: Array<{ name: string, colorHex: string, hhc: number }> = [];
  imageLegendData: Array<{ name: string, crosshatch: string, hhc: number }> = [];

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    const colorEntries$ = this.prepColorChipEntries();
    const imageEntries$ = this.prepImageEntries();

    combineLatest([colorEntries$, imageEntries$, this.store$.select(localSelectors.getLegendTitle)]).pipe(
      takeUntil(this.componentDestroyed$)
    ).subscribe(([colorResult, imageResult, title]) => {
      this.colorLegendData = colorResult;
      this.imageLegendData = imageResult;
      this.legendTitle = title;
      this.cd.detectChanges();
    }, err => {
      console.error('There was an error creating the Legend Component', err);
    });
  }

  ngOnDestroy() : void {
    this.componentDestroyed$.next();
  }

  private prepColorChipEntries() {
    return this.store$.select(localSelectors.getLegendData).pipe(
      map(shadingData => shadingData.filter(d => d.hhc > 0 && d.color != null)),
      tap(shadingData => shadingData.sort(LegendEntrySort)),
      map(shadingData => shadingData.map(d => ({ name: d.groupName, colorHex: colorToHex(d.color), hhc: d.hhc })))
    );
  }

  private prepImageEntries() {
    return this.store$.select(localSelectors.getLegendData).pipe(
      map(shadingData => shadingData.filter(d => d.image != null)),
      tap(shadingData => shadingData.sort(LegendEntrySort)),
      map(shadingData => shadingData.map(d => ({ name: d.groupName, crosshatch: d.image, hhc: d.hhc })))
    );
  }
}
