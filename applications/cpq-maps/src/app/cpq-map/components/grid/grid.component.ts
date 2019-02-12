import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { Store } from '@ngrx/store';
import { LocalState } from '../../state';
import { filter } from 'rxjs/operators';
class CompositeRow extends RfpUiEditDetail {
  public siteName?: string;
}

@Component({
  selector: 'val-grid',
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit, OnChanges {

  @Input()
  columns: Array<any> = [];

  @Input()
  smallSizeTable: boolean;

  rows: Array<CompositeRow> = [];
  isWrap: boolean = false;

  constructor(private store$: Store<LocalState>) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.smallSizeTable.currentValue === true) {
      this.createColumns(true, false);
    } else {
      this.createColumns(false, false);
    }
  }

  ngOnInit() {
    this.store$.select(state => state).pipe(
      filter(state => state.shared.appReady === true)
    ).subscribe(state => {
      if (state.rfpUiEditDetail.entities[state.rfpUiEditDetail.ids[0]].productCd === 'WRAP') {
        this.createWrapRows(state);
      } else {
        this.createNonWrapRows(state);
      }
    });
  }

  private createColumns(small: boolean, isWrap: boolean) {
    if (small) {
      if (isWrap) this.columns.push({field: 'wrapZone', header: 'Zone', width: '8em'});
      else this.columns.push({field: 'geocode', header: 'Zone', width: '8em'});
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '8em'});
      this.columns.push({field: 'investment', header: 'Investment', width: '8em'});
    } else {
      this.columns.push({field: 'siteName', header: 'Site Name', width: '15em'});
      if (isWrap) this.columns.push({field: 'wrapZone', header: 'Zone', width: '8em'});
      else this.columns.push({field: 'geocode', header: 'Zone', width: '8em'})
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '7.5em'});
      this.columns.push({field: 'distance', header: 'Distance', width: '7.5em'});
      this.columns.push({field: 'ownerGroup', header: 'Owner', width: '7.5em'});
      this.columns.push({field: 'investment', header: 'Investment', width: '7.5em'});
    }
  }

  private createNonWrapRows(state: LocalState) {
    const newRows: Array<CompositeRow> = [];
    for (const id of state.rfpUiEditDetail.ids) {
      const newRow: CompositeRow = state.rfpUiEditDetail.entities[id];
      const siteId = newRow.fkSite;
      for (const j of state.rfpUiEdit.ids) {
        if (state.rfpUiEdit.entities[j].siteId === siteId) {
          newRow.siteName = state.rfpUiEdit.entities[j].siteName;
        }
      }
      newRows.push(state.rfpUiEditDetail.entities[id]);
    }
    this.rows = [...newRows];
  }

  private createWrapRows(state: LocalState) {
    this.isWrap = true;
    console.warn('WOULD CREATE WRAP DATA ROWS HERE');
  }

}
