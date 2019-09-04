import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNumber, mapBy } from '@val/common';
import { filter, map, take } from 'rxjs/operators';
import { LocalState } from '../../state';
import { localSelectors } from '../../state/app.selectors';
import { GridGeosToggle } from '../../state/grid/grid.actions';
import * as fromGridSelectors from '../../state/grid/grid.selectors';
import { CalculateEqualIntervals, InitializeMapUI } from '../../state/map-ui/map-ui.actions';
import { VarDefinition, ShadingType } from '../../state/map-ui/map-ui.reducer';
import { NumericVariableShadingMethod } from '../shading-config/shading-config.component';

export interface FullColumn extends fromGridSelectors.GridColumn {
  formatType?: 'string' | 'number' | 'currency';
  formatSpec?: string;
}

@Component({
selector: 'cpq-grid',
templateUrl: './grid.component.html',
styleUrls: ['./grid.component.css']
})
export class GridComponent implements OnInit {

  private gridIsSmall: boolean = true;
  private smallGridColumns: FullColumn[] = [];
  private largeGridColumns: FullColumn[] = [];
  private filteredIds: number[] = null;
  private selectedClassBreak: number = 0;
  private selectedVar: VarDefinition = null;
  private selectedNumericMethod: NumericVariableShadingMethod = NumericVariableShadingMethod.StandardIndex;
  private shadeBy: ShadingType = ShadingType.ZIP;
  private classBreakValues: number[] = [];

  @Input()
  set smallSizeTable(value: boolean) {
    this.setGridSize(value);
  }

  columns: FullColumn[] = [];
  searchableColumnNames: string[] = [];

  rows: fromGridSelectors.GridRowBase[] = [];
  selectedRows: fromGridSelectors.GridRowBase[] = [];

  gridStyle: string = 'small';
  emptyGridMessage: string = 'Loading Media Plan...';

  constructor(private store$: Store<LocalState>, private cd: ChangeDetectorRef) { }

  private static enrichColumn(column: fromGridSelectors.GridColumn) : FullColumn {
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

  ngOnInit() {
    this.store$.select(fromGridSelectors.getGridRows).pipe(
      filter(rows => rows != null),
    ).subscribe(rows => {
      this.rows = rows;
      this.selectedRows = rows.filter(r => r.isSelected);
    });
    this.store$.select(fromGridSelectors.getSmallGridColumns).pipe(
      map(cols => cols.map(c => GridComponent.enrichColumn(c)))
    ).subscribe(cols => {
      this.smallGridColumns = cols;
      this.setGridSize(this.gridIsSmall);
    });
    this.store$.select(fromGridSelectors.getLargeGridColumns).pipe(
      map(cols => cols.map(c => GridComponent.enrichColumn(c)))
    ).subscribe(cols => {
      this.largeGridColumns = cols;
      this.setGridSize(this.gridIsSmall);
    });
    this.store$.select(localSelectors.getAppReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.emptyGridMessage = 'No matching results');

    this.store$.select(localSelectors.getMapUIState).subscribe(shading => {
      //console.log('values updated::::oninit=====>', shading);
      const mapByNameVars = mapBy(shading.availableVars, 'name');
      this.selectedClassBreak = shading.selectedClassBreaks;
      this.selectedVar =  shading.selectedVar != null ? mapByNameVars.get(shading.selectedVar.name) : shading.selectedVar;
      this.selectedNumericMethod = shading.selectedNumericMethod;
      this.shadeBy = shading.shadingType;
      this.classBreakValues = shading.classBreakValues;

    });
  }

  getColumnType(column: FullColumn, currentRowValue: string | number) : 'string' | 'number' | 'currency' {
    if (column.formatType != null) return column.formatType;
    return isNumber(currentRowValue) ? 'number' : 'string';
  }

  onChangeRowSelection(event: { data: fromGridSelectors.GridRowBase }) {
   this.store$.dispatch(new GridGeosToggle({ geos: [event.data.selectionIdentifier] }));
   this.store$.dispatch(new InitializeMapUI());
   //this.store$.dispatch(new SetShadingType({shadingType: this.shadeBy}));
   // console.log('selectedClassBreak::', this.selectedClassBreak, 'selectedVar::', this.selectedVar);
   if (this.selectedVar != null)
      this.store$.dispatch(new CalculateEqualIntervals({breakCount: this.selectedClassBreak,
                                                        selectedVar: this.selectedVar,
                                                        selectedNumericMethod: this.selectedNumericMethod,
                                                        classBreakValues: this.classBreakValues}));
  }

  onFilter(event: { filters: any, filteredValue: fromGridSelectors.GridRowBase[] }) {
    this.filteredIds = event.filteredValue.map(r => r.id);
    this.cd.markForCheck();
  }

  onHeaderCheckbox(event: { checked: boolean }) {
    const ids = this.filteredIds == null ? new Set<number>(this.rows.map(r => r.id)) : new Set(this.filteredIds);
    const geos = this.rows.reduce((a, c) => {
      if (ids.has(c.id) && c.isSelected !== event.checked) {
        return [...a, c.selectionIdentifier];
      } else {
        return a;
      }
    }, []);
    this.store$.dispatch(new GridGeosToggle({ geos: geos }));
    this.store$.dispatch(new InitializeMapUI());
    if (this.selectedVar != null)
      this.store$.dispatch(new CalculateEqualIntervals({breakCount: this.selectedClassBreak,
                                                        selectedVar: this.selectedVar,
                                                        selectedNumericMethod: this.selectedNumericMethod,
                                                        classBreakValues: this.classBreakValues}));
  }

  private setGridSize(isSmall: boolean) {
    this.gridIsSmall = isSmall;
    this.columns = isSmall ? this.smallGridColumns : this.largeGridColumns;
    this.gridStyle = isSmall ? 'small' : 'large';
    this.searchableColumnNames = this.columns.reduce((a, c) => c.searchable ? [...a, c.field] : a, []);
  }
}
