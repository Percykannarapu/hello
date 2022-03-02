import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormConfig } from '@val/common';
import { SearchInputComponent } from 'app/components/common/search-input/search-input.component';
import { AppLoggingService } from 'app/services/app-logging.service';
import { AppStateService } from 'app/services/app-state.service';
import { MarketGeosForm } from 'app/state/forms/forms.interfaces';
import { SelectItem, SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { TypedGridColumn } from 'worker-shared/data-model/custom/grid';
import { ContainerValue } from 'worker-shared/data-model/other/market-geo.model';

export interface GetGeosEvent {
  container: string;
  containerName: string;
  markets: string[];
}

export interface GetGridDataEvent {
  market?: string;
  stateFilters?: string[];
  clearGrid?: boolean;
}

export interface RowSelectionEvent {
  row: ContainerValue | ContainerValue[];
  newActiveFlag: boolean;
}

@Component({
  selector: 'val-market-geos',
  templateUrl: './market-geos.component.html',
})
export class MarketGeosComponent implements OnInit {

  @ViewChild(SearchInputComponent) globalSearchWidget: SearchInputComponent;
  @ViewChild(Table) grid: Table;

  @Input() isFetchingData: boolean;
  @Input() isFetchingGeos: boolean;
  @Input() allStates: SelectItem<string>[];
  @Input() containerValues: ContainerValue[];
  @Input() gridUniqueStates: SelectItem<string>[];
  @Input() currentActiveRowCount: number = 0;

  @Output() onGetGeos = new EventEmitter<GetGeosEvent>();
  @Output() onGetGridData = new EventEmitter<GetGridDataEvent>();
  @Output() onRowSelection = new EventEmitter<RowSelectionEvent>();

  private selectedMarket: string;
  private selectedStates: string[];

  // Form and form component data
  marketGeosFormGroup: FormGroup;
  marketTypeItems: SelectItem[];

  // Grid Variables
  public containerGridColumns: TypedGridColumn<ContainerValue>[] = [
    {field: 'isActive', header: null,    width: '5%',  filterType: 'boolean', tooltip: 'Filter by selection', unsorted: true },
    {field: 'state',    header: 'State', width: '20%', filterType: 'stateMulti' },
    {field: 'id',       header: 'Id',    width: '20%', filterType: 'text' },
    {field: 'code',     header: 'Code',  width: '20%', filterType: 'text' },
    {field: 'name',     header: 'Name',  width: '35%', filterType: 'text' },
  ];
  public selectedColumns: TypedGridColumn<ContainerValue>[] = [];
  public columnOptions: SelectItem[] = [];

  // Grid filter UI variables
  public  allVisibleRowsSelected: boolean = false;

  // Control table sorting
  public  multiSortMeta: SortMeta[] = [];

  public trackByKey = (index: number, container: ContainerValue) => container.gridKey;

  constructor(private fb: FormBuilder,
              private stateService: AppStateService,
              private logger: AppLoggingService) { }

  ngOnInit() {
    this.stateService.clearUI$.subscribe(() => this.clear());
    const formSetup: FormConfig<MarketGeosForm> = {
      states: [null],
      market: [null, Validators.required]
    };
    this.marketGeosFormGroup = this.fb.group(formSetup);

    this.marketTypeItems = [
      {label: 'DMA',                   value: 'DMA'},
      {label: 'Pricing Market',        value: 'PRICING'},
      {label: 'Wrap Zone - Primary',   value: 'WRAP'},
      {label: 'CBSA',                  value: 'CBSA'},
      {label: 'Infoscan',              value: 'INFOSCAN'},
      {label: 'Scantrack',             value: 'SCANTRACK'},
      {label: 'County',                value: 'COUNTY'},
      {label: 'City',                  value: 'CITY'},
      {label: 'State',                 value: 'STATE'}
    ];

    // Prepare the grid columns
    for (const column of this.containerGridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }

    this.setupDefaultSort();
  }

  private setupDefaultSort() : void {
    this.multiSortMeta = [
      {field: 'name', order: 1},
      {field: 'code', order: -1}
    ];
  }

  public onInputChange() : void {
    this.selectedMarket = this.marketGeosFormGroup.controls['market'].value;
    this.selectedStates = this.marketGeosFormGroup.controls['states'].value;
  }

  public clear() : void {
    this.clearFilters();
    this.onGetGridData.emit({ clearGrid: true });
    this.marketGeosFormGroup.patchValue({ states: null, market: null });
    this.onInputChange();
  }

  public getGeographies() : void {
    const markets = this.containerValues.reduce((a, c) => {
      if (c.isActive) a.push(c.gridKey);
      return a;
    }, [] as string[]);
    const selectedMarketTypeItem = this.marketTypeItems.filter(item => item.value == this.selectedMarket)[0];
    this.onGetGeos.emit({ container: this.selectedMarket, containerName: selectedMarketTypeItem.label, markets });
  }

  public onSubmit(formData: FormConfig<MarketGeosForm>) : void {
    this.selectedMarket = formData['market'];
    this.selectedStates = formData['states'];
    this.onGetGridData.emit({ market: this.selectedMarket, stateFilters: this.selectedStates });
  }

  public toggleRowState(row?: ContainerValue) : void {
    const visibleRows: ContainerValue[] = this.grid?.filteredValue ?? this.containerValues;
    const hasActiveGeos = row?.isActive ?? this.allVisibleRowsSelected;
    this.onRowSelection.emit({ row: row ?? visibleRows, newActiveFlag: !hasActiveGeos });
    this.setHeaderSelectedState();
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the overall isActive flag.
   * If one row is inactive, then the header checkbox is unselected.  If all rows are selected, its checked.
   */
  public setHeaderSelectedState() {
    const valuesToConsider: ContainerValue[] = this.grid?.filteredValue ?? this.containerValues;
    this.allVisibleRowsSelected = valuesToConsider.every(c => c.isActive);
  }

  public onFilter() {
    this.setHeaderSelectedState();
  }

  public clearFilters() : void {
    this.globalSearchWidget.reset();
    this.grid.reset();
    this.setupDefaultSort();
    this.setHeaderSelectedState();
  }
}
