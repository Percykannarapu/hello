import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { arrayToSet, CommonSort, filterArray, groupByExtended, isNil, isNotNil, isString, resolveFieldData } from '@val/common';
import { MessageBoxService } from '@val/messaging';
import { SelectItem, SortEvent, SortMeta } from 'primeng/api';
import { DialogService } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, shareReplay, startWith, take, tap } from 'rxjs/operators';
import { LocationGridColumn } from '../../../../../worker-shared/data-model/custom/grid';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { LocationBySiteNum } from '../../../../common/valassis-sorters';
import { ValGeocodingRequest } from '../../../../common/models/val-geocoding-request.model';
import { AppLocationService } from '../../../../services/app-location.service';
import { AppStateService } from '../../../../services/app-state.service';
import { FullAppState } from '../../../../state/app.interfaces';
import { ExportHGCIssuesLog } from '../../../../state/data-shim/data-shim.actions';
import { ReCalcHomeGeos } from '../../../../state/homeGeocode/homeGeo.actions';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { SearchInputComponent } from '../../../common/search-input/search-input.component';
import { EditLocationsComponent } from '../../../dialogs/edit-locations/edit-locations.component';

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
  providers: [DialogService]
})
export class SiteListComponent implements OnInit, OnDestroy {

  @ViewChild('locGrid', { static: true }) public grid: Table;
  @ViewChild('globalSearch', { static: true }) public searchWidget: SearchInputComponent;

  @Input() impGeofootprintLocations$: Observable<ImpGeofootprintLocation[]>;
  @Input() impGeofootprintGeos$: Observable<ImpGeofootprintGeo[]>;

  @Output() onToggleLocations = new EventEmitter<{sites: ImpGeofootprintLocation[], isActive: boolean}>();
  @Output() onDeleteLocations = new EventEmitter<any>();
  @Output() onDeleteAllLocations = new EventEmitter<string>();
  @Output() onMakeDirty = new EventEmitter<any>();
  @Output() onZoomToLocation = new EventEmitter<ImpGeofootprintLocation>();
  @Output() editLocations = new EventEmitter();
  @Output() resubmitFailedGrid = new EventEmitter();

  public selectedListType$ = new BehaviorSubject<SuccessfulLocationTypeCodes>(ImpClientLocationTypeCodes.Site);

  public allSiteCount$: Observable<number>;
  public activeSiteCount$: Observable<number>;
  public siteCountDifference$: Observable<number>;

  hasFailures$: Observable<boolean>;
  totalCount$: Observable<number>;

  // Observables for flattened rows of locations and attributes
  public flatAllSites$: Observable<FlatSite[]>;
  public flatActiveSites$: Observable<FlatSite[]>;

  public columnOptions: SelectItem[] = [];

  private selectedLocationsForDelete = new Set();
  private siteCache: ImpGeofootprintLocation[] = [];

  public flatSiteGridColumns: LocationGridColumn[] =
    // @formatter:off
    [{field: 'locationNumber',       header: 'Number',              width: '7em',   filterType: null, sortType: 'locNum', allowAsSymbolAttribute: true },
     {field: 'locationName',         header: 'Name',                width: '20em',  filterType: null, allowAsSymbolAttribute: true },
     {field: 'locAddress',           header: 'Address',             width: '20em',  filterType: null },
     {field: 'locCity',              header: 'City',                width: '10em',  filterType: 'multi' },
     {field: 'locState',             header: 'State',               width: '5em',   filterType: 'multi' },
     {field: 'locZip',               header: 'ZIP',                 width: '7em',   filterType: null },
     {field: 'marketName',           header: 'Market',              width: '8em',   filterType: 'multi', allowAsSymbolAttribute: true },
     {field: 'marketCode',           header: 'Market Code',         width: '9em',   filterType: 'multi', sortType: 'number', allowAsSymbolAttribute: true },
     {field: 'totalHHC',             header: 'Total HHC',           width: '8em',   filterType: null, sortType: 'number' },
     {field: 'totalAllocatedHHC',    header: 'Total Allocated HHC', width: '8em',   filterType: null, sortType: 'number' },
     {field: 'description',          header: 'Description',         width: '10em',  filterType: null },
     {field: 'groupName',            header: 'Group',               width: '8em',   filterType: null, allowAsSymbolAttribute: true },
     {field: 'radius1',              header: 'Radius 1',            width: '7em',   filterType: null, sortType: 'number' },
     {field: 'radius2',              header: 'Radius 2',            width: '7em',   filterType: null, sortType: 'number' },
     {field: 'radius3',              header: 'Radius 3',            width: '7em',   filterType: null, sortType: 'number' },
     {field: 'ycoord',               header: 'Latitude',            width: '8em',   filterType: null, sortType: 'number' },
     {field: 'xcoord',               header: 'Longitude',           width: '8em',   filterType: null, sortType: 'number' },
     {field: 'recordStatusCode',     header: 'Geocode Status',      width: '10em',  filterType: 'multi' },
     {field: 'Home Geocode Issue',   header: 'Home Geocode Issue',  width: '5em',   filterType: null },
     {field: 'Home Zip Code',        header: 'Home ZIP',            width: '8em',   filterType: 'multi' },
     {field: 'Home ATZ',             header: 'Home ATZ',            width: '8em',   filterType: 'multi' },
     {field: 'Home Digital ATZ',     header: 'Home Digital ATZ',    width: '11em',  filterType: 'multi' },
     {field: 'Home Carrier Route',   header: 'Home PCR',            width: '8em',   filterType: 'multi' },
     {field: 'Home DMA',             header: 'Home DMA',            width: '8em',   filterType: 'multi' },
     {field: 'Home DMA Name',        header: 'Home DMA Name',       width: '11em',  filterType: 'multi' },
     {field: 'Home County',          header: 'Home County',         width: '11em',  filterType: 'multi' },
     {field: 'geocoderMatchCode',    header: 'Match Code',          width: '5em',   filterType: 'multi' },
     {field: 'geocoderLocationCode', header: 'Location Code',       width: '5em',   filterType: 'multi' },
     {field: 'origAddress1',         header: 'Original Address',    width: '20em',  filterType: null },
     {field: 'origCity',             header: 'Original City',       width: '10em',  filterType: 'multi' },
     {field: 'origState',            header: 'Original State',      width: '5em',   filterType: 'multi' },
     {field: 'origPostalCode',       header: 'Original ZIP',        width: '8em',   filterType: null },
      // @formatter:on
    ];
  public flatSiteGridColumnsLength: number = this.flatSiteGridColumns.length;
  public selectedColumns: LocationGridColumn[] = [];

  // Selection variables
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

  // Control table sorting
  public  multiSortMeta: Array<SortMeta>;

  private destroyed$ = new Subject<void>();

  trackByFgId = (index: number, rowData: FlatSite) => rowData.fgId;

  constructor(private appLocationService: AppLocationService,
              private appStateService: AppStateService,
              private dialogService: DialogService,
              private impLocationService: ImpGeofootprintLocationService,
              private logger: LoggingService,
              private messageService: MessageBoxService,
              private store$: Store<FullAppState>) {
    for (const column of this.flatSiteGridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
  }

  ngOnInit() {
    // deferred setup of service-related observables
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.hasFailures$ = this.appLocationService.hasFailures$;
      this.totalCount$ = this.appLocationService.totalCount$;
      this.appStateService.clearUI$.subscribe(() => this.selectedListType$.next(ImpClientLocationTypeCodes.Site));
    });

    // setup local observables
    const locations$ = this.impGeofootprintLocations$.pipe(
      tap(locs => this.createLabelDropdown(locs ?? [])),
      tap(locs => this.siteCache = locs)
    );
    this.flatAllSites$ = combineLatest([this.selectedListType$, locations$, this.impGeofootprintGeos$]).pipe(
      map(([siteType, locations, geos]) => [locations.filter(loc => ImpClientLocationTypeCodes.parse(loc.clientLocationTypeCode) === siteType), geos] as const),
      map(([locations, geos]) => this.createComposite(locations, geos)),
      startWith([]),
      shareReplay()
    );
    this.flatActiveSites$ = this.flatAllSites$.pipe(filterArray(flatLoc => flatLoc.loc.isActive === true));
    this.allSiteCount$ = this.flatAllSites$.pipe(map(s => s.length), distinctUntilChanged());
    this.activeSiteCount$ = this.flatActiveSites$.pipe(map(s => s.length), distinctUntilChanged());
    this.siteCountDifference$ = combineLatest([this.allSiteCount$, this.activeSiteCount$]).pipe(
      map(([all, active]) => (all - active) ?? 0),
      startWith(0)
    );

    // initialize grid
    this.grid.reset();
    this.syncHeaderFilter();
    this.multiSortMeta = [];
    this.multiSortMeta.push({field: 'locationNumber', order: 1});
  }

  public ngOnDestroy() {
    this.destroyed$.next();
  }

  public onSiteTypeChanged(value: string) {
    try {
      const siteTypeSelected = ImpClientLocationTypeCodes.parseAsSuccessful(value);
      this.selectedListType$.next(siteTypeSelected);
    } catch {
      this.selectedListType$.next(ImpClientLocationTypeCodes.Site);
    } finally {
      this.clearFilters(this.grid, this.searchWidget);
    }
  }

  public onRowSelect(event: any, isSelected: boolean) {
    this.setLocationHierarchyActiveFlag(event.data, isSelected);
  }

  public onEdit(oldData: FlatSite) {
    const row = oldData.loc;
    const locAttribs = row['impGeofootprintLocAttribs'];
    const displayData = {
      locationNumber: row.locationNumber,
      locationName: row.locationName,
      locAddress: row.locAddress,
      locCity: row.locCity,
      locState: row.locState,
      locZip: row.locZip,
      marketName: row.marketName,
      marketCode: row.marketCode,
      coord: row.ycoord + ',' + row.xcoord,
      homeZip: locAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0]?.attributeValue ?? '',
      homeAtz: locAttribs.filter(la => la.attributeCode === 'Home ATZ')[0]?.attributeValue ?? '',
      homeDigitalAtz: locAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0]?.attributeValue ?? '',
      homePcr: locAttribs.filter(la => la.attributeCode === 'Home Carrier Route').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue : '',
      radius1: oldData['radius1'],
      radius2: oldData['radius2'],
      radius3: oldData['radius3']
    };
    const ref = this.dialogService.open(EditLocationsComponent, {
      header: 'Edit Location',
      width: '33vw',
      modal: true,
      data: displayData
    });
    ref.onClose.subscribe((result: ValGeocodingRequest) => {
      if (isNotNil(result)) {
        this.manuallyGeocode(result, row, this.selectedListType$.getValue());
      }
    });
  }

  private manuallyGeocode(newSiteData: ValGeocodingRequest, previousSite: ImpGeofootprintLocation, siteType: ImpClientLocationTypeCodes) {
    newSiteData.Group = previousSite.groupName;
    newSiteData.Description = previousSite.description;
    newSiteData.previousAddress1 = previousSite.origAddress1;
    newSiteData.previousCity = previousSite.origCity;
    newSiteData.previousState = previousSite.origState;
    newSiteData.previousZip = previousSite.origPostalCode;
    if (isNil(newSiteData.RADIUS1)) {
      newSiteData.RADIUS1 = previousSite.radius1;
      newSiteData.RADIUS2 = previousSite.radius2;
      newSiteData.RADIUS3 = previousSite.radius3;
    }
    this.editLocations.emit({site: newSiteData, siteType: siteType, oldData: previousSite });
  }

  /**
   * When the user clicks the trashcan icon on a given location row, this prompts
   * to confirm the location deletion.
   *
   * @param row The location to delete
   */
  public onRowDelete(row: ImpGeofootprintLocation) {
    this.messageService.showDeleteConfirmModal('Do you want to delete this record?').subscribe(result => {
      if (result) {
        const metricText = AppLocationService.createMetricTextForLocation(row);
        this.onDeleteLocations.emit({ locations: [row], metricText: metricText, selectedListType: this.selectedListType$.getValue() });
        this.logger.debug.log('remove successful');
      }
    });
  }

  onDeleteSelectedLocations() {
    this.messageService.showDeleteConfirmModal('Do you want to delete the selected records?').subscribe(result => {
      if (result) {
        const locsForDelete: ImpGeofootprintLocation[] = this.siteCache.filter(site => this.selectedLocationsForDelete.has(site.locationNumber));
        this.onDeleteLocations.emit({
          locations       : locsForDelete,
          metricText      : 'selected locations for delete',
          selectedListType: this.selectedListType$.getValue()
        });
        this.logger.debug.log('remove successful');
      }
    });
  }

  onSelectLoc(row: ImpGeofootprintLocation){
    if (!this.selectedLocationsForDelete.has(row.locationNumber)){
      this.selectedLocationsForDelete.add(row.locationNumber);
      row.isSelected = true;
    }
    else{
      this.selectedLocationsForDelete.delete(row.locationNumber);
      row.isSelected = false;
    }
  }

  /**
   * When the user clicks the "Delete All" button, this prompts to confirm
   * the deletion of all locations
   */
  public onDelete() {
    this.messageService.showDeleteConfirmModal(`Do you want to delete all ${this.selectedListType$.getValue()}s?`).subscribe(result => {
      if (result) {
        this.onDeleteAllLocations.emit(this.selectedListType$.getValue());
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
    this.store$.dispatch(new ExportHGCIssuesLog({locationType: this.selectedListType$.getValue()}));
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

          const column = {field: attribute.attributeCode, header: attribute.attributeCode, width: '10em', styleClass: '', allowAsSymbolAttribute: true, filterType: null };

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
    if (this.grid.filteredValue != null)
      this.headerFilter = !this.grid.filteredValue.some(flatSite => flatSite.loc.isActive === false);
    else
      this.headerFilter = !this.grid._value.some(flatSite => flatSite.loc.isActive === false);
  }

  onSelectSite(site: ImpGeofootprintLocation) {
    this.onToggleLocations.emit({sites: [site], isActive: site.isActive});
  }

  onSelectSites(newIsActive: boolean) : void {
    const hasFilters = this.hasFilters();
    const filteredSites: ImpGeofootprintLocation[] = this.siteCache.filter(site => !hasFilters
      || (this.grid.filteredValue.filter(flatSite => flatSite.loc.locationNumber === site.locationNumber)).length > 0);
    filteredSites.forEach(site => site.isActive = newIsActive);
    this.onToggleLocations.emit({sites: filteredSites, isActive: newIsActive});
  }

  /**
   * Performs a three way toggle that filters the grid by selection (isActive)
   * 1) Show selected and deselected,  2) Selected only,  3) Deselected only
   */
  onFilterBySelection()
  {
    let filterVal: boolean;
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
    if (this.grid.rows > 0) {
      this.grid.filter(filterVal, 'loc.isActive', 'equals');
    }
  }

  // Returns true if the grid has a filter applied
  hasFilters() : boolean
  {
    return (this.grid.filteredValue != null && this.grid.filteredValue.length > 0);
  }

  // Switches the select button label and tooltip based on if a filter is applied
  getSelectButtonText(asLabel: boolean) : string
  {
    return (asLabel) ? this.hasFilters() ? 'Filtered' : 'All'
                     : this.hasFilters() ? 'Select all locations in the filtered list' : 'Select all locations';
  }

  clearFilters(table: Table, searchWidget?: SearchInputComponent) : void {
    const currentSort = Array.from(this.multiSortMeta ?? []);
    table.reset();
    searchWidget?.reset();
    this.multiSortMeta = currentSort;
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
    return (loc == null) ? null : ((loc.isActive) ? 'Visibly Turn Off' : 'Visibly Turn On') + ' ' + this.selectedListType$.getValue();
  }

  createLabelDropdown(locations: ImpGeofootprintLocation[]) {
    const defaultLabels: SelectItem[] = [];
    const siteLabels: SelectItem[] = [];
    const competitorLabels: SelectItem[] = [];
    if (locations.length > 0) {
      const existingLabels = new Set<string>();
      for (const column of this.flatSiteGridColumns) {
        if (!existingLabels.has(column.header.toString()) && column.header.toString() !== 'label') {
          existingLabels.add(column.header);
          defaultLabels.push({label: column.header, value: column.field, title: column.allowAsSymbolAttribute ? 'all' : 'label-only' });
        }
      }

      const sitesByType = groupByExtended(locations, l => ImpClientLocationTypeCodes.parse(l.clientLocationTypeCode));

      sitesByType.forEach((currentLocations, locationType) => {
        const firstSite = currentLocations[0];
        firstSite.impGeofootprintLocAttribs.forEach(attr => {
          if (attr != null && !existingLabels.has(attr.attributeCode.toString()) && !attr.attributeCode.includes('Home')) {
            existingLabels.add(attr.attributeCode);
            if (ImpClientLocationTypeCodes.markSuccessful(locationType) == ImpClientLocationTypeCodes.Site) {
              siteLabels.push({label: attr.attributeCode, value: attr.attributeCode, title: 'all' });
            } else {
              competitorLabels.push({label: attr.attributeCode, value: attr.attributeCode, title: 'all' });
            }
          }
        });
      });
      this.appLocationService.siteLabelOptions$.next(defaultLabels.concat(siteLabels));
      this.appLocationService.competitorLabelOptions$.next(defaultLabels.concat(competitorLabels));
    }
  }

  createMultiOptionList(fieldName: string) : Observable<string[]> {
    return this.flatAllSites$.pipe(
      map(sites => sites.map(s => s[fieldName] as string)),
      map(values => Array.from(arrayToSet(values, v => isNotNil(v) && isString(v)))),
      tap(list => list.sort())
    );
  }

  customSort(event: SortEvent) : void {
    let sortFn: (a: any, b: any) => number = () => 0;
    if (event.mode === 'single') {
      sortFn = this.addSortCallback(sortFn, event.field, event.order);
    } else {
      event.multiSortMeta.forEach(meta => {
        sortFn = this.addSortCallback(sortFn, meta.field, meta.order);
      });
    }
    event.data.sort(sortFn);
  }

  private addSortCallback(currentCallback: (a: any, b: any) => number, fieldName: string, order: number) : (a: any, b: any) => number {
    const sortType = this.flatSiteGridColumns.filter(c => c.field === fieldName)?.[0]?.sortType;
    let result: (a: any, b: any) => number;
    switch (sortType) {
      case 'locNum':
        result = (a, b) => currentCallback(a, b) || (LocationBySiteNum(a, b) * order);
        break;
      case 'number':
        result = (a, b) => currentCallback(a, b) || (CommonSort.FieldNameAsNumber(fieldName, a, b) * order);
        break;
      default:
        result = (a, b) => currentCallback(a, b) || (CommonSort.FieldNameAsString(fieldName, a, b) * order);
        break;
    }
    return result;
  }
}
