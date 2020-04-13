import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { Store } from '@ngrx/store';
import { filterArray, resolveFieldData } from '@val/common';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintLocAttribService } from 'app/val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ConfirmationService, SelectItem, SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppLocationService } from '../../services/app-location.service';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';
import { ExportHGCIssuesLog } from '../../state/data-shim/data-shim.actions';
import { ReCalcHomeGeos } from '../../state/homeGeocode/homeGeo.actions';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { TableFilterLovComponent } from '../common/table-filter-lov/table-filter-lov.component';

export class FlatSite {
  fgId: number;
  loc: ImpGeofootprintLocation;
  totalHHC: number;
  totalAllocatedHHC: number;
}

@Component({
  selector: 'val-site-list',
  templateUrl: './site-list.component.html',
  styleUrls: ['./site-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteListComponent implements OnInit {
  first: number = 0;

  @Input('impGeofootprintLocations')
    set locations(val: ImpGeofootprintLocation[]) {
      this.allLocationsBS$.next(val);
  }

  @Input('impGeofootprintLocAttribs')
    set locationAttribs(val: ImpGeofootprintLocAttrib[]) {
      this.allLocationAttribsBS$.next(val);
  }

  @Input('allClientLocations')
    set allClientLocations(val: ImpGeofootprintLocation[]) {
      this.allClientLocationsBS$.next(val || []);
  }

  @Input('activeClientLocations')
    set activeClientLocations(val: ImpGeofootprintLocation[]) {
      this.activeClientLocationsBS$.next(val);
  }

  @Input('allCompetitorLocations')
    set allCompetitorLocations(val: ImpGeofootprintLocation[]) {
      this.allCompetitorLocationsBS$.next(val);
  }

  @Input('activeCompetitorLocations')
    set activeCompetitorLocations(val: ImpGeofootprintLocation[]) {
      this.activeCompetitorLocationsBS$.next(val);
  }

  @Input('impGeofootprintGeos')
    set impGeofootprintGeos(val: ImpGeofootprintGeo[]) {
      this.impGeofootprintGeosBS$.next(val);
  }

  @Output()
  onToggleLocations: EventEmitter<{sites: ImpGeofootprintLocation[], isActive: boolean}> = new EventEmitter<{sites: null, isActive: false}>();

  @Output()
  onDeleteLocations: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  onDeleteAllLocations: EventEmitter<string> = new EventEmitter<string>();

  @Output()
  onMakeDirty: EventEmitter<any> = new EventEmitter<any>();

  @Output()
  onZoomToLocation: EventEmitter<ImpGeofootprintLocation> = new EventEmitter<ImpGeofootprintLocation>();

  @Output()
  editLocations = new EventEmitter();

  @Output()
  resubmitFailedGrid = new EventEmitter();

  // Get grid filter components to clear them
  @ViewChildren(TableFilterLovComponent) lovFilters: QueryList<TableFilterLovComponent>;

  // Input Behavior subjects
  private allLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private allLocationAttribsBS$ = new BehaviorSubject<ImpGeofootprintLocAttrib[]>([]);
  private allClientLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private activeClientLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private allCompetitorLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private activeCompetitorLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private impGeofootprintGeosBS$ = new BehaviorSubject<ImpGeofootprintGeo[]>([]);

  public selectedListType: 'Site' | 'Competitor';
  public currentAllSitesBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  public currentAllSites$: Observable<ImpGeofootprintLocation[]>;
  public currentActiveSites$: Observable<ImpGeofootprintLocation[]>;

  public allSiteCount$: Observable<number>;
  public activeSiteCount$: Observable<number>;

  hasFailures$: Observable<boolean>;
  failures$: Observable<ImpGeofootprintLocation[]>;
  totalCount$: Observable<number>;

  public allGeos$: Observable<ImpGeofootprintGeo[]>;

  // Observables for flattened rows of locations and attributes
  public flatAllSites$: Observable<FlatSite[]>;
  public flatActiveSites$: Observable<FlatSite[]>;

  public columnOptions: SelectItem[] = [];
  public labelType: string = 'Site Label';
  public labelOptions: SelectItem[] = [];
  public selectedLabel: string;

  public flatSiteGridColumns: any[] =
    [{field: 'locationNumber',       header: 'Number',              width: '7em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'locationName',         header: 'Name',                width: '20em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'locAddress',           header: 'Address',             width: '20em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'locCity',              header: 'City',                width: '10em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'locState',             header: 'State',               width: '5em',   styleClass: 'val-text-center', filterMatchMode: 'contains' },
     {field: 'locZip',               header: 'ZIP',                 width: '7em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'marketName',           header: 'Market',              width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'marketCode',           header: 'Market Code',         width: '9em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'totalHHC',             header: 'Total HHC',           width: '8em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'totalAllocatedHHC',    header: 'Total Allocated HHC', width: '8em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'description',          header: 'Description',         width: '10em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'groupName',            header: 'Group',               width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'radius1',              header: 'Radius 1',            width: '7em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'radius2',              header: 'Radius 2',            width: '7em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'radius3',              header: 'Radius 3',            width: '7em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'ycoord',               header: 'Latitude',            width: '8em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'xcoord',               header: 'Longitude',           width: '8em',   styleClass: 'val-text-right',  filterMatchMode: 'contains' },
     {field: 'recordStatusCode',     header: 'Geocode Status',      width: '10em',  styleClass: 'val-text-center', filterMatchMode: 'contains' },
     {field: 'Home Geocode Issue',   header: 'Home Geocode Issue',  width: '5em',   styleClass: 'val-text-center', filterMatchMode: 'contains'},
     {field: 'Home Zip Code',        header: 'Home ZIP',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home ATZ',             header: 'Home ATZ',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home Digital ATZ',     header: 'Home Digital ATZ',    width: '11em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home Carrier Route',   header: 'Home PCR',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home DMA',             header: 'Home DMA',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home DMA Name',        header: 'Home DMA Name',       width: '11em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home County',          header: 'Home County',         width: '11em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'geocoderMatchCode',    header: 'Match Code',          width: '5em',   styleClass: 'val-text-center', filterMatchMode: 'contains' },
     {field: 'geocoderLocationCode', header: 'Location Code',       width: '5em',   styleClass: 'val-text-center', filterMatchMode: 'contains' },
     {field: 'origAddress1',         header: 'Original Address',    width: '20em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'origCity',             header: 'Original City',       width: '10em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'origState',            header: 'Original State',      width: '5em',   styleClass: 'val-text-center', filterMatchMode: 'contains' },
     {field: 'origPostalCode',       header: 'Original ZIP',        width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
    ];
  public flatSiteGridColumnsLength: number = this.flatSiteGridColumns.length;
  public selectedColumns: any[] = [];
  public displayData: any;
  public selectedRowData: any;
  @ViewChild('locGrid', { static: true }) public _locGrid: Table;

  public showDialog: boolean = false;

  // Selection variables
  private selectedSitesBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  public  selectedLov = [{isActive: true}, {isActive: false}];
  public  hasSelectedSites: boolean = false;
  public  numSelectedSites: number = 0;

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
  public  tableHdrSlice: boolean = false;

  // Control table sorting
  public  multiSortMeta: Array<SortMeta>;

  constructor(private appLocationService: AppLocationService,
              private confirmationService: ConfirmationService,
              private appStateService: AppStateService,
              private impLocationService: ImpGeofootprintLocationService,
              private domainFactory: ImpDomainFactoryService,
              private impLocAttributeService: ImpGeofootprintLocAttribService,
              private appProjectPrefService: AppProjectPrefService,
              private store$: Store<FullAppState>,
              private logger: LoggingService) {}

  ngOnInit() {
    // Observe the behavior subjects on the input parameters
    this.allGeos$ = this.impGeofootprintGeosBS$.asObservable().pipe(startWith(null));

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


    });

    for (const column of this.flatSiteGridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
     //this.currentAllSites$
     this.impLocationService.storeObservable.subscribe(locations => {
      this.createLabelDropdown(locations);
    });

    this.initializeGridState();

  }

  private initializeGridState() {
    // Set initial value of the header check box
    this.syncHeaderFilter();

    // Initialize the default sort order
    this.multiSortMeta = [];
    this.multiSortMeta.push({field: 'loc.locationNumber', order: 1});
  }

  manuallyGeocode(site: ValGeocodingRequest, siteType) {
    site.Group = this.selectedRowData.groupName;
    site.Description = this.selectedRowData.description;
    site.RADIUS1 = this.selectedRowData.radius1;
    site.RADIUS2 = this.selectedRowData.radius2;
    site.RADIUS3 = this.selectedRowData.radius3;
    site.previousAddress1 = this.selectedRowData.origAddress1;
    site.previousCity = this.selectedRowData.origCity;
    site.previousState = this.selectedRowData.origState;
    site.previousZip = this.selectedRowData.origPostalCode;
    this.editLocations.emit({site: site, siteType: siteType, oldData: this.selectedRowData});
  }

  public onListTypeChange(data: 'Site' | 'Competitor') {
    this._locGrid.reset();
    this.labelType = data === 'Site' ? 'Site Label' : 'Competitor Label';
    this.first = null;
    setTimeout(() => {
      this.first = 0;
    }, 0);

    this.selectedListType = data;
    this.appLocationService.siteTypeBS$.next(data);

    // Choose to set current observables to sites or competitors
    if (this.selectedListType === 'Site') {
      this.currentAllSitesBS$ = this.allClientLocationsBS$;
      this.currentAllSites$ = this.allClientLocationsBS$.asObservable();
      this.currentActiveSites$ = this.activeClientLocationsBS$.asObservable();
    }
    else {
      this.currentAllSitesBS$ = this.allCompetitorLocationsBS$;
      this.currentAllSites$ = this.allCompetitorLocationsBS$.asObservable();
      this.currentActiveSites$ = this.activeCompetitorLocationsBS$.asObservable();
    }
    this.createLabelDropdown(this.currentAllSitesBS$.value);

    this.flatAllSites$ = combineLatest(this.currentAllSites$, this.allGeos$)
                                      .pipe(map(([locs, geos]) => this.createComposite(locs, geos)));

    this.flatActiveSites$ = this.flatAllSites$.pipe(filterArray(flatLoc => flatLoc.loc.isActive === true));

    this.setCounts();
    this.initializeGridState();
  }

  public onRowSelect(event: any, isSelected: boolean) {
    this.setLocationHierarchyActiveFlag(event.data, isSelected);
  }

  public onEdit(rowFlat: FlatSite) {
    const row = rowFlat.loc;
    const locAttribs = row['impGeofootprintLocAttribs'];
    this.displayData = {
      locationNumber: row.locationNumber,
      locationName: row.locationName,
      locAddress: row.locAddress,
      locCity: row.locCity,
      locState: row.locState,
      locZip: row.locZip,
      marketName: row.marketName,
      marketCode: row.marketCode,
      coord: row.ycoord + ',' + row.xcoord,
      homeZip: locAttribs.filter(la => la.attributeCode === 'Home Zip Code').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue : '',
      homeAtz: locAttribs.filter(la => la.attributeCode === 'Home ATZ').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue : '',
      homeDigitalAtz: locAttribs.filter(la => la.attributeCode === 'Home Digital ATZ').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue : '',
      homePcr: locAttribs.filter(la => la.attributeCode === 'Home Carrier Route').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue : '',
      radius1: rowFlat['radius1'],
      radius2: rowFlat['radius2'],
      radius3: rowFlat['radius3']
    };
    this.selectedRowData = row;
    this.showDialog = true;
  }

  public onDialogHide() {
    this.showDialog = false;
    this.displayData = '';
    this.selectedRowData = '';
  }

  /**
   * When the user clicks the trashcan icon on a given location row, this prompts
   * to confirm the location deletion.
   *
   * @param row The location to delete
   */
  public onRowDelete(row: ImpGeofootprintLocation) {
    const metricText = AppLocationService.createMetricTextForLocation(row);
    this.confirmationService.confirm({
        message: 'Do you want to delete this record?',
        header: 'Delete Confirmation',
        icon: 'ui-icon-trash',
        accept: () => {
          this.onDeleteLocations.emit({locations: [row], metricText: metricText, selectedListType: this.selectedListType});
          this.logger.debug.log('remove successful');
        },
        reject: () => {
          this.logger.debug.log('cancelled remove');
        }
    });
  }

  /**
   * When the user clicks the "Delete All" button, this prompts to confirm
   * the deletion of all locations
   */
  public onDelete() {
    this.confirmationService.confirm({
        message: 'Do you want to delete all ' + this.selectedListType + 's ?',
        header: 'Delete Confirmation',
        accept: () => {
          this.onDeleteAllLocations.emit(this.selectedListType);
          this.flatSiteGridColumns.splice(this.flatSiteGridColumnsLength, Number(this.selectedColumns.length - this.flatSiteGridColumnsLength));
          this.selectedColumns.splice(this.flatSiteGridColumnsLength, Number(this.selectedColumns.length - this.flatSiteGridColumnsLength));
        }
    });
  }

  /**
   * To force recalculate all homegeocodes
   */
  public calcHomeGeocode() {
    if (this.impLocationService.get().length > 0) {
      const locations = this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || loc.clientLocationTypeCode === ImpClientLocationTypeCodes.FailedSite);
      const siteType = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(locations[0].clientLocationTypeCode));
      const reCalculateHomeGeos = true;
      const isLocationEdit =  false;
      this.store$.dispatch(new ReCalcHomeGeos({locations: locations,
                                              siteType: siteType,
                                              reCalculateHomeGeos: reCalculateHomeGeos,
                                              isLocationEdit: isLocationEdit}));
    }
  }

  /**
   * When the user clicks the "HGC Issues Log" button,
   */
  public onHGCIssuesLog() {
    const locType: SuccessfulLocationTypeCodes = this.selectedListType === 'Site' ? ImpClientLocationTypeCodes.Site : ImpClientLocationTypeCodes.Competitor;
    this.store$.dispatch(new ExportHGCIssuesLog({locationType: locType}));
  }

  /**
   * When the user clicks the "Magnifying glass" icon, this will zoom the map to that location
   * @param loc The location that to zoom the map to
   */
  public onRowZoom(loc: ImpGeofootprintLocation) {
    this.onZoomToLocation.emit(loc);
  }

  public setLocationHierarchyActiveFlag(location: FlatSite, isActive: boolean) {
    this.logger.debug.log('setLocationHierarchyActiveFlag - location:', location, ', isActive: ', isActive);
    if (location == null) {
      this.logger.debug.log('setLocationHierarchyActive flag called with null location');
      return;
    }

    location.loc.getImpGeofootprintGeos().forEach(geo => {
        geo.isActive = isActive;
    });

    location.loc.impGeofootprintTradeAreas.forEach(ta => ta.isActive = isActive);
    location.loc.impGeofootprintLocAttribs.forEach(attr => attr.isActive = isActive);
    location.loc.isActive = isActive;
    this.onMakeDirty.emit();
  }

  private setCounts() {
    // every time we change the ref to the current observable, we have to reset the mapping
    this.allSiteCount$ = this.currentAllSites$.pipe(map(s => s.length));
    this.activeSiteCount$ = this.currentActiveSites$.pipe(map(s => s.length));
  }

  createComposite(locs: ImpGeofootprintLocation[], geos?: ImpGeofootprintGeo[]) : FlatSite[] {
    let fgId = 0;
    const siteGridData: FlatSite[] = [];

    // Calculate totals per site
    const hhcMap: Map<string, number> = new Map<string, number>();
    const allocHhcMap: Map<string, number> = new Map<string, number>();

    if (geos != null) {
      geos.forEach(geo => {
        if (geo.isActive && geo.hhc >= 0) {
          hhcMap.set(geo.impGeofootprintLocation.locationNumber, (hhcMap.get(geo.impGeofootprintLocation.locationNumber) || 0) + geo.hhc);
          if (geo.rank === 0) {
            allocHhcMap.set(geo.impGeofootprintLocation.locationNumber, (allocHhcMap.get(geo.impGeofootprintLocation.locationNumber) || 0) + geo.hhc);
          }
        }
      });
    }

    locs.forEach(loc => {
      const gridSite: FlatSite = new FlatSite();
      gridSite.fgId = fgId++;
      gridSite.loc = loc;

      // Grid doesn't work well with child values.  Can use resolveFieldData in the template, but then filtering doesn't work
      this.flatSiteGridColumns.forEach(col => {
        gridSite[col.field] = resolveFieldData(loc, col.field) || '';
      });

      gridSite.totalHHC = hhcMap.get(loc.locationNumber);
      gridSite.totalAllocatedHHC = allocHhcMap.get(loc.locationNumber);

      loc.impGeofootprintLocAttribs.forEach(attribute => {
        if (attribute != null && attribute.attributeCode !== 'label'){
          gridSite[attribute.attributeCode] = attribute.attributeValue;

          const column = {'field': attribute.attributeCode, 'header': attribute.attributeCode, 'width': '10em', 'styleClass': ''};

          // If the column isn't already in the list, add it
          if (!this.flatSiteGridColumns.some(c => c.field === attribute.attributeCode))
          {
            this.flatSiteGridColumns.push(column);
            this.columnOptions.push({ label: column.header, value: column });
            this.selectedColumns.push(column);
          }
        }

      });

      gridSite['totalHHC'] = hhcMap.get(gridSite.loc.locationNumber);
      gridSite['totalAllocatedHHC'] = allocHhcMap.get(gridSite.loc.locationNumber);

      // Populate Radius fields in Manage Locations Grid
      if (loc.impGeofootprintTradeAreas.length != 0) {
          for (let i = 0; i < loc.impGeofootprintTradeAreas.length; i++) {
            if (loc.impGeofootprintTradeAreas[i].taNumber == 1) {
              gridSite['radius1'] = loc.impGeofootprintTradeAreas[i].taRadius;
            }
            if (loc.impGeofootprintTradeAreas[i].taNumber == 2) {
              gridSite['radius2'] = loc.impGeofootprintTradeAreas[i].taRadius;
            }
            if (loc.impGeofootprintTradeAreas[i].taNumber == 3) {
              gridSite['radius3'] = loc.impGeofootprintTradeAreas[i].taRadius;
            }
          }
      }
      siteGridData.push(gridSite);
    });

    return siteGridData;
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the location isActive flag.
   * If one site is inactive, then the header checkbox is unselected.  If all sites are selected, its checked.
   */
  public syncHeaderFilter() {
    if (this._locGrid.filteredValue != null)
      this.headerFilter = !this._locGrid.filteredValue.some(flatSite => flatSite.loc.isActive === false);
    else
      this.headerFilter = !this._locGrid._value.some(flatSite => flatSite.loc.isActive === false);
  }

  setHasSelectedSites() : boolean {
    this.numSelectedSites = this.allLocationsBS$.getValue().filter(site => site.isActive).length;
    this.selectedSitesBS$.next(this.allLocationsBS$.getValue().filter(site => site.isActive));
    this.syncHeaderFilter();
    return this.hasSelectedSites =  this.numSelectedSites > 0;
  }

  onSelectSite(site: ImpGeofootprintLocation) {
    this.onToggleLocations.emit({sites: [site], isActive: site.isActive});
    this.setHasSelectedSites();
  }

  onSelectSites(newIsActive: boolean) : void {
    const hasFilters = this.hasFilters();
    const filteredSites: ImpGeofootprintLocation[] = this.currentAllSitesBS$.getValue().filter(site => !hasFilters
      || (this._locGrid.filteredValue.filter(flatSite => flatSite.loc.locationNumber === site.locationNumber)).length > 0);

    filteredSites.forEach(site => site.isActive = newIsActive);
    this.onToggleLocations.emit({sites: filteredSites, isActive: newIsActive});
    this.setHasSelectedSites();
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
    if (this._locGrid.rows > 0) {
      this._locGrid.filter(filterVal, 'loc.isActive', 'equals');
    }
  }

  // Returns true if the grid has a filter applied
  hasFilters() : boolean
  {
    return (this._locGrid.filteredValue != null && this._locGrid.filteredValue.length > 0);
  }

  // Switches the select button label and tooltip based on if a filter is applied
  getSelectButtonText(asLabel: boolean) : string
  {
    return (asLabel) ? this.hasFilters() ? 'Filtered' : 'All'
                     : this.hasFilters() ? 'Select all locations in the filtered list' : 'Select all locations';
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
    this._locGrid.reset();
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

  onFilter(event: any)
  {
    if (event != null) {
      this.syncHeaderFilter();
    }
  }

  /**
   * Returns the appropriate tooltip for activating / deactivating a site or competitor
   *
   * @param loc The location whose isActive flag is being toggled
   */
  getSelectionTooltip(loc: ImpGeofootprintLocation) : string {
    return (loc == null) ? null : ((loc.isActive) ? 'Visibly Turn Off' : 'Visibly Turn On') + ' ' + this.selectedListType;
  }

  getSelectionMessage() : string {
    const numDeSelected = this.currentAllSitesBS$.getValue().length - this.currentAllSitesBS$.getValue().filter(site => site.isActive).length;
    return (numDeSelected > 0) ? 'Only visible sites will appear in the map below, Geo grid and created Site Map PDFs. Site allocation for created site maps, site lists, and GeoFootPrint All will honor all uploaded sites for geographic allocation' : null;
  }

  onLabelChange(event: string){
    this.createLabelAttr(this.labelOptions.filter(lbl => lbl.value === event)[0].value);
  }

  createLabelAttr(labelValue: any){
    let isUpdate: boolean = false;
    this.currentAllSitesBS$.getValue().forEach(loc => {
      const existingLabel = this.appProjectPrefService.getPref(this.selectedListType);
      if (existingLabel == null){
        this.appProjectPrefService.createPref('label', this.selectedListType, labelValue, 'string');
        isUpdate = true;

      }
      else if (existingLabel.val !== labelValue){
        this.appProjectPrefService.createPref('label', this.selectedListType,  labelValue, 'string');
         isUpdate = true;
     }
    });
    if (isUpdate) this.impLocationService.makeDirty();
  }

  createLabelDropdown(locations: ImpGeofootprintLocation[]){
    let label = null;
    const localOptions = [];
    if (locations.length > 0) {
      const sitesbyType = locations.filter(loc => loc.clientLocationTypeCode === this.selectedListType);
      const labelOptionsSet = new Set<string>();
      for (const column of this.flatSiteGridColumns) {
        if (!labelOptionsSet.has(column.header.toString()) && column.header.toString() !== 'label'){
          labelOptionsSet.add(column.header);
          localOptions.push({ label: column.header, value: column.field });
        }
      }

      sitesbyType[0].impGeofootprintLocAttribs.forEach(attr => {
        if ( attr != null && !labelOptionsSet.has(attr.attributeCode.toString()) && !attr.attributeCode.includes('Home')){
          labelOptionsSet.add(attr.attributeCode);
          localOptions.push({label: attr.attributeCode, value: attr.attributeCode});
        }
      });
      const projectPref = this.appProjectPrefService.getPref(this.selectedListType);
      label = projectPref != null ? projectPref.val : 'Number';

      switch (this.selectedListType) {
        case 'Site':
          this.appLocationService.siteLabelOptions$.next(localOptions);
          break;
        case 'Competitor':
          this.appLocationService.competitorLabelOptions$.next(localOptions);
          break;
      }
      this.labelOptions = localOptions;
      this.appLocationService.listTypeBS$.next(localOptions);
      this.selectedLabel = label ;
      //=== null ? this.labelOptions.filter(lbl => lbl.label === 'Number')[0].value : this.labelOptions.filter(lbl => lbl.value === label)[0].value;
      this.createLabelAttr(this.selectedLabel);
    }

  }
}
