import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalState } from '../../state';
import { localSelectors } from '../../state/app.selectors';
import { withLatestFrom, filter, tap } from 'rxjs/operators';
import { SetLegendHTML } from '../../state/shared/shared.actions';

@Component({
  selector: 'val-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.css']
})
export class LegendComponent implements OnInit {

  @ViewChild('legendNode')
  public legendNode: ElementRef;
  public color: string = 'ffff00';
  public legendData: Array<{key: string, value: string}> = [];
  myStyles = {
    'background-color': 'lime',
    'font-size': '20px',
    'font-weight': 'bold'
    };

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.store$.pipe(
      select(localSelectors.getShadingData),
    ).subscribe(shadingData => {
      this.legendData = [];
      shadingData.forEach(sd => {
        const color = this.colorToHex(sd.value[0], sd.value[1], sd.value[2]);
        this.legendData.push({ key: sd.key.toString(), value: color });
      });
      this.cd.markForCheck();
      setTimeout(() => {
        const event = new Event('change');
        //this.legendNode.nativeElement.dispatchEvent(event);
        this.store$.dispatch(new SetLegendHTML());
      }, 0);
    });
  }

  private colorToHex(r: number, g: number, b: number) {   
    const red = this.singleValueToHex(r);
    const green = this.singleValueToHex(g);
    const blue = this.singleValueToHex(b);
    return '#' + red + green + blue + '99';
  }

  private singleValueToHex (value: number) : string { 
    let hex: string = Number(value).toString(16);
    if (hex.length < 2) {
         hex = '0' + hex;
    }
    return hex;
  }

}
