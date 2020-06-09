import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FormConfig, mapArray, distinctArray } from '@val/common';
import { SelectItem, SortMeta } from 'primeng/api';
import { ErrorNotification } from '@val/messaging';
import { FullAppState } from '../../state/app.interfaces';
import { resetNamedForm, updateNamedForm } from '../../state/forms/forms.actions';
import { MarketGeosForm  } from '../../state/forms/forms.interfaces';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { AppLoggingService } from 'app/services/app-logging.service';
import { MultiSelect } from 'primeng/multiselect';
import { AppStateService } from 'app/services/app-state.service';
import { MultiselectInputComponent } from '../common/multiselect-input/multiselect-input.component';

class ContainerValue {
  id:       number;
  code:     string;
  name:     string;
  state:    string;
  isActive: boolean;
  geocodes: string[];

  constructor(data: Partial<ContainerValue>) {
    Object.assign(this, data);
    this.isActive = false;
  }

  public toString = () => JSON.stringify(this, null, '   ');
}

// Service response interfaces
interface GetGeosForContainerResponse {
  geocode:   string;
  state:     string;
  county:    string;
  dma:       string;
  cbsa:      string;
  infoscan:  string;
  scantrack: string;
  wrapMktId: number;
}

interface MarketGeos {
  market: string;
  values: ContainerValue[];
}

export function statesValidator(control: AbstractControl) : { [key: string] : boolean } | null {
  this.logger.info.log('statesValidator fired:  control: '); // + control);
  return {'states': true };
  // if (control.value !== undefined && (isNaN(control.value) || control.value < 18 || control.value > 45)) {
  //   return { 'states': true };
  // }
  // return null;
}

@Component({
  selector: 'val-market-geos',
  templateUrl: './market-geos.component.html',
  styleUrls: ['./market-geos.component.scss']
})
export class MarketGeosComponent implements OnInit {
  // Constants
  private readonly geoContainerLookupUrl = 'v1/targeting/base/geoinfo/geocontainerlookup';
  private readonly getGeosForContainerUrl = 'v1/targeting/base/geoinfo/getGeosForContainer';

  @Input()  showLoadButtons: boolean;
  @Output() onGetGeos = new EventEmitter<any>();
  @Output() onGeosRetrieved = new EventEmitter<MarketGeos>();
  @Output() onError = new EventEmitter<any>();

  @ViewChild('containersGrid', { static: true }) public _containersGrid: Table;
  @ViewChild('msStates', { static: true }) public _statesMultiSelect: MultiselectInputComponent;

  // Get grid filter components to clear them
  @ViewChildren('filterMs') msFilters: QueryList<MultiSelect>;

  // Data Observables
  public containerValuesBS$ = new BehaviorSubject<ContainerValue[]>([]);
  public containerValues$: Observable<Partial<ContainerValue>[]>;
  public containerValuesSelected$: Observable<Partial<ContainerValue>[]>;

  // Observables for unique values to filter on in the grid
  public  uniqueState$: Observable<SelectItem[]>;
  public  uniqueMarket$: Observable<SelectItem[]>;

  // Track unique values for text variables for filtering
  public  uniqueTextVals: Map<string, SelectItem[]> = new Map();

  private selectedMarket: string;
  private selectedStates: string[];

  // Form and form component data
  marketGeosFormGroup: FormGroup;
  marketTypeItems: SelectItem[];
  stateItems: SelectItem[];
  containerValues: ContainerValue[];

  //selectedState: SelectItem;
  selectedContainer: SelectItem;

  // Grid Variables
  public containerGridColumns: any[] =
    [{field: 'state', header: 'State', width: '5em',   styleClass: '', filterMatchMode: 'contains' },
     {field: 'id',    header: 'Id',    width: '10em',  styleClass: '', filterMatchMode: 'contains' },
     {field: 'code',  header: 'Code',  width: '10em',  styleClass: '', filterMatchMode: 'contains' },
     {field: 'name',  header: 'Name',  width: '',      styleClass: '', filterMatchMode: 'contains' },
    ];
  public selectedColumns: any[] = [];
  public columnOptions: SelectItem[] = [];

  // Selection variables
  public  hasSelectedValues: boolean = false;
  public  numSelectedValues: number = 0;

  // Grid filter UI variables
  public  headerFilter: boolean = false;
  public  defaultLabel: string = 'All';
  private filterAllIcon = 'fa fa-check-square';
  private filterSelectedIcon = 'fa fa-check-square-o';
  private filterDeselectedIcon = 'fa fa-square';
  private filterAllTip = 'Selected & Deselected';
  private filterSelectedTip = 'All Selected';
  private filterDeselectedTip = 'All Deselected';

  // Filter selected rows
  public  isSelectedFilterState: string = this.filterAllIcon;
  public  isSelectedToolTip: string = this.filterAllTip;
  public  globalSearch: string;

  // Control table cell / header wrapping
  private tableWrapOn: string = 'val-table val-tbody-wrap';
  private tableWrapOff: string = 'val-table val-tbody-nowrap';
  public  tableWrapStyle: string = this.tableWrapOff;
  public  tableWrapIcon: string = 'ui-icon-menu';

  // Control table sorting
  public  multiSortMeta: Array<SortMeta>;

  public  isFetchingData: boolean = false;
  public  isFetchingGeos: boolean = false;
  public  canCreate: boolean = false;
  public  mustPickState: boolean = false;

  constructor(private fb: FormBuilder,
              private appStateService: AppStateService,
              private store$: Store<FullAppState>,
              private restService: RestDataService,
              private logger: AppLoggingService) { }

  ngOnInit() {
    const formSetup: FormConfig<MarketGeosForm> = {
      states: ['', null], // statesValidator],
      market: ['', Validators.required],
      counts: ['', Validators.min(1)]
    };
    this.marketGeosFormGroup = this.fb.group(formSetup); // , { updateOn: 'blur' });

    this.marketTypeItems = [
      {label: 'DMA',                   value: 'DMA'},
      {label: 'Pricing Market',        value: 'PRICING'},
      {label: 'Wrap Zone - Primary',   value: 'WRAP'},
//    {label: 'Wrap Zone - Secondary', value: 'WRAP2'},
//    {label: 'SDM',                   value: 'SDM'},
      {label: 'CBSA',                  value: 'CBSA'},
      {label: 'Infoscan',              value: 'INFOSCAN'},
      {label: 'Scantrack',             value: 'SCANTRACK'},
      {label: 'County',                value: 'COUNTY'},
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
      map((AllValues) => AllValues.filter(value => value != null && value.isActive)),
      tap(selectedValues => {
         this.logger.debug.log('Setting containerValuesSelected$ - count: ' + (selectedValues == null ? 'null' : selectedValues.length));
      }));

    // Enables the creation of locations when values are selected
    this.containerValuesSelected$.subscribe(vals => {
      let count = 0;
      vals.forEach(val => {
        count++;
      });
      this.canCreate = (count > 0 && !this.marketGeosFormGroup.invalid) ? true : false;
    });

    // Create an observable for unique states (By helper methods)
    this.uniqueState$ = this.containerValues$.pipe(
      mapArray(containerValue => containerValue.state),
      distinctArray(),
      map(arr => arr.sort()),
      mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    this.initializeGridState();
    this.populateStatesDropdown();
  }

  private initializeGridState() {
    // Set initial value of the header check box
    this.headerFilter = false;

    // Initialize the default sort order
    this.multiSortMeta = [];
    this.multiSortMeta.push({field: 'col.code', order: 1});
  }

  clear() : void {
    this._statesMultiSelect.clearSelection();
    this.store$.dispatch(resetNamedForm({ path: 'marketGeos' }));
    this.onClickResetFilters();
    this.onSelectContainerValues(false);
    this.selectedStates = null;
    this.populateContainerValues(this.selectedMarket);
  }

  getGeographies() : void {
    const markets: string [] = [];
    const selectedMarkets: ContainerValue[] = this.containerValuesBS$.getValue().filter(cv => cv.isActive);

    selectedMarkets.forEach(val => {
      //console.log('val = ' + val);
      //markets.push(['WRAP', 'WRAP2'].includes(this.selectedMarket) ? val.id.toString() : val.code);
      markets.push(val.code);
    });

    if (markets.length == 0)
      return;

    this.onGetGeos.emit({ container: this.selectedMarket, markets: markets });

    const inputData = {
      chunks: 1,
      geocodes: markets,
      container: this.selectedMarket,
      analysisLevel: this.appStateService.analysisLevel$.getValue()
    };
    this.isFetchingGeos = true;
    this.restService.post(this.getGeosForContainerUrl, [inputData])
      .pipe(
        catchError((err) => {
          this.logger.error.log('Error posting to ' + this.getGeosForContainerUrl);
          this.logger.error.log('payload:', inputData);
          this.logger.error.log('err:', err);
          this.reportError('Error Getting Geos For Markets', 'No geos were returned for the selected markets', err);
          this.onError.emit({ returnCode: 400, issues: { ERROR: ['No geos were returned for the selected markets'] }});
          return throwError('No geos were returned for the selected markets');
        })
      ).subscribe(results => {
          this.isFetchingGeos = false;
          if (results != null && results.returnCode == 200) {
            const containerGeos: GetGeosForContainerResponse[] = results.payload['rows'] as GetGeosForContainerResponse[];
this.logger.info.log('payload rows', results.payload['rows']);
            // Assign geos to the market they belong to
            // Note: If multiple market types were ever sent to the service, you could get a market you didn't ask for, this filter would fix that
            selectedMarkets.forEach(market => {
              market.geocodes = containerGeos.filter(geo => {
                switch (inputData.container)
                {
                  case 'DMA':       return market.code === geo.dma;
                  case 'PRICING':   return market.code === geo.dma;  // TODO: fixme
                  case 'WRAP':      return market.id   === geo.wrapMktId;
                  case 'WRAP2':     return market.id   === geo.wrapMktId;
                  case 'SDM':       return market.code === geo.dma;  // TODO: fixme
                  case 'CBSA':      return market.code === geo.cbsa;
                  case 'INFOSCAN':  return market.code === geo.infoscan;
                  case 'SCANTRACK': return market.code === geo.scantrack;
                  case 'COUNTY':    return market.code === geo.county;
                  case 'STATE':     return market.code === geo.state;
                  default: return true;
                }
              })
              .map(resp => resp.geocode);
            });

            // Emit the results
            this.onGeosRetrieved.emit({ market: inputData.container, values: selectedMarkets });
          }
          else {
            // There was a problem, log the error
            this.logger.error.log('There was an error getting market geos. returnCode: ' + (results != null ? results.returnCode : null));

            // All unfriendly unexpected errors are logged to the developer console
            if (results.payload.issues != null && results.payload.issues.UNEXPECTED.length > 0) {
              for (let i = 0; i < results.payload.issues.UNEXPECTED.length; i++ )
                this.logger.error.log(results.payload.issues.UNEXPECTED[i], results);
            }

            // All friendly error messages are reported to the user via toast messages
            if (results.payload.issues != null && results.payload.issues.ERROR.length > 0) {
              for (let i = 0; i < results.payload.issues.ERROR.length; i++ )
                this.reportError('Error getting market geos', results.payload.issues.ERROR[i], results);
            }

            // Tell consumer components that an error has occurred
            this.onError.emit({ returnCode: results.returnCode, issues: results.payload.issues });
          }
        });
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.marketGeosFormGroup.get(controlKey);
    return false;
    // return (control.dirty || control.touched) && (control.errors != null);
  }

  onSubmit(formData: any) {
    this.marketGeosFormGroup.patchValue({id: formData.id, code: formData.code, name: formData.name, state: formData.state});
    console.log('onSubmit Fired');
    console.log('formData: ' + formData['market']);
    this.selectedMarket = formData['market'];
    this.selectedStates = formData['states'];
//    this.query(formData['market']);
    this.populateContainerValues(formData['market']);
    this.onClickResetFilters();
    // this.syncHeaderFilter();
    this.headerFilter = false;
  }

  public populateStatesDropdown() {
    this.getContainerData('state').subscribe(containerValues => {
      if (containerValues == null)
        this.logger.warn.log('No state information returned');
      else
        if (containerValues.length === 0)
          this.store$.dispatch(new ErrorNotification({ message: 'No States Found To Populate Dropdown'}));
        else {
          this.stateItems = [];
          for (let i = 0; i < containerValues.length; i++)
            this.stateItems.push({label: containerValues[i].name, value: containerValues[i].state});
        }
      },
      err => this.logger.error.log('There was an error retrieving the states data', err)
    );
  }

  public isValidContainer(container: string) : boolean {
    return this.marketTypeItems.map(marketItem => marketItem.value).includes(container.toUpperCase());
  }

  public populateContainerValues(container: string) {
    if (container == null)
      return;

    if (!this.isValidContainer(container))
    {
      this.reportError('Unexpected error populating container values', 'An invalid container was passed: (' + container + ')', null);
      return;
    }
    this.isFetchingData = true;

    this.getContainerData(container).subscribe(values => this.containerValuesBS$.next(values),
      err => {
        this.isFetchingData = false;
        this.logger.error.log('There was an error retrieving the container (' + container + ') value data\n', err);
        // Emit an empty array to get the table to stop the loading spinner
        this.containerValuesBS$.next([]);
      },
      () => this.isFetchingData = false);
  }

  // Calls a rest service to get the container values that populate the grid
  private getContainerData(container: string) : Observable<ContainerValue[]> {
    const states: string = this.selectedStates != null ? this.selectedStates.toString() : null;

    const lookupUrl = `${this.geoContainerLookupUrl}/${container}` + (states != null ? `?states=${states}` : '');
    return this.restService.get(lookupUrl).pipe(
        map((result: any) => result.payload.rows || []),
        map(data => data.map(result => new ContainerValue(result)))
    );
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the overall isActive flag.
   * If one row is inactive, then the header checkbox is unselected.  If all rows are selected, its checked.
   */
  public syncHeaderFilter() {
    if (this._containersGrid.filteredValue != null)
      this.headerFilter = this._containersGrid.filteredValue.length > 0
                          ? !this._containersGrid.filteredValue.some(container => container.isActive === false)
                          : false;
    else
      this.headerFilter = this._containersGrid._value != null && this._containersGrid._value.length > 0
                          ? !this._containersGrid._value.some(container => container.isActive === false)
                          : false;
  }

  setHasSelectedSites() : boolean {
    this.numSelectedValues = this.containerValuesBS$.getValue().filter(containerValue => containerValue.isActive).length;
    this.syncHeaderFilter();
    return this.hasSelectedValues =  this.numSelectedValues > 0;
  }

  // Grid events
  public onRowSelect(event: any, isSelected: boolean) {
    console.log('onRowSelect fired - event: ' + event + ', isSelected: ' + isSelected);
  }

  onSelectContainerValue(container: ContainerValue) {
    this.containerValuesBS$.value.find(cv => cv.code === container.code).isActive = container.isActive;
    this.containerValuesBS$.next(this.containerValuesBS$.value);
    this.setHasSelectedSites();
  }

  onSelectContainerValues(newIsActive: boolean) {
    const hasFilters = this.hasFilters();
    const containerValues: ContainerValue[] = this.containerValuesBS$.getValue().filter(containerValue => !hasFilters
      || (this._containersGrid.filteredValue.filter(gridValue => gridValue.code === containerValue.code)).length > 0);

    // Set the new isActive value for the container values
    containerValues.forEach(containerValue => containerValue.isActive = newIsActive);

    // Broadcast the changes
    this.containerValuesBS$.next(this.containerValuesBS$.value);

    this.setHasSelectedSites();
  }

  onFilter(event: any)
  {
    console.log('onFilter fired - event: ' + event);
    //if (event != null) {
      this.syncHeaderFilter();
    //}
  }

  // When the market drop down changes values, clear everything out
  onMarketChange(event: any) {
    this.logger.info.log('onMarketChange event: ', event);
    this.clear();
    this.containerValuesBS$.next([]);
  }

  // When the states multiselect changes values
  onStatesChange(event: any) {
    this.logger.info.log('onStatesChange fired - event: ', event);
  }

  /**
   * Returns the appropriate tooltip for activating / deactivating a site or competitor
   *
   * @param loc The location whose isActive flag is being toggled
   */
  getSelectionTooltip(container: ContainerValue) : string {
    return (container == null) ? null : ((container.isActive) ? 'Deselect ' + container.code : 'Select ' + container.code);
  }

  getSelectionMessage() : string {
    const numSelected = this.containerValuesBS$.getValue().length - this.containerValuesBS$.getValue().filter(value => value.isActive).length;
    return numSelected +  '/' + this.containerValuesBS$.getValue().length + ' container values selected';
  }

  /**
   * Performs a three way toggle that filters the grid by selection (isActive)
   * 1) Show selected and deselected,  2) Selected only,  3) Deselected only
   */
  onFilterBySelection()
  {
    let filterVal: boolean = true;
    switch (this.isSelectedFilterState) {
      case this.filterSelectedIcon:
        this.isSelectedFilterState = this.filterDeselectedIcon;
        this.isSelectedToolTip = this.filterDeselectedTip;
        filterVal = false;
        break;

      case this.filterDeselectedIcon:
        this.isSelectedFilterState = this.filterAllIcon;
        this.isSelectedToolTip = this.filterAllTip;
        filterVal = null;
        break;

      default:
        this.isSelectedFilterState = this.filterSelectedIcon;
        this.isSelectedToolTip = this.filterSelectedTip;
        filterVal = true;
        break;
    }
    if (this._containersGrid.rows > 0) {
      this._containersGrid.filter(filterVal, 'container.isActive', 'equals');
    }
  }

  // Returns true if the grid has a filter applied
  hasFilters() : boolean
  {
    return (this._containersGrid.filteredValue != null && this._containersGrid.filteredValue.length > 0);
  }

  // Switches the header level select checkbox tooltip based on if a filter is applied
  getHeaderSelectTooltip() : string
  {
    return (this.headerFilter ? 'Deselect' : 'Select') +
           (this.hasFilters() ? ' all markets in the filtered list' : ' all markets');
  }

  // Clears out the filters from the grid and reset the filter components
  onClickResetFilters()
  {
    // Clear the multi select filters
    if (this.msFilters)
      this.msFilters.forEach(ms => {
        ms.value = null;
        ms.valuesAsString = this.defaultLabel;
      });

    // Reset the grid and grid filters
    this._containersGrid.reset();
    this.globalSearch = '';
    this.onFilter(null);
  }

  // Used to toggle the gizmo icon and styles used to turn word wrapping on and off in the grid
  public onToggleTableWrap() {
    if (this.tableWrapStyle === this.tableWrapOn) {
      this.tableWrapStyle = this.tableWrapOff;
      this.tableWrapIcon = 'ui-icon-menu';
    }
    else {
      this.tableWrapStyle = this.tableWrapOn;
      this.tableWrapIcon = 'ui-icon-wrap-text';
    }
  }

  // Shuts down spinners and reports an error to the user via toast message
  private reportError(errorHeader: string, errorMessage: string, errorObject: any) {
    this.isFetchingData = false;
    this.isFetchingGeos = false;
    this.store$.dispatch(new ErrorNotification({ message: errorMessage, notificationTitle: errorHeader, additionalErrorInfo: errorObject }));
  }

}
