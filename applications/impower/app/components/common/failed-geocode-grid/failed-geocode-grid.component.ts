import { BehaviorSubject } from 'rxjs';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, OnInit, ViewChildren, QueryList, ViewChild, ViewEncapsulation } from '@angular/core';
import { AppLocationService } from 'app/services/app-location.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';
import { SelectItem } from 'primeng/components/common/selectitem';
import { SortMeta, ConfirmationService } from 'primeng/api';
import { TableFilterLovComponent } from '../table-filter-lov/table-filter-lov.component';
import { Table } from 'primeng/table';

export interface GeocodeFailureGridField {
  seq: number;
  field: string;
  header: string;
  width: string;
  isEditable: boolean;
  matchMode: string;
}

@Component({
  selector: 'val-failed-geocode-grid',
  templateUrl: './failed-geocode-grid.component.html',
  styleUrls: ['./failed-geocode-grid.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class FailedGeocodeGridComponent implements OnInit {

  @Input('failedSites')
  set failedSites(val: ImpGeofootprintLocation[]) {
    this._failedSites = val;
    this._failedSites.forEach(loc => loc['coordinates'] = this.getCoordinates(loc));
    this.failedSitesBS$.next(val);
    this.setHasSelectedSites();
  }
  get failedSites() {
    // Sorting by sequence lets columns maintain position when toggled on and off
    this.selectedColumns.sort((a, b) => a.seq - b.seq);
    return this._failedSites;
  }

  @Input() totalCount: number = 0;

  @Output() resubmit = new EventEmitter<ImpGeofootprintLocation[]>();
  @Output() accept = new EventEmitter<ImpGeofootprintLocation[]>();
  @Output() remove = new EventEmitter<ImpGeofootprintLocation[]>();

  gridColumns: GeocodeFailureGridField[] = [
    { seq:  1, field: 'locationNumber',       header: 'Number',        width: '5em',  isEditable: false, matchMode: 'contains' },
    { seq:  2, field: 'origAddress1',         header: 'Address',       width: '14em', isEditable: true,  matchMode: 'contains' },
    { seq:  3, field: 'origCity',             header: 'City',          width: '9em',  isEditable: true,  matchMode: 'contains' },
    { seq:  4, field: 'origState',            header: 'State',         width: '3em',  isEditable: true,  matchMode: 'contains' },
    { seq:  5, field: 'origPostalCode',       header: 'ZIP',           width: '4em',  isEditable: true,  matchMode: 'contains' },
    { seq:  6, field: 'coordinates',          header: 'XY',            width: '10em', isEditable: true,  matchMode: 'contains' },
    { seq:  7, field: 'recordStatusCode',     header: 'Status',        width: '6em',  isEditable: false, matchMode: 'contains' },
    { seq:  8, field: 'geocoderMatchCode',    header: 'Match Code',    width: '4em',  isEditable: false, matchMode: 'contains' },
    { seq:  9, field: 'geocoderLocationCode', header: 'Location Code', width: '8em',  isEditable: false, matchMode: 'contains' },
    { seq: 10, field: 'locationName',         header: 'Name',          width: '15em', isEditable: false, matchMode: 'contains' },
    { seq: 11, field: 'marketName',           header: 'Market',        width: '15em', isEditable: true,  matchMode: 'contains' },
  ];

  // Track unique values for text variables for filtering
  public  uniqueTextVals: Map<string, SelectItem[]> = new Map();
  private failedSitesBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private selectedSitesBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  public  selectedLov = [{isActive: true}, {isActive: false}];
  public  hasSelectedSites: boolean = false;
  public  numSelectedSites: number = 0;

  // Get the grid as a view child to attach custom filters
  @ViewChild('failureGrid', { static: true }) public _failureGrid: Table;

  // Get grid filter components to clear them
  @ViewChildren(TableFilterLovComponent) lovFilters: QueryList<TableFilterLovComponent>;

  private _failedSites: ImpGeofootprintLocation[] = [];
  private edited = new Set<ImpGeofootprintLocation>();
  public  defaultLabel: string = 'All';

  public  selectedColumns: any[] = [];
  public  columnOptions: SelectItem[] = [];
  public  multiSortMeta: SortMeta[] = [];

  // Control table cell / header wrapping
  private tableWrapOn: string = 'val-table val-tbody-wrap';
  private tableWrapOff: string = 'val-table val-tbody-nowrap';
  public  tableWrapStyle: string = this.tableWrapOff;
  public  tableWrapIcon: string = 'ui-icon-menu';
  public  tableHdrSlice: boolean = false;

  // Grid filter UI variables
  private filterAllIcon = 'fa fa-check-square';
  private filterSelectedIcon = 'fa fa-check-square-o';
  private filterDeselectedIcon = 'fa fa-square';
  private filterAllTip = 'Selected & Deselected';
  private filterSelectedTip = 'All Selected';
  private filterDeselectedTip = 'All Deselected';

  // Filter selected rows
  public  isSelectedFilterState: string = this.filterAllIcon;
  public  isSelectedToolTip: string = this.filterAllTip;
  
  constructor(private appLocationService: AppLocationService,
              private confirmationService: ConfirmationService,
              private impGeofootprintLocationService: ImpGeofootprintLocationService) {}

  ngOnInit() {
    // Column Picker Model
    for (const column of this.gridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }

    // Default sort
    this.multiSortMeta.push({field: 'locationNumber', order: 1});

    // Initially deactivate failed sites
    this.failedSitesBS$.getValue().forEach(site => site.isActive = false);

    // Initially deselect in the grid
    this.selectedSitesBS$.next([]);

    this.failedSitesBS$.subscribe(sites => {
      this.hasSelectedSites = (sites.filter(site => site.isActive).length > 0);
    });
  }

  canBeAccepted(site: ImpGeofootprintLocation) : boolean {
    return site.recordStatusCode !== 'ERROR' && site.recordStatusCode !== '';
  }

  setHasSelectedSites() : boolean {
    this.numSelectedSites = this.failedSitesBS$.getValue().filter(site => site.isActive).length;
    this.selectedSitesBS$.next(this.failedSitesBS$.getValue().filter(site => site.isActive));
    return this.hasSelectedSites =  this.numSelectedSites > 0;
  }

  getCoordinates(site: ImpGeofootprintLocation) : string {
    const lineBreak = '\r\n';
    if (site.ycoord == null || site.xcoord == null) {
      return '';
    } else {
      return `${site.ycoord},${lineBreak}${site.xcoord}`;
    }
  }

  setCoordinates(event: any, site: ImpGeofootprintLocation) : void {
    const enteredValue = event.target.value as string;
    if (enteredValue == null || enteredValue.length === 0) {
      site.recordStatusCode = '';
      site.geocoderMatchCode = '';
      site.geocoderLocationCode = '';
      site.xcoord = null;
      site.ycoord = null;
      this.edited.add(site);
    } else {
      const coords = enteredValue.split(',');
      if (coords.length === 2) {
        const lat = Number(coords[0]);
        const lon = Number(coords[1]);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          site.recordStatusCode = 'PROVIDED';
          site.geocoderMatchCode = '';
          site.geocoderLocationCode = '';
          site.xcoord = lon;
          site.ycoord = lat;
          this.edited.add(site);
          return;
        }
      }
    }
    event.target.value = ''; // clear the text area
  }

  private prepSiteForAccept(site: ImpGeofootprintLocation) {
    if (!this.edited.has(site)) {
      site.recordStatusCode = 'SUCCESS';
    }
    if (site.recordStatusCode === 'PROVIDED') {
      const existingSite = this.impGeofootprintLocationService.get().filter(l => l.locationNumber == site.locationNumber);
      this.appLocationService.deleteLocations(existingSite);
    }
    const locAttribs = site.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA')[0];

    if (locAttribs != null && !(/^\d{4}$/.test(locAttribs.attributeValue) || /^\d{3}$/.test(locAttribs.attributeValue))) {
      site.impGeofootprintLocAttribs.filter(attr => attr.attributeCode === 'Home DMA Name')[0].attributeValue = '';
    }
  }

  onAccept(site: ImpGeofootprintLocation) : void {
    this.prepSiteForAccept(site);
    this.accept.emit([site]);
  }

  onAcceptSelected() : void {
    const selectedSites = this.failedSitesBS$.getValue().filter(site => site.isActive);
    selectedSites.forEach(site => {
      this.prepSiteForAccept(site);
    });
    this.accept.emit(selectedSites);
  }

  onResubmitSelected() : void {
    const selectedSites = this.failedSitesBS$.getValue().filter(site => site.isActive);
    this.resubmit.emit(selectedSites);
  }

  onRemoveSelected() : void {
    const selectedSites = this.failedSitesBS$.getValue().filter(site => site.isActive);
    if (selectedSites.length > 0) {    
    this.confirmationService.confirm({
      message: 'Are you sure you wish to delete the ' + selectedSites.length + ' selected locations?',
      header: 'Delete All Selected Locations',
      accept: () => {
          this.remove.emit(selectedSites);
        }
      });
    }
  }

  openGoogleMap(site: ImpGeofootprintLocation) : void {
    const googleMapUri = `https://www.google.com/maps/place/${site.origAddress1},${site.origCity},${site.origState},${site.origPostalCode}`;
    const strWindowFeatures = 'height=1000px,width=1000px';
    window.open(googleMapUri, '_blank', strWindowFeatures);
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the geos.isActive flag.
   * If one geo is inactive, then the header checkbox is unselected.  If all geos are selected, its checked.
   */
  public syncHeaderFilter() {
    /*
    if (this._failureGrid.filteredValue != null)
       this.headerFilter = !this._failureGrid.filteredValue.some(flatGeo => flatGeo.geo.isActive === false);
    else
       this.headerFilter = !this._failureGrid._value.some(site => site.isActive === false);
       */
  }

  public applyHeaderFilter() {
    /*
    if (this._failureGrid.filteredValue != null)
       this.onSetFilteredGeos.emit({value: this.headerFilter, geos: this._failureGrid.filteredValue.map(flatGeo => flatGeo.geo)});
    else
      this.onSetAllGeos.emit({value: this.headerFilter});
      */
  }

  // Sets isActive to true for all sites
  onSelectSites(value: boolean) : void {
    const failedSites = this.failedSitesBS$.getValue();
    const hasFilters  = this.hasFilters();
    failedSites.forEach(site => {
      if (!hasFilters || this._failureGrid.filteredValue.includes(site))
        site.isActive = value;        
    });
    this.setHasSelectedSites();
  }

  onFilterSelected()
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
     if (this._failureGrid.rows > 0) {
       this._failureGrid.filter(filterVal, 'isActive', 'equals');
//       this.onForceRedraw.emit();
     }
//     this.onForceRedraw.emit();
  }

  //Clears out the filters from the grid and reset the filter components
  onClickResetFilters()
  {
    // Clear the multi select filters
    if (this.lovFilters)
      this.lovFilters.forEach(lov => {
        lov.clearFilter();
      });

    // Reset the grid and grid filters
    this._failureGrid.reset();
  }

  /**
   * Used to toggle the gizmo icon and styles used to turn word wrapping on and off in the grid
   */
  public onToggleTableWrap() {
    if (this.tableWrapStyle === this.tableWrapOn) {
      this.tableWrapStyle = this.tableWrapOff;
      this.tableWrapIcon = 'ui-icon-menu';
      //this.tableHdrSlice = true;  // Disabled to turn toggling of header wrapping off
    }
    else {
      this.tableWrapStyle = this.tableWrapOn;
      this.tableWrapIcon = 'ui-icon-wrap-text';
      //this.tableHdrSlice = false;
    }
  }

  // Table-Filter-LOV events
  onFilterRemoved(field: string) {
    //console.log('### onFilterRemoved - removed filter for field:', field);
  }

  onFilterShow(field: string) {
    //console.log('### onFilterShow - field', field);
  }

  onFilterHide(field: string) {
    //console.log('### onFilterHide - field', field);
  }

  // Returns true if the grid has a filter applied
  hasFilters() : boolean
  {
    return (this._failureGrid.filteredValue != null && this._failureGrid.filteredValue.length > 0);
  }

  // Switches the select button label and tooltip based on if a filter is applied
  getSelectButtonText(asLabel: boolean) : string
  {
    return (asLabel) ? this.hasFilters() ? 'Filtered' : 'All'
                     : this.hasFilters() ? 'Select all locations in the filtered list' : 'Select all locations';
  }
}
