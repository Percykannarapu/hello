import { Component, OnInit, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnChanges(changes: SimpleChanges) {
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

  private addVariableColumns(var1: boolean, var2: boolean, var3: boolean, heading1: string, heading2: string, heading3: string) {
    if (var1) this.columns.push({field: 'var1Value', header: heading1, width: '15em'});
    if (var2) this.columns.push({field: 'var2Value', header: heading2, width: '15em'});
    if (var3) this.columns.push({field: 'var3Value', header: heading3, width: '15em'});
  }

  private createNonWrapRows(state: LocalState) {
    this.rows = []; // reset the rows
    this.createColumns(this.smallSizeTable, false);
    const newRows: Array<CompositeRow> = [];
    let var1: boolean, var2: boolean, var3: boolean;
    let heading1: string, heading2: string, heading3: string;
    for (const id of state.rfpUiEditDetail.ids) {
      const newRow: CompositeRow = state.rfpUiEditDetail.entities[id];
      const siteId = newRow.fkSite;
      var1 = state.rfpUiEditDetail.entities[id].var1Name != null ? true : false;
      var2 = state.rfpUiEditDetail.entities[id].var2Name != null ? true : false;
      var3 = state.rfpUiEditDetail.entities[id].var3Name != null ? true : false;
      heading1 = state.rfpUiEditDetail.entities[id].var1Name;
      heading2 = state.rfpUiEditDetail.entities[id].var2Name;
      heading3 = state.rfpUiEditDetail.entities[id].var3Name;
      newRow.distance = Number(state.rfpUiEditDetail.entities[id].distance.toFixed(2));
      newRow.investment = Number(state.rfpUiEditDetail.entities[id].investment.toFixed(2));
      for (const j of state.rfpUiEdit.ids) {
        if (state.rfpUiEdit.entities[j].siteId === siteId) {
          newRow.siteName = state.rfpUiEdit.entities[j].siteName;
        }
      }
      newRows.push(state.rfpUiEditDetail.entities[id]);
    }
    if (!this.smallSizeTable && (var1 || var2 || var3)) {
      this.addVariableColumns(var1, var2, var3, heading1, heading2, heading3);
    }
    this.rows = [...newRows];
    this.cd.markForCheck();
  }

  private createWrapRows(state: LocalState) {
    this.rows = []; // reset the rows
    this.isWrap = true;
    this.createColumns(this.smallSizeTable, true);
    const newRows: Array<WrapCompositeRow> = [];
    for (const id of state.rfpUiEditWrap.ids) {
      const newRow: WrapCompositeRow = state.rfpUiEditWrap.entities[id];
      const siteId: number = newRow.siteId;
      newRow.investment = Number(state.rfpUiEditWrap.entities[id].investment.toFixed(2));
      for (const j of state.rfpUiEdit.ids) {
        if (state.rfpUiEditDetail.entities[j].fkSite === siteId) {
          newRow.distance = state.rfpUiEditDetail.entities[j].distance;
        }
      }
      newRows.push(newRow);
    }
    this.rows = [...newRows];
    this.cd.markForCheck();
  }

}
