import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { pad } from '@val/common';
import { combineLatest } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LocalState } from '../../state';
import { localSelectors } from '../../state/app.selectors';

function colorToHex(color: number[]) {
  const red = pad(Number(color[0]).toString(16), 2);
  const green = pad(Number(color[1]).toString(16), 2);
  const blue = pad(Number(color[2]).toString(16), 2);
  return `#${red}${green}${blue}99`;
}

function url(img: string) {
  return `assets/crosshatch/${img}.png`;
}

@Component({
  selector: 'cpq-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent implements OnInit {

  legendTitle: string;
  colorLegendData: Array<{ name: string, colorHex: string, hhc: number }> = [];
  imageLegendData: Array<{ name: string, imgUrl: string, hhc: number }> = [];

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    const colorEntries$ = this.store$.select(localSelectors.getLegendData).pipe(
      map(shadingData => shadingData.filter(d => d.hhc > 0 && d.color != null)),
      tap(shadingData => shadingData.sort((a, b) => {
        if (a.sortOrder == null || b.sortOrder == null) {
          return a.groupName.localeCompare(b.groupName);
        } else {
          return a.sortOrder - b.sortOrder;
        }
      })),
      map(shadingData => shadingData.map(d => ({ name: d.groupName, colorHex: colorToHex(d.color), hhc: d.hhc })))
    );
    const imageEntries$ = this.store$.select(localSelectors.getLegendData).pipe(
      map(shadingData => shadingData.filter(d => d.image != null)),
      map(shadingData => shadingData.map(d => ({ name: d.groupName, imgUrl: url(d.image), hhc: d.hhc })))
    );

    combineLatest([colorEntries$, imageEntries$, this.store$.select(localSelectors.getLegendTitle)])
      .subscribe(([colorResult, imageResult, title]: [{ name: string, colorHex: string, hhc: number }[], { name: string, imgUrl: string, hhc: number }[], string]) => {
      this.colorLegendData = colorResult;
      this.imageLegendData = imageResult;
      this.legendTitle = title;
      this.cd.detectChanges();
    }, err => {
      console.error('There was an error creating the Legend Component', err);
    });
  }
}
