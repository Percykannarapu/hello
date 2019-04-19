import { Component, OnInit, Input, OnChanges, ChangeDetectorRef } from '@angular/core';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { Store, select } from '@ngrx/store';
import { LocalState } from '../../state';
import { filter } from 'rxjs/operators';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { UpsertRfpUiEditDetail } from '../../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { UpsertRfpUiEditWraps } from '../../state/rfpUiEditWrap/rfp-ui-edit-wrap.actions';

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
export class GridComponent implements OnInit {

private currentState: LocalState;
private smallTableBackingVar: boolean;

@Input()
columns: Array<any> = [];

@Input()
set smallSizeTable(val: boolean) {
  this.smallTableBackingVar = val;
  this.refreshRows(this.currentState);
}

rows: Array<CompositeRow | WrapCompositeRow> = [];
selectedRows: Array<CompositeRow | WrapCompositeRow> = [];
isWrap: boolean = true;

constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

ngOnInit() {
  this.store$.pipe(select(state => state)).pipe(
    filter(state => state.shared.appReady === true)
  ).subscribe(state => this.refreshRows(state));
}

private refreshRows(state: LocalState) : void {
  this.currentState = state;
  if (state == null) return;
  if (state.rfpUiEditDetail.entities[state.rfpUiEditDetail.ids[0]].productCd === 'WRAP') {
    this.createWrapRows(state);
  } else {
    this.createNonWrapRows(state);
  }
  this.cd.markForCheck();
}

private createColumns(small: boolean, isWrap: boolean) {
  this.columns = []; //reset the columns
  if (small) {
    if (isWrap) {
      this.columns.push({field: 'wrapZone', header: 'Wrap Zone', width: '10em', styleClass: 'val-text-left'});
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '4em', styleClass: 'val-text-right'});
      this.columns.push({field: 'investment', header: 'Investment', width: '6em', styleClass: 'val-text-right'});
    }
    else {
      this.columns.push({field: 'geocode', header: 'Geocode', width: '3em', styleClass: 'val-text-left'});
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '4em', styleClass: 'val-text-right'});
      this.columns.push({field: 'investment', header: 'Investment', width: '4em', styleClass: 'val-text-right'});

    }
  } else {
    this.columns.push({field: 'siteName', header: 'Site Name', width: '10em', styleClass: 'val-text-left'});
    if (isWrap) 
      this.columns.push({field: 'wrapZone', header: 'Wrap Zone', width: '10em', styleClass: 'val-text-left'});
    else {
      this.columns.push({field: 'geocode', header: 'Geocode', width: '5.5em', styleClass: 'val-text-left'});
      this.columns.push({field: 'distance', header: 'Distance', width: '4.5em', styleClass: 'val-text-right'});  
    }
    this.columns.push({field: 'distribution', header: 'Distr Qty', width: '5em', styleClass: 'val-text-right'});
    this.columns.push({field: 'ownerGroup', header: 'Owner', width: '5em', styleClass: 'val-text-center'});
    this.columns.push({field: 'investment', header: 'Investment', width: '5.5em', styleClass: 'val-text-right'});
  }
}

private addVariableColumns(var1: boolean, var2: boolean, var3: boolean, heading1: string, heading2: string, heading3: string) {
  if (var1) this.columns.push({field: 'var1Value', header: heading1, width: '6em', styleClass: "val-text-right"});
  if (var2) this.columns.push({field: 'var2Value', header: heading2, width: '6em', styleClass: "val-text-right"});
  if (var3) this.columns.push({field: 'var3Value', header: heading3, width: '6em', styleClass: "val-text-right"});
}

private createNonWrapRows(state: LocalState) {
  this.rows = []; // reset the rows
  this.selectedRows = [];
  this.createColumns(this.smallTableBackingVar, false);
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
    if (state.rfpUiEditDetail.entities[id].distance)
      newRow.distance = Number(state.rfpUiEditDetail.entities[id].distance.toFixed(2));
    if (state.rfpUiEditDetail.entities[id].investment)  
      newRow.investment = Number(state.rfpUiEditDetail.entities[id].investment.toFixed(2));
    if (newRow.isSelected)
      this.selectedRows.push(newRow);
    for (const j of state.rfpUiEdit.ids) {
      if (state.rfpUiEdit.entities[j].siteId === siteId) {
        newRow.siteName = state.rfpUiEdit.entities[j].siteName;
      }
    }
    newRows.push(state.rfpUiEditDetail.entities[id]);
  }
  if (!this.smallTableBackingVar && (var1 || var2 || var3)) {
    this.addVariableColumns(var1, var2, var3, heading1, heading2, heading3);
  }
  this.rows = newRows;
}

public onChangeRowSelection(event: any) {
  if (event.data.geocode) {
    const rowUpdate: RfpUiEditDetail = Object.assign({}, event.data);
    rowUpdate.isSelected = !rowUpdate.isSelected;
    this.store$.dispatch(new UpsertRfpUiEditDetail({ rfpUiEditDetail: <RfpUiEditDetail> rowUpdate }));
  } else {
    // for wrap we need to update all of the rows that have the same wrap zone
    const rowUpdates: Array<RfpUiEditWrap> = [];
    const matchedRows = this.rows.filter(row => row.wrapZone === event.data.wrapZone);
    matchedRows.forEach(row => {
      const rowUpdate: RfpUiEditWrap = Object.assign({}, <WrapCompositeRow> row);
      rowUpdate.isSelected = !rowUpdate.isSelected;
      rowUpdates.push(rowUpdate);
    });
    this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: rowUpdates }));
  }
}

private createWrapRows(state: LocalState) {
  this.rows = []; // reset the rows
  this.selectedRows = [];
  this.isWrap = true;
  this.createColumns(this.smallTableBackingVar, true);
  const newRows: Array<WrapCompositeRow> = [];
  for (const id of state.rfpUiEditWrap.ids) {
    const newRow: WrapCompositeRow = state.rfpUiEditWrap.entities[id];
    const siteId: number = newRow.siteId;
    if (state.rfpUiEditWrap.entities[id].investment)
      newRow.investment = Number(state.rfpUiEditWrap.entities[id].investment.toFixed(2));
    for (const j of state.rfpUiEdit.ids) {
      if (state.rfpUiEditDetail.entities[j].fkSite === siteId) {
        newRow.distance = state.rfpUiEditDetail.entities[j].distance;
      }
    }
    if (newRow.isSelected)
      this.selectedRows.push(newRow);
    newRows.push(newRow);
  }
  this.rows = [...newRows];
}

}
