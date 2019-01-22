import { Component, OnInit, Input } from '@angular/core';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { Store } from '@ngrx/store';
import { LocalState } from '../../state';

@Component({
  selector: 'val-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit {

  @Input()
  columns: Array<string>;

  rows: Array<RfpUiEditDetail> = [];

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
    this.store$.select(state => state.rfpUiEditDetail).subscribe(state => {
      const newRows: Array<RfpUiEditDetail> = [];
      for (const id of state.ids) {
        newRows.push(state.entities[id]);
      }
      this.rows = [...newRows];
    });
  }

}
