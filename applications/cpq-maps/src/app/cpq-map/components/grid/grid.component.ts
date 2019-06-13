import { ChangeDetectorRef, Component, Input, OnInit, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { DataTable } from 'primeng/primeng';
import { filter } from 'rxjs/operators';
import { RfpUiEditDetail } from '../../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { RfpUiEditWrap } from '../../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { LocalState } from '../../state';
import { GridGeoToggle } from '../../state/grid/grid.actions';

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

  @ViewChild('dt')
  public pTable: DataTable;

  rows: Array<Partial<CompositeRow> | Partial<WrapCompositeRow>> = [];
  selectedRows: Array<Partial<CompositeRow> | Partial<WrapCompositeRow>> = [];
  isWrap: boolean = true;

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.store$.pipe(select(state => state)).pipe(
      filter(state => state.shared.appReady === true)
    ).subscribe(state => this.refreshRows(state));

    this.pTable.filterConstraints['search'] = (value: string, searchFilter: string) : boolean => {
      if (searchFilter === undefined || searchFilter === null || searchFilter === '') {
        return true;
      }
      if (value === undefined || value === null || !value.length) {
        return false;
      }
      return value.toLowerCase().includes(searchFilter.toLowerCase());
    };

  }

  public applyFilter(searchFilter: string) {
    this.pTable.filter(searchFilter, 'global', 'search');
  }

  public onFilter() {
    this.cd.markForCheck();
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
        this.columns.push({field: 'wrapZone', header: 'Wrap Zone', width: '10em', styleClass: 'val-text-left', formatType: 'string'});
        this.columns.push({field: 'distribution', header: 'Distr Qty', width: '5em', styleClass: 'val-text-right', formatType: 'number'});
        this.columns.push({field: 'investment', header: 'Investment', width: '6.5em', styleClass: 'val-text-right', formatType: 'currency'});
      }
      else {
        this.columns.push({field: 'geocode', header: 'Geocode', width: '3.5em', styleClass: 'val-text-left', formatType: 'string'});
        this.columns.push({field: 'distribution', header: 'Distr Qty', width: '5em', styleClass: 'val-text-right', formatType: 'number'});
        this.columns.push({field: 'investment', header: 'Investment', width: '4.5em', styleClass: 'val-text-right', formatType: 'currency'});
      }
    } else {
      this.columns.push({field: 'siteName', header: 'Site Name', width: '9em', styleClass: 'val-text-left', formatType: 'string'});
      if (isWrap)
        this.columns.push({field: 'wrapZone', header: 'Wrap Zone', width: '10em', styleClass: 'val-text-left', formatType: 'string'});
      else {
        this.columns.push({field: 'geocode', header: 'Geocode', width: '5.5em', styleClass: 'val-text-left', formatType: 'string'});
        this.columns.push({field: 'distance', header: 'Distance', width: '5.5em', styleClass: 'val-text-right', formatType: 'number', formatSpec: '1.2-2'});
      }
      this.columns.push({field: 'distribution', header: 'Distr Qty', width: '5em', styleClass: 'val-text-right', formatType: 'number'});
      this.columns.push({field: 'ownerGroup', header: 'Owner', width: '5em', styleClass: 'val-text-center', formatType: 'string'});
      this.columns.push({field: 'investment', header: 'Investment', width: '6.5em', styleClass: 'val-text-right', formatType: 'currency'});
    }
  }

  private addVariableColumns(field: string, header: string, formatType: string) {
    if (this.columns.filter(c => c.field === field).length > 0 || this.smallTableBackingVar) return;
    this.columns.push({field, header, width: '6em', styleClass: 'val-text-right', formatType});
  }

  private createNonWrapRows(state: LocalState) {
    this.rows = []; // reset the rows
    this.selectedRows = [];
    this.createColumns(this.smallTableBackingVar, false);
    const newRows: Array<Partial<CompositeRow>> = [];
    for (const id of state.rfpUiEditDetail.ids) {
      const newRow: Partial<CompositeRow> = { ...state.rfpUiEditDetail.entities[id] };
      const siteId = newRow.fkSite;
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

      if (newRow.var1Name != null) {
        if (newRow.var1IsNumber) {
          newRow.var1Value = Number(newRow.var1Value) as any;
          this.addVariableColumns('var1Value', newRow.var1Name, 'number');
        } else {
          this.addVariableColumns('var1Value', newRow.var1Name, 'string');
        }
      }
      if (newRow.var2Name != null) {
        if (newRow.var2IsNumber) {
          newRow.var2Value = Number(newRow.var2Value) as any;
          this.addVariableColumns('var2Value', newRow.var2Name, 'number');
        } else {
          this.addVariableColumns('var2Value', newRow.var2Name, 'string');
        }
      }
      if (newRow.var3Name != null) {
        if (newRow.var3IsNumber) {
          newRow.var3Value = Number(newRow.var3Value) as any;
          this.addVariableColumns('var3Value', newRow.var3Name, 'number');
        } else {
          this.addVariableColumns('var3Value', newRow.var3Name, 'string');
        }
      }
      newRows.push(newRow);
    }
    newRows.sort((a, b) => a.distance - b.distance);
    this.rows = newRows;
  }

  public onChangeRowSelection(event: any) {
    if (event.data.geocode) {
      this.store$.dispatch(new GridGeoToggle({ geocode: event.data.geocode }));
    } else {
      this.store$.dispatch(new GridGeoToggle({ geocode: event.data.wrapZone }));
    }
  }

  private createWrapRows(state: LocalState) {
    this.rows = []; // reset the rows
    this.selectedRows = [];
    this.isWrap = true;
    this.createColumns(this.smallTableBackingVar, true);
    const newRows: Array<Partial<WrapCompositeRow>> = [];
    for (const id of state.rfpUiEditWrap.ids) {
      const newRow: Partial<WrapCompositeRow> = { ...state.rfpUiEditWrap.entities[id] };
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
    newRows.sort((a, b) => a.wrapZone.localeCompare(b.wrapZone));
    this.rows = newRows;
  }

}
