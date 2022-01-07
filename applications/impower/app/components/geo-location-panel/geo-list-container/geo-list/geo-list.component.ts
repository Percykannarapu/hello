import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { isArray, isEmpty, isNil, isNotNil } from '@val/common';
import { LazyLoadEvent, SelectItem, SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, tap } from 'rxjs/operators';
import {
  ActiveTypedGridColumn,
  BooleanDisplayTypes,
  GeoGridRow,
  GeoGridStats,
  SubTotalTypes
} from '../../../../../worker-shared/data-model/custom/grid';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';
import { SearchInputComponent } from '../../../common/search-input/search-input.component';

@Component({
  selector: 'val-geo-list',
  templateUrl: './geo-list.component.html',
  styleUrls: ['./geo-list.component.scss'],
  providers: [CurrencyPipe, DecimalPipe]
})
export class GeoListComponent implements OnInit {

  @ViewChild(SearchInputComponent) globalSearchWidget: SearchInputComponent;
  @ViewChild(Table) grid: Table;

  @Input() currentLazyRows: GeoGridRow[] = [];
  @Input() gridStats: GeoGridStats;
  @Input() multiSelectFilterValues: Record<string, string[]> = {};
  @Input() set additionalColumns(value: ActiveTypedGridColumn<GeoGridRow>[]) {
    this.appendAudiences(value);
  }

  @Output() onGridLoad = new EventEmitter<LazyLoadEvent>();
  @Output() onZoomGeo = new EventEmitter<string>();
  @Output() onDeleteGeo = new EventEmitter<number>();
  @Output() onGeoSelection = new EventEmitter<{ geocodes: string[], newActiveFlag: boolean }>();
  @Output() onColumnSelection = new EventEmitter<{ columns: ActiveTypedGridColumn<GeoGridRow>[] }>();
  @Output() onExportCsv = new EventEmitter<GeoGridStats>();

  // Grid Column Variables
  public defaultColumns: ActiveTypedGridColumn<GeoGridRow>[] = [
    // @formatter:off
    { field: 'isActive',            header: null,              width: '3rem',   filterType: 'bool',    isActive: true, unsorted: true, isStatic: true },
    { field: 'delete',              header: null,              width: '3rem',   isPlaceHolder: true,   isActive: true, unsorted: true, isStatic: true },
    { field: 'locationNumber',      header: 'Number',          width: '5rem',   filterType: null,      isActive: true, sortType: 'locNum', isStatic: true, searchable: true },
    { field: 'locationName',        header: 'Name',            width: '8rem',   filterType: null,      isActive: true, searchable: true },
    { field: 'locationMarket',      header: 'Market',          width: '8rem',   filterType: 'multi',   isActive: true, searchable: true },
    { field: 'locationAddress',     header: 'Address',         width: '14rem',  filterType: null,      isActive: true, searchable: true },
    { field: 'locationCity',        header: 'City',            width: '9rem',   filterType: 'multi',   isActive: true, searchable: true },
    { field: 'locationState',       header: 'State',           width: '4rem',   filterType: 'multi',   isActive: true, searchable: true },
    { field: 'locationZip',         header: 'ZIP',             width: '4rem',   filterType: null,      isActive: true, searchable: true },
    { field: 'isMustCover',         header: 'Must Cover',      width: '4rem',   filterType: 'bool',    isActive: true, unsorted: true, boolInfo: BooleanDisplayTypes.OneZero },
    { field: 'isHomeGeo',           header: 'Home Geo',        width: '4rem',   filterType: 'bool',    isActive: true, unsorted: true, boolInfo: BooleanDisplayTypes.OneZero },
    { field: 'distance',            header: 'Dist',            width: '4rem',   filterType: 'numeric', isActive: true, sortType: 'number', digitsInfo: '1.2-2', subTotalType: SubTotalTypes.AverageOnly },
    { field: 'geocode',             header: 'Geocode',         width: '9rem',   filterType: null,      isActive: true, isStatic: true, searchable: true },
    { field: 'geoName',             header: 'Geo City, State', width: '10rem',  filterType: null,      isActive: true, searchable: true },
    { field: 'hhc',                 header: 'HHC',             width: '7rem',   filterType: 'numeric', isActive: true, sortType: 'number', digitsInfo: '1.0-0', subTotalType: SubTotalTypes.Total },
    { field: 'hhcAllocated',        header: 'HHC Allocated',   width: '7rem',   filterType: 'numeric', isActive: true, sortType: 'number', digitsInfo: '1.0-0', subTotalType: SubTotalTypes.AllocatedTotal },
    { field: 'cpm',                 header: 'CPM',             width: '5.5rem', filterType: 'numeric', isActive: true, sortType: 'number', isCurrency: true,    subTotalType: SubTotalTypes.AverageOnly },
    { field: 'investment',          header: 'Inv',             width: '7rem',   filterType: 'numeric', isActive: true, sortType: 'number', isCurrency: true,    subTotalType: SubTotalTypes.Total },
    { field: 'investmentAllocated', header: 'Inv Allocated',   width: '7rem',   filterType: 'numeric', isActive: true, sortType: 'number', isCurrency: true,    subTotalType: SubTotalTypes.AllocatedTotal },
    { field: 'ownerGroup',          header: 'Owner Group',     width: '7rem',   filterType: 'multi',   isActive: true, searchable: true },
    { field: 'coverageDescription', header: 'Cov Desc',        width: '12rem',  filterType: 'multi',   isActive: true, searchable: true },
    { field: 'isPOB',               header: 'POB',             width: '4rem',   filterType: 'bool',    isActive: true, unsorted: true, boolInfo: BooleanDisplayTypes.YN },
    { field: 'dma',                 header: 'DMA',             width: '10rem',  filterType: 'multi',   isActive: true, searchable: true },
    { field: 'isInDeduped',         header: 'In Deduped',      width: '6rem',   filterType: 'bool',    isActive: true, unsorted: true, boolInfo: BooleanDisplayTypes.OneZero },
    { field: 'ownerSite',           header: 'Owner Site',      width: '6rem',   filterType: null,      isActive: true },
    // @formatter:on
  ];

  public initialSort: SortMeta[] = [
    { field: 'locationNumber', order: 1 },
    { field: 'distance', order: 1 }
  ];
  public visibleColumns: ActiveTypedGridColumn<GeoGridRow>[] = [];
  public columnOptions: SelectItem[] = [];
  public globalFields: string[];
  public dedupeGrid: boolean = false;
  public isLazyLoading$ = new BehaviorSubject(false);
  public loading$: Observable<boolean>;

  public get totalRecords() : number {
    return this.gridStats?.currentGeoCount ?? 0;
  }

  constructor(private cd: ChangeDetectorRef,
              private logger: LoggingService) {
    this.visibleColumns = Array.from(this.defaultColumns.filter(dc => dc.isActive));
    this.columnOptions = this.defaultColumns.filter(dc => !dc.isStatic && dc.isActive).map(dc => ({ label: dc.header, value: dc }));
    this.globalFields = this.defaultColumns.filter(dc => dc.searchable).map(dc => dc.field);
  }

  ngOnInit() {
    this.loading$ = this.isLazyLoading$.pipe(
      distinctUntilChanged(),
      tap(() => this.cd.markForCheck())
    );
  }

  public reset() : void {
    this.clearFilters();
    this.visibleColumns = Array.from(this.defaultColumns.filter(dc => dc.isActive));
    this.initialSort = [
      { field: 'locationNumber', order: 1 },
      { field: 'distance', order: 1 }
    ];
  }

  public load(event: LazyLoadEvent) : void {
    this.onGridLoad.emit(event);
  }

  private appendAudiences(audienceColumns: ActiveTypedGridColumn<GeoGridRow>[]) {
    this.visibleColumns = Array.from(this.defaultColumns.filter(dc => dc.isActive)).concat(audienceColumns.filter(ac => ac.isActive));
  }

  public showExportDialog() : void {
    this.onExportCsv.emit(this.gridStats);
  }

  // -----------------------------------------------------------
  // UI CONTROL EVENTS
  // -----------------------------------------------------------
  public onZoomToGeo(row: GeoGridRow) {
    if (isNotNil(row?.geocode)) this.onZoomGeo.emit(row.geocode);
  }

  public onClickDeleteGeo(row: GeoGridRow) {
    if (isNotNil(row?.ggId)) this.onDeleteGeo.emit(row.ggId);
  }

  public toggleGeoState(row: GeoGridRow) {
    if (!isEmpty(row)) this.onGeoSelection.emit({ geocodes: [row.geocode], newActiveFlag: !row.isActive });
  }

  public selectVisibleRows() : void {
    const hasActiveGeos = this.gridStats?.currentActiveGeoCount > 0;
    this.onGeoSelection.emit({ geocodes: null, newActiveFlag: !hasActiveGeos });
  }

  clearFilters() : void {
    this.globalSearchWidget.reset();
    Object.keys(this.grid.filters).forEach(fk => {
      this.setFilterValue(null, fk);
    });
    this.grid._filter();
  }

  onClickDedupeToggle(newValue: boolean) {
    this.setFilterValue(newValue ? true : null, 'isInDeduped');
    this.grid._filter();
  }

  onSelectColumnVisibility(column: ActiveTypedGridColumn<GeoGridRow>) {
    column.isActive = !column.isActive;
    this.onColumnSelection.emit({ columns: this.defaultColumns });
  }

  private setFilterValue(newValue: any, filterName: string, filterMatchMode?: string) {
    const currentFilters = this.grid.filters[filterName];
    if (isArray(currentFilters)) {
      currentFilters.forEach(f => {
        if (isNil(filterMatchMode) || (isNotNil(filterMatchMode) && f.matchMode === filterMatchMode)) {
          f.value = newValue;
        }
      });
    } else {
      if (isNil(filterMatchMode) || (isNotNil(filterMatchMode) && currentFilters.matchMode === filterMatchMode)) {
        currentFilters.value = newValue;
      }
    }
  }
}
