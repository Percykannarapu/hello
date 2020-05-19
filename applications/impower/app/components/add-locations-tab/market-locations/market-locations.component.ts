import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FormConfig } from '@val/common';
import { AppEditSiteService } from 'app/services/app-editsite.service';
import { SelectItem, SortMeta } from 'primeng/api';
import { ErrorNotification } from '@val/messaging';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import { FullAppState } from '../../../state/app.interfaces';
import { resetNamedForm, updateNamedForm } from '../../../state/forms/forms.actions';
import { MarketLocationForm } from '../../../state/forms/forms.interfaces';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { AppLoggingService } from 'app/services/app-logging.service';

class ContainerValue {
  id:    number;
  code:  string;
  name:  string;
  state: string;
  isActive: boolean;

  constructor(data: Partial<ContainerValue>) {
    Object.assign(this, data);
  }
}

@Component({
  selector: 'val-market-locations',
  templateUrl: './market-locations.component.html',
  styleUrls: ['./market-locations.component.scss']
})
export class MarketLocationsComponent implements OnInit {

  @Input() showLoadButtons: boolean;
  @Output() submitSite = new EventEmitter<ValGeocodingRequest>();

  private readonly geoContainerLookupUrl = 'v1/targeting/base/geoinfo/geocontainerlookup';

  @ViewChild('containersGrid', { static: true }) public _containersGrid: Table;
    
  // Data Observables
  public containerValuesBS$ = new BehaviorSubject<ContainerValue[]>([]);
  public containerValues$: Observable<Partial<ContainerValue>[]>;
  public containerValuesSelected$: Observable<Partial<ContainerValue>[]>;
  
  // Form and form component data
  marketLocationFormGroup: FormGroup;
  marketTypeItems: SelectItem[];
  stateItems: SelectItem[];

  // Grid Variables
  public containerGridColumns: any[] =
    [{field: 'state', header: 'state', width: '5em',   styleClass: '', filterMatchMode: 'contains' },
     {field: 'id',    header: 'Id',    width: '10em',  styleClass: '', filterMatchMode: 'contains' },
     {field: 'code',  header: 'Code',  width: '10em',  styleClass: '', filterMatchMode: 'contains' },
     {field: 'name',  header: 'Name',  width: '', styleClass: '', filterMatchMode: 'contains' },
    ];  
  public selectedColumns: any[] = [];
  public columnOptions: SelectItem[] = [];

  // Grid filter UI variables
  public  headerFilter: boolean;
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

  constructor(private fb: FormBuilder,
              private appEditSiteService: AppEditSiteService,
              private store$: Store<FullAppState>,
              private restService: RestDataService,
              private logger: AppLoggingService) { }

  ngOnInit() {
    const formSetup: FormConfig<MarketLocationForm> = {
      number: '', //['', Validators.required],
      states: '',
      market: '' //['', Validators.required]
    };
    this.marketLocationFormGroup = this.fb.group(formSetup, { updateOn: 'blur' });

    this.marketTypeItems = [
      {label: 'DMA',                   value: 'DMA'},
      {label: 'Pricing Market',        value: 'PRICING'},
      {label: 'Wrap Zone - Primary',   value: 'WRAPID'},
//    {label: 'Wrap Zone - Secondary', value: 'WRAPID2'},
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

    /*this.impLocationService.storeObservable.subscribe(locations => {
      this.createLabelDropdown(locations);
    });*/

    this.initializeGridState();

    this.populateStatesDropdown();
  }

  private initializeGridState() {
    // Set initial value of the header check box
    this.syncHeaderFilter();

    // Initialize the default sort order
    this.multiSortMeta = [];
    this.multiSortMeta.push({field: 'loc.locationNumber', order: 1});
  }

  clear() : void {
    console.log('clear fired');    
    this.store$.dispatch(resetNamedForm({ path: 'marketLocation' }));
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.marketLocationFormGroup.get(controlKey);
    return false;
    // return (control.dirty || control.touched) && (control.errors != null);
  }

  onSubmit(formData: any) {
    console.log('onSubmit Fired - formData: ' + formData);    
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
          this.stateItems = [
            {label: 'Michigan',              value: 'MI'},
            {label: 'Indiana',               value: 'IN'},
            {label: 'Louisiana',             value: 'LA'}
          ];
          this.stateItems = [];
          for (let i = 0; i < containerValues.length; i++)
          {
            console.log('States: ' + containerValues[i].state + ' - ' + containerValues[i].name);
            this.stateItems.push({label: containerValues[i].name, value: containerValues[i].state});
          }
        }
      },
      err => this.logger.error.log('There was an error retrieving the states Data', err)
    );
  }

  private getContainerData(container: string) : Observable<ContainerValue[]> {
    console.log('getContainerData fired - container: ' + container);    
    const lookupUrl = `${this.geoContainerLookupUrl}/${container}`;
    return this.restService.get(lookupUrl).pipe(
        tap(r => console.log('result: ' + r)),
        map((result: any) => result.payload.rows || []),
        map(data => data.map(result => new ContainerValue(result)))
    );
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the location isActive flag.
   * If one site is inactive, then the header checkbox is unselected.  If all sites are selected, its checked.
   */
  public syncHeaderFilter() {
    if (this._containersGrid.filteredValue != null)
      this.headerFilter = !this._containersGrid.filteredValue.some(container => container.isActive === false);
    else
      this.headerFilter = !this._containersGrid._value.some(container => container.isActive === false);
  }

  // Grid events
  public onRowSelect(event: any, isSelected: boolean) {
    console.log('onRowSelect fired - event: ' + event + ', isSelected: ' + isSelected);    
  }

  onSelectContainer(container: ContainerValue) {
    console.log('onSelectContainer fired - container: ' + container);    
    //this.onToggleLocations.emit({sites: [site], isActive: site.isActive});
    //this.setHasSelectedSites();
  }

  onFilter(event: any)
  {
    console.log('onFilter fired - event: ' + event);    
    if (event != null) {
      //this.syncHeaderFilter();
    }
  }

  /**
   * Returns the appropriate tooltip for activating / deactivating a site or competitor
   *
   * @param loc The location whose isActive flag is being toggled
   */
  getSelectionTooltip(container: ContainerValue) : string {
    return 'container tooltip';
    //return (container == null) ? null : ((container.isActive) ? 'Visibly Turn Off' : 'Visibly Turn On') + ' ' + this.selectedListType;
  }

  getSelectionMessage() : string {
    return 'selection message';
    //const numDeSelected = this.currentAllSitesBS$.getValue().length - this.currentAllSitesBS$.getValue().filter(site => site.isActive).length;
    //return (numDeSelected > 0) ? 'Only visible sites will appear in the map below' : null;
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
    // if (this.lovFilters)
    //   this.lovFilters.forEach(lov => {
    //     lov.clearFilter();
    //   });

    // Reset the grid and grid filters
    this._containersGrid.reset();
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
