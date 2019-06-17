import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNumber } from '@val/common';
import { filter, map } from 'rxjs/operators';
import { LocalState } from '../../state';
import { GridGeoToggle } from '../../state/grid/grid.actions';
import * as fromGridSelectors from '../../state/grid/grid.selectors';
import { UpdateRfpUiEditDetails } from '../../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';

export interface FullColumn extends fromGridSelectors.GridColumn {
  formatType?: 'string' | 'number' | 'currency';
  formatSpec?: string;
}

@Component({
selector: 'val-grid',
templateUrl: './grid.component.html',
styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit {

  private gridIsSmall: boolean = true;
  private smallGridColumns: fromGridSelectors.GridColumn[] = [];
  private largeGridColumns: fromGridSelectors.GridColumn[] = [];

  @Input()
  set smallSizeTable(value: boolean) {
    this.setGridSize(value);
  }

  columns: fromGridSelectors.GridColumn[] = [];
  rows: fromGridSelectors.GridRowBase[] = [];
  selectedRows: fromGridSelectors.GridRowBase[] = [];

  gridStyle = 'small';

  constructor(private store$: Store<LocalState>) { }

  ngOnInit() {
    this.store$.select(fromGridSelectors.getGridRows).pipe(
      filter(rows => rows != null)
    ).subscribe(rows => {
      this.rows = rows;
      this.selectedRows = rows.filter(r => r.isSelected);
    });

    this.store$.select(fromGridSelectors.getSmallGridColumns).pipe(
      map(cols => cols.map(c => this.enrichColumn(c)))
    ).subscribe(cols => {
      this.smallGridColumns = cols;
      this.setGridSize(this.gridIsSmall);
    });
    this.store$.select(fromGridSelectors.getLargeGridColumns).pipe(
      map(cols => cols.map(c => this.enrichColumn(c)))
    ).subscribe(cols => {
      this.largeGridColumns = cols;
      this.setGridSize(this.gridIsSmall);
    });
  }

  getColumnType(column: FullColumn, currentRowValue: string | number) : 'string' | 'number' | 'currency' {
    if (column.formatType != null) return column.formatType;
    return isNumber(currentRowValue) ? 'number' : 'string';
  }

  onChangeRowSelection(event: { data: fromGridSelectors.GridRowBase }) {
    this.store$.dispatch(new GridGeoToggle({ geocode: event.data.selectionIdentifier }));
  }

  private setGridSize(isSmall: boolean) {
    this.gridIsSmall = isSmall;
    this.columns = isSmall ? this.smallGridColumns : this.largeGridColumns;
    this.gridStyle = isSmall ? 'small' : 'large';
  }

  private enrichColumn(column: fromGridSelectors.GridColumn) : FullColumn {
    if (column.field === 'investment') {
      return { ...column, formatType: 'currency', formatSpec: null };
    }
    if (column.field === 'distance') {
      return { ...column, formatType: 'number', formatSpec: '1.2-2' };
    }
    if (column.field === 'geocode') {
      return { ...column, formatType: 'string', formatSpec: null };
    }
    return column;
  }

  private applyHeaderFilter(event: any){
    const geoChanges = [];
    this.rows.forEach(data => {
      if (data.isSelected != event.checked){
        const geos = { id: data['id'], changes: { isSelected: !data['isSelected'] }};
        geoChanges.push(geos);
      }
    });
    this.store$.dispatch(new UpdateRfpUiEditDetails({rfpUiEditDetails: geoChanges }));
  }
}
