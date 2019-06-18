import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { pad } from '@val/common';
import { map, tap, withLatestFrom } from 'rxjs/operators';
import { LocalState } from '../../state';
import { localSelectors } from '../../state/app.selectors';

function colorToHex(color: number[]) {
  const red = pad(Number(color[0]).toString(16), 2);
  const green = pad(Number(color[1]).toString(16), 2);
  const blue = pad(Number(color[2]).toString(16), 2);
  return `#${red}${green}${blue}99`;
}

@Component({
  selector: 'cpq-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent implements OnInit {

  legendTitle: string;
  legendData: Array<{ name: string, colorHex: string, hhc: number }> = [];

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getLegendData),
      map(shadingData => shadingData.filter(d => d.hhc > 0)),
      tap(shadingData => shadingData.sort((a, b) => {
        if (a.sortOrder == null || b.sortOrder == null) {
          return a.groupName.localeCompare(b.groupName);
        } else {
          return a.sortOrder - b.sortOrder;
        }
      })),
      map(shadingData => shadingData.map(d => ({ name: d.groupName, colorHex: colorToHex(d.color), hhc: d.hhc }))),
      withLatestFrom(this.store$.pipe(select(localSelectors.getLegendTitle)))
    ).subscribe(([result, title]) => {
      this.legendData = result;
      this.legendTitle = title;
      this.cd.detectChanges();
    }, err => {
      console.error('There was an error creating the Legend Component', err);
    });
  }
}
