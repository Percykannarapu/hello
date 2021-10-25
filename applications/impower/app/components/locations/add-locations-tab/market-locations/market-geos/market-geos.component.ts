import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { CommonSort, distinctArray, FormConfig, mapArray } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { AppLoggingService } from 'app/services/app-logging.service';
import { SelectItem, SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { BehaviorSubject, Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { ServiceError } from '../../../../../../worker-shared/data-model/core.interfaces';
import { TypedGridColumn } from '../../../../../../worker-shared/data-model/custom/grid';
import { ContainerValue } from '../../../../../../worker-shared/data-model/other/market-geo.model';
import { MarketGeoService } from '../../../../../services/market-geo.service';
import { FullAppState } from '../../../../../state/app.interfaces';
import { resetNamedForm } from '../../../../../state/forms/forms.actions';
import { MarketGeosForm } from '../../../../../state/forms/forms.interfaces';
import { MultiselectInputComponent } from '../../../../common/multiselect-input/multiselect-input.component';
import { SearchInputComponent } from '../../../../common/search-input/search-input.component';

interface MarketGeos {
  market: string;
  values: ContainerValue[];
}

export function marketValidator(control: AbstractControl) : { } | null
{
  //console.log('marketValidator fired:  control: ', control);
  let valid: boolean = control.value != null && control.value !== '';
  if (control.parent != null)
  {
    const numStates = control.parent.controls['states'].value != null ? control.parent.controls['states'].value.length : 0;
    //console.log('current market: ', control.parent.controls['market'].value, ' states: ', numStates);
    switch (control.parent.controls['market'].value)
    {
      case 'CITY':
      case 'COUNTY':
        valid = numStates > 0;
        break;
      case 'STATE':
        valid = numStates <= 1;
        break;
    }
  }
  //console.log ('marketValidator - valid: ', valid);
  return valid ? null : { marketValidator: { valid: 'Must pick at least one state for this market' }};
}

export function statesValidator(control: AbstractControl) : { } | null
{
  //console.log('statesValidator fired:  control: ', control);
  let valid: boolean = true;
  if (control != null && control.parent != null)
  {
    const market = control.parent.controls['market'].value;
    //console.log('current market: ', market, ', states: ', control.value);
    switch (market)
    {
      case 'CITY':
      case 'COUNTY':
        valid = control.value != null ? control.value.length > 0 : false;
        break;
      // case 'STATE':
      //   valid = control.value != null ? control.value.length <= 1 : false;
      //   break;
    }
    if (valid) {
      marketValidator(control.parent.controls['market']);
      if (control.dirty)
        control.markAllAsTouched();
    }
  }
  //console.log ('statesValidator - valid: ', valid);
  return valid ? null : { statesValidator: { valid: 'statesValidator failed' }};
}

@Component({
  selector: 'val-market-geos',
  templateUrl: './market-geos.component.html',
})
export class MarketGeosComponent implements OnInit {

  @Input()  showLoadButtons: boolean;
  @Output() onGetGeos = new EventEmitter<any>();
  @Output() onGeosRetrieved = new EventEmitter<MarketGeos>();
  @Output() onError = new EventEmitter<any>();

  @ViewChild('containersGrid', { static: true }) public containersGrid: Table;
  @ViewChild('msStates', { static: true }) public statesMultiSelect: MultiselectInputComponent;

  // Data Observables
  public containerValuesBS$ = new BehaviorSubject<ContainerValue[]>([]);
  public containerValues$: Observable<ContainerValue[]>;
  public containerValuesSelected$: Observable<ContainerValue[]>;

  // Observables for unique values to filter on in the grid
  public uniqueState$: Observable<SelectItem<string>[]>;

  public allContainerValuesCount$: Observable<number>;
  public activeContainerValuesCount$: Observable<number>;

  private selectedMarket: string;
  private selectedStates: string[];

  // Form and form component data
  marketGeosFormGroup: FormGroup;
  marketTypeItems: SelectItem[];
  stateItems: SelectItem<string>[];
  containerValues: ContainerValue[];

  // Grid Variables
  public containerGridColumns: TypedGridColumn<ContainerValue>[] = [
    {field: 'isActive', header: null,    width: '5%',  filterType: 'boolean', tooltip: 'Filter by selection' },
    {field: 'state',    header: 'State', width: '20%', filterType: 'stateMulti' },
    {field: 'id',       header: 'Id',    width: '20%', filterType: 'text' },
    {field: 'code',     header: 'Code',  width: '20%', filterType: 'text' },
    {field: 'name',     header: 'Name',  width: '35%', filterType: 'text' },
  ];
  public selectedColumns: TypedGridColumn<ContainerValue>[] = [];
  public columnOptions: SelectItem[] = [];

  // Selection variables
  public  hasSelectedValues: boolean = false;

  // Grid filter UI variables
  public  allVisibleRowsSelected: boolean = false;

  // Control table sorting
  public  multiSortMeta: SortMeta[] = [];

  public  isFetchingData: boolean = false;
  public  isFetchingGeos: boolean = false;

  public trackByKey = (index: number, container: ContainerValue) => container.gridKey;

  private tapError = (err: ServiceError<any>) => this.reportError(err);

  constructor(private fb: FormBuilder,
              private marketService: MarketGeoService,
              private store$: Store<FullAppState>,
              private logger: AppLoggingService) { }

  ngOnInit() {
    const formSetup: FormConfig<MarketGeosForm> = {
      states: ['', statesValidator], // null],
      market: ['', marketValidator], // Validators.required],
      counts: ['', Validators.min(1)]
    };
    this.marketGeosFormGroup = this.fb.group(formSetup); // , { updateOn: 'blur' });

    this.marketTypeItems = [
      {label: 'DMA',                   value: 'DMA'},
      {label: 'Pricing Market',        value: 'PRICING'},
      {label: 'Wrap Zone - Primary',   value: 'WRAP'},
    //{label: 'Wrap Zone - Secondary', value: 'WRAP2'},
    //{label: 'SDM',                   value: 'SDM'},
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

    // Observe the container values behavior subject for all and selected values
    this.containerValues$ = this.containerValuesBS$.asObservable();
    this.containerValuesSelected$ = this.containerValues$.pipe(
      map(allValues => allValues?.filter(value => value?.isActive)),
      tap(selectedValues => {
        this.setHeaderSelectedState();
        this.logger.debug.log('Setting containerValuesSelected$ - count: ' + (selectedValues == null ? 'null' : selectedValues.length));
      })
    );
    this.allContainerValuesCount$ = this.containerValues$.pipe(map(s => s?.length ?? 0));
    this.activeContainerValuesCount$ = this.containerValuesSelected$.pipe(map(s => s?.length ?? 0));

    // Create an observable for unique states (By helper methods)
    this.uniqueState$ = this.containerValues$.pipe(
      mapArray(containerValue => containerValue.state),
      distinctArray(),
      map(arr => arr.sort()),
      mapArray(str => ({ label: str, value: str} as SelectItem<string>))
    );

    // setup initial sort order
    this.multiSortMeta.push({field: 'name', order: 1});
    this.multiSortMeta.push({field: 'code', order: -1});

    this.populateStatesDropdown();
  }

  resetFiltersAndSelections() {
    this.selectVisibleRows(false);
  }

  clearStates() {
    this.statesMultiSelect.clearSelection();
    this.selectedStates = null;
    this.marketGeosFormGroup.controls['states'].patchValue(null);
    this.onStatesChange();
  }

  clear() : void {
    this.store$.dispatch(resetNamedForm({ path: 'marketGeos' }));
    this.resetFiltersAndSelections();
    this.clearStates();
  }

  getGeographies() : void {
    const markets = this.containerValuesBS$.getValue().reduce((a, c) => {
      if (c.isActive) a.push(c.gridKey);
      return a;
    }, [] as string[]);
    const selectedMarketTypeItem = this.marketTypeItems.filter(item => item.value == this.selectedMarket)[0];
    this.onGetGeos.emit({ container: this.selectedMarket, containerName: selectedMarketTypeItem.label, markets: markets });
    this.marketService.getGeographies(markets, this.selectedMarket).pipe(
      tap({ error: this.tapError })
    ).subscribe(result => {
      const emittedValues = this.containerValuesBS$.getValue().reduce((a, c) => {
        if (c.isActive) {
          a.push({ ...c, geocodes: result[c.gridKey] });
        }
        return a;
      }, [] as ContainerValue[]);
      this.onGeosRetrieved.emit({ market: this.selectedMarket, values: emittedValues });
    });
  }

  onSubmit(formData: any) {
    this.marketGeosFormGroup.patchValue({id: formData.id, code: formData.code, name: formData.name, state: formData.state});
    this.selectedMarket = formData['market'];
    this.selectedStates = formData['states'];
    this.populateContainerValues(formData['market']);
  }

  private populateStatesDropdown() {
    this.marketService.getContainerData('state').pipe(
      tap({ next: value => {
          if ((value?.length ?? 0) === 0) this.store$.dispatch(ErrorNotification({ message: 'No States Found To Populate Dropdown'}));
        }, error: this.tapError })
    ).subscribe(containerValues => this.stateItems = containerValues?.map(cv => ({ label: cv.name, value: cv.state })));
  }

  private populateContainerValues(container: string) {
    if (container == null) return;
    this.isFetchingData = true;
    const states: string = this.selectedStates?.join(',');
    this.marketService.getContainerData(container, states).pipe(
      finalize(() => this.isFetchingData = false),
      tap({ error: err => {
          this.reportError(err);
          this.containerValuesBS$.next([]);
        }})
    ).subscribe(values => this.containerValuesBS$.next(values.sort(this.defaultSort)));
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the overall isActive flag.
   * If one row is inactive, then the header checkbox is unselected.  If all rows are selected, its checked.
   */
  public setHeaderSelectedState() {
    const valuesToConsider: ContainerValue[] = this.containersGrid?.filteredValue ?? this.containerValuesBS$.getValue();
    this.allVisibleRowsSelected = valuesToConsider.every(c => c.isActive);
  }

  onSelectContainerValue() {
    this.containerValuesBS$.next(this.containerValuesBS$.value);
  }

  selectVisibleRows(isSelected: boolean) {
    const valuesToConsider: ContainerValue[] = this.containersGrid?.filteredValue ?? this.containerValuesBS$.getValue();

    // Set the new isActive value for the container values
    valuesToConsider.forEach(containerValue => containerValue.isActive = isSelected);

    // Broadcast the changes
    this.containerValuesBS$.next(this.containerValuesBS$.value);
  }

  onFilter()
  {
    this.setHeaderSelectedState();
  }

  // When the market drop down changes values, clear everything out
  onMarketChange() {
    this.clearStates();
    this.resetFiltersAndSelections();
    this.containerValuesBS$.next([]);
  }

  // When the states multiselect changes values
  onStatesChange() {
    this.marketGeosFormGroup.controls['market'].updateValueAndValidity();
  }

  clearFilters(table: Table, searchWidget: SearchInputComponent) : void {
    const currentSort = Array.from(this.multiSortMeta ?? []);
    table.reset();
    searchWidget.reset();
    this.multiSortMeta = currentSort;
  }

  // Shuts down spinners and reports an error to the user via toast message
  private reportError(err: ServiceError<any>) {
    const message = err.message ?? 'There was an unspecified error during Market Geo processing';
    this.isFetchingData = false;
    this.isFetchingGeos = false;
    this.store$.dispatch(ErrorNotification({ message, notificationTitle: 'Error processing Market Geos', additionalErrorInfo: err }));
    this.onError.emit({ returnCode: err.response?.returnCode, issues: err.response?.payload?.issues });
  }

  public defaultSort (a: ContainerValue, b: ContainerValue) : number {
    return CommonSort.NullableString(a?.name, b?.name)
        || CommonSort.NullableString(a?.code, b?.code)
        || CommonSort.NullableNumber(a?.id, b?.id);
  }
}
