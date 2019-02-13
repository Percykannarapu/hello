import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { Store } from '@ngrx/store';
import { LocalState } from '../../state';
import { filter } from 'rxjs/operators';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
class CompositeRow extends RfpUiEditDetail {
  public siteName?: string;
}

class WrapCompositeRow extends RfpUiEditWrap {
  public distance?: number;
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

  rows: Array<CompositeRow | WrapCompositeRow> = [];
  isWrap: boolean = true;

  constructor(private store$: Store<LocalState>) { }

  ngOnChanges(changes: SimpleChanges) {
    /*if (changes.smallSizeTable.currentValue === true) {
      this.createColumns(true, false);
    } else {
      this.createColumns(false, false);
    }*/
    this.smallSizeTable = changes.smallSizeTable.currentValue;
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
    this.columns = []; //reset the columns
    if (small) {
      if (isWrap) 
        this.columns.push({field: 'wrapZone', header: 'Zone', width: '15em'});
      else 
        this.columns.push({field: 'geocode', header: 'Zone', width: '8em'});
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '8em'});
      this.columns.push({field: 'investment', header: 'Investment', width: '10em'});
    } else {
      this.columns.push({field: 'siteName', header: 'Site Name', width: '15em'});
      if (isWrap) 
        this.columns.push({field: 'wrapZone', header: 'Zone', width: '15em'});
      else 
        this.columns.push({field: 'geocode', header: 'Zone', width: '8em'});
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '7.5em'});
      this.columns.push({field: 'distance', header: 'Distance', width: '7.5em'});
      this.columns.push({field: 'ownerGroup', header: 'Owner', width: '7.5em'});
      this.columns.push({field: 'investment', header: 'Investment', width: '10em'});
    }
  }

  private createNonWrapRows(state: LocalState) {
    this.createColumns(this.smallSizeTable, false);
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
    this.createColumns(this.smallSizeTable, true);
    const newRows: Array<WrapCompositeRow> = [];
    for (const id of state.rfpUiEditWrap.ids) {
      const newRow: WrapCompositeRow = state.rfpUiEditWrap.entities[id];
      const siteId: number = newRow.siteId;
      for (const j of state.rfpUiEdit.ids) {
        if (state.rfpUiEditDetail.entities[j].fkSite === siteId) {
          newRow.distance = state.rfpUiEditDetail.entities[j].distance;
        }
      }
      newRows.push(newRow);
    }
    this.rows = [...newRows];
  }

}
