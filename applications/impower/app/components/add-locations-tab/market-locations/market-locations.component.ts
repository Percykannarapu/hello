import { Component, EventEmitter, Input, OnInit, Output, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FormConfig, mapArray, distinctArray } from '@val/common';
import { AppEditSiteService } from 'app/services/app-editsite.service';
import { SelectItem, SortMeta } from 'primeng/api';
import { ErrorNotification } from '@val/messaging';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import { FullAppState } from '../../../state/app.interfaces';
import { resetNamedForm, updateNamedForm } from '../../../state/forms/forms.actions';
import { MarketLocationForm } from '../../../state/forms/forms.interfaces';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap, filter, startWith } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { AppLoggingService } from 'app/services/app-logging.service';
import { MultiSelect } from 'primeng/multiselect';

class ContainerValue {
  id:    number;
  code:  string;
  name:  string;
  state: string;
  isActive: boolean;

  constructor(data: Partial<ContainerValue>) {
    Object.assign(this, data);
    this.isActive = false;
  }

  public toString = () => JSON.stringify(this, null, '   ');
}

@Component({
  selector: 'val-market-locations',
  templateUrl: './market-locations.component.html',
  styleUrls:  ['./market-locations.component.scss']
})
export class MarketLocationsComponent implements OnInit {

  @Input() showLoadButtons: boolean;
  @Output() submitSite = new EventEmitter<ValGeocodingRequest>();

  private readonly geoContainerLookupUrl = 'v1/targeting/base/geoinfo/geocontainerlookup';

  @ViewChild('containersGrid', { static: true }) public _containersGrid: Table;

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
  
  // Form and form component data
  marketLocationFormGroup: FormGroup;
  marketTypeItems: SelectItem[];
  stateItems: SelectItem[];
  containerValues: ContainerValue[];

  selectedState: SelectItem;
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
  private selectedValuesBS$ = new BehaviorSubject<ContainerValue[]>([]);
  public  hasSelectedValues: boolean = false;
  public  numSelectedValues: number = 0;

  // Grid filter UI variables
  public  headerFilter: boolean;
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

  // Control table cell / header wrapping
  private tableWrapOn: string = 'val-table val-tbody-wrap';
  private tableWrapOff: string = 'val-table val-tbody-nowrap';
  public  tableWrapStyle: string = this.tableWrapOff;
  public  tableWrapIcon: string = 'ui-icon-menu';

  // Control table sorting
  public  multiSortMeta: Array<SortMeta>;

  public  isFetchingData: boolean = false;
  public  canCreate: boolean = false;

  constructor(private fb: FormBuilder,
              private appEditSiteService: AppEditSiteService,
              private store$: Store<FullAppState>,
              private restService: RestDataService,
              private logger: AppLoggingService) { }

  ngOnInit() {
    const formSetup: FormConfig<MarketLocationForm> = {
      number: ['', Validators.required],
      states: '',
      market: ['', Validators.required],
      counts: ['', Validators.min(1)]
    };
    this.marketLocationFormGroup = this.fb.group(formSetup); //, { updateOn: 'blur' });

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
    this.stateItems = [
      {label: 'Michigan',              value: 'MI'},
      {label: 'Indiana',               value: 'IN'},
      {label: 'Louisiana',             value: 'LA'}
    ];
    
    // Observe the behavior subjects on the input parameters
 /*   this.allGeos$ = this.impGeofootprintGeosBS$.asObservable().pipe(startWith(null as []));

    this.onListTypeChange('Site');

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.failures$ = combineLatest([this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$]).pipe(
        map(([sites, competitors]) => [...sites, ...competitors])
      );
      this.hasFailures$ = this.appLocationService.hasFailures$;
      this.totalCount$ = this.appLocationService.totalCount$;
    });*/

    for (const column of this.containerGridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }

    this.containerValues$ = this.containerValuesBS$.asObservable();
    this.containerValuesSelected$ = this.containerValues$.pipe(
      map((AllValues) => AllValues.filter(value => value != null && value.isActive)),
      tap(selectedValues => {
         console.log('Setting containerValuesSelected$ - count: ' + (selectedValues == null ? 'null' : selectedValues.length));
         //this.syncHeaderFilter();
         //this.headerFilter = false;
        //  this._containersGrid.filteredValue
        //  this._containersGrid._value 
      }));


    this.containerValues$.subscribe(vals => {
      let numSelected = 0;
      let count = 0;
      vals.forEach(val => {
        numSelected += val.isActive ? 1 : 0;
        count++;
      });
      console.log('this.containerValues$.subscribe - count: ' + count + ', selected: ' + numSelected);
    });
    
    this.containerValuesSelected$.subscribe(vals => {
      // console.log('this.containerValuesSelected$.subscribe values'); // = ' + (vals == null ? 'null' : vals.toString()));
      // vals.forEach(val => console.log(val.isActive + ': ' + val.code + ' - ' + val.name));
      let numSelected = 0;
      let count = 0;
      vals.forEach(val => {
        numSelected += val.isActive ? 1 : 0;
        count++;
      });
      this.canCreate = (count > 0 && !this.marketLocationFormGroup.invalid) ? true : false;
      console.log('this.containerValuesSelected$.subscribe - count: ' + count + ', selected: ' + numSelected);
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
//    this.syncHeaderFilter();
    this.headerFilter = false;

    // Initialize the default sort order
    this.multiSortMeta = [];
    this.multiSortMeta.push({field: 'col.code', order: 1});
  }

  clear() : void {
    console.log('clear fired');    
    this.store$.dispatch(resetNamedForm({ path: 'marketLocation' }));
  }

  query(market: string) : void {
    console.log('query fired');
//    const market = this.marketLocationFormGroup.value['market'].value;
    console.log('market: ' + market);    
    
    this.populateContainerValues(market);
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.marketLocationFormGroup.get(controlKey);
    return false;
    // return (control.dirty || control.touched) && (control.errors != null);
  }

  onSubmit(formData: any) {
    this.marketLocationFormGroup.patchValue({id: formData.id, code: formData.code, name: formData.name, state: formData.state});
    console.log('onSubmit Fired');
    console.log('formData: ' + formData['market']);
    this.query(formData['market']);
    this.onClickResetFilters();
    // this.syncHeaderFilter();
    this.headerFilter = false;
    /*
    if (formData.coord != null && formData.coord !== '') {
      formData.latitude = formData.coord.split(',')[0];
      formData.longitude = formData.coord.split(',')[1];
    } else {
      formData.latitude = '';
      formData.longitude = '';
    }
    delete formData.coord;
    this.submitSite.emit(new ValGeocodingRequest(formData));*/
  }

  private loadData(formData: MarketLocationForm) {
    console.log('loadData fired for formData: ' + formData);
    
    //this.store$.dispatch(updateNamedForm({ path: 'marketLocation', formData }));
  }

  private getData(container: string) { // : Observable<Partial<RestResponse>> {
    const query = `${this.geoContainerLookupUrl}/${container}`;
    this.containerValues$ = this.restService.get(query).pipe(
      map((result) => result.payload.rows as Partial<ContainerValue>[]),
      tap((result) =>     this.isFetchingData = false)
    );
  }

  public populateStatesDropdown() {
    this.getContainerData('state').subscribe(containerValues => {
      if (containerValues == null)
        console.log('### No state information returned');
      else
        if (containerValues.length === 0) {
          this.store$.dispatch(new ErrorNotification({ message: 'No States Found'}));
        } else {
          //const foundItems = items.filter(filterByFields(searchTerm, ['projectId', 'projectName', 'targetor']));
          //this.currentTrackerSuggestions.next(foundItems);
          this.stateItems = [];
          for (let i = 0; i < containerValues.length; i++)
          {
            //console.log('States: ' + containerValues[i].state + ' - ' + containerValues[i].name);
            this.stateItems.push({label: containerValues[i].name, value: containerValues[i].state});
          }
        }
      },
      err => this.logger.error.log('There was an error retrieving the states Data', err)
    );
  }

  public populateContainerValues(container: string) {
    if (container == null || container === '') // TODO: replace with isValidContainer 
    {
      console.log('Invalid container passed: ' + container);
      return;      
    }
    this.isFetchingData = true;

    // this.containerValues$ = this.getContainerData(container).pipe(tap(
    //   containerValues => console.log(containerValues.toString().substr(1, 99)) 
    // ));

    this.getContainerData(container).subscribe(values => this.containerValuesBS$.next(values),
      err => {
        this.isFetchingData = false;
        this.logger.error.log('There was an error retrieving the container (' + container + ') value data\n', err);
        // Emit an empty array to get the table to stop the loading spinner
        this.containerValuesBS$.next([]);
      },
      () => this.isFetchingData = false);
    //this.containerValues$.subscribe(data => console.log('data: ' + data));
     /*.subscribe(containerValues => {
      if (containerValues == null)
        console.log('### No information returned for container: ' + container);
      else        
        if (containerValues.length === 0) {
          this.store$.dispatch(new ErrorNotification({ message: 'No data found for container: ' + container}));
        } else {
          //const foundItems = items.filter(filterByFields(searchTerm, ['projectId', 'projectName', 'targetor']));
          //this.currentTrackerSuggestions.next(foundItems);
          this.containerValues = containerValues;*/
/*         this.containerValues = [];
          for (let i = 0; i < containerValues.length; i++)
          {
            console.log('Container Value: ' + containerValues[i].state + ' - ' + containerValues[i].name);
            this.stateItems.push(new ContainerValue {label: containerValues[i].name, value: containerValues[i].state});
          }*/
 /*       }
      },
      err => this.logger.error.log('There was an error retrieving the states Data', err)
    );*/
  }

  private getContainerData(container: string) : Observable<ContainerValue[]> {
    console.log('getContainerData fired - container: ' + container);    
    const lookupUrl = `${this.geoContainerLookupUrl}/${container}`;
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
    console.log('syncHeaderFilter: ' + this.headerFilter);
    
    if (this._containersGrid.filteredValue != null)
    {
     // this._containersGrid.filteredValue.forEach(val => console.log('FILTERED VAL: ' + val));
      console.log('FILTERED HAS SOME INACTIVE: ' + this._containersGrid.filteredValue.some(container => container.isActive === false));
      console.log('FILTERED HAS ALL ACTIVE:    ' + !this._containersGrid.filteredValue.some(container => container.isActive === false));
    }
    else
    {
      console.log('containersGrid all count:    ' + this._containersGrid._value.length);
      console.log('containersGrid active count: ' + this._containersGrid._value.filter(cv => cv.isActive).length);      
      // this._containersGrid._value.forEach(val => console.log('VAL: ' + val));
    }
    console.log('syncHeaderFilter: header checked: ' + this.headerFilter);
    
  }

  setHasSelectedSites() : boolean {
    this.numSelectedValues = this.containerValuesBS$.getValue().filter(containerValue => containerValue.isActive).length;
  //  this.selectedValuesBS$.next(this.containerValuesBS$.getValue().filter(containerValue => containerValue.isActive));
    this.syncHeaderFilter();
    return this.hasSelectedValues =  this.numSelectedValues > 0;
  }

  // Grid events
  public onRowSelect(event: any, isSelected: boolean) {
    console.log('onRowSelect fired - event: ' + event + ', isSelected: ' + isSelected);    
  }

  onSelectContainer(container: ContainerValue) {
    console.log('onSelectContainer fired - container: ' + container);    
    //this.onToggleLocations.emit({sites: [site], isActive: site.isActive});
    this.containerValuesBS$.value.find(cv => cv.code === container.code).isActive = container.isActive;
    this.containerValuesBS$.next(this.containerValuesBS$.value);
    this.setHasSelectedSites();
  }

  onSelectContainers(newIsActive: boolean) {
    const hasFilters = this.hasFilters();
    console.log('onSelectContainers fired - newIsActive: ' + newIsActive + ', hasFilters: ' + hasFilters);
    const containerValues: ContainerValue[] = this.containerValuesBS$.getValue().filter(site => !hasFilters
      || (this._containersGrid.filteredValue.filter(flatSite => flatSite.code === site.code)).length > 0);    

    //filteredValues.forEach(containerValue => console.log(containerValue));
    console.log('container values count: ' + containerValues.length);
    console.log('container before active: ' + this.containerValuesBS$.value.filter(val => val.isActive).length);    
    containerValues.forEach(containerValue => containerValue.isActive = newIsActive);
    console.log('container after  active: ' + this.containerValuesBS$.value.filter(val => val.isActive).length);

    this.containerValuesBS$.next(this.containerValuesBS$.value);

    //this.onToggleLocations.emit({sites: filteredSites, isActive: newIsActive});
    this.setHasSelectedSites();
//    this._containersGrid.toggleRowsWithCheckbox(null, newIsActive);
//    this.containerValuesBS$.next(filteredValues);
/*
    this.containerValuesBS$.getValue().filter(site => !hasFilters || 
                                                      (this._containersGrid.filteredValue.filter(flatSite => flatSite.code === site.code)).length > 0)
       .forEach(value => {
         console.log('setting value: ' + value.code + ' to isActive = ' + newIsActive);         
         value.isActive = newIsActive;
       });*/
//       this.syncHeaderFilter();
  }

  onFilter(event: any)
  {
    console.log('onFilter fired - event: ' + event);    
    //if (event != null) {
      this.syncHeaderFilter();
    //}
  }

  /**
   * Returns the appropriate tooltip for activating / deactivating a site or competitor
   *
   * @param loc The location whose isActive flag is being toggled
   */
  getSelectionTooltip(container: ContainerValue) : string {
    return (container == null) ? null : ((container.isActive) ? 'Visibly Turn Off' : 'Visibly Turn On'); //FIXME: + ' ' + this.selectedListType;
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

  // Switches the select button label and tooltip based on if a filter is applied
  getSelectButtonText(asLabel: boolean) : string
  {
    return (asLabel) ? this.hasFilters() ? 'Filtered' : 'All'
                     : this.hasFilters() ? 'Select all market values in the filtered list' : 'Select all market values';
  }

  //Clears out the filters from the grid and reset the filter components
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
    this.onFilter(null);
  }

  /**
   * Used to toggle the gizmo icon and styles used to turn word wrapping on and off in the grid
   */
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

}
