import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { distinctArray, filterArray, mapArray, resolveFieldData } from '@val/common';
import { selectors } from '@val/esri';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { MultiSelect } from 'primeng/multiselect';
import { Table } from 'primeng/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppLocationService } from '../../services/app-location.service';
import { AppProjectService } from '../../services/app-project.service';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState, LocalAppState } from '../../state/app.interfaces';
import { ExportHGCIssuesLog } from '../../state/data-shim/data-shim.actions';
import { HomeGeocode, ReCalcHomeGeos } from '../../state/homeGeocode/homeGeo.actions';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';

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
  @ViewChildren('filterMs') msFilters: QueryList<MultiSelect>;

  // Input Behavior subjects
  private allLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private allLocationAttribsBS$ = new BehaviorSubject<ImpGeofootprintLocAttrib[]>([]);
  private allClientLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private activeClientLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private allCompetitorLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private activeCompetitorLocationsBS$ = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
  private impGeofootprintGeosBS$ = new BehaviorSubject<ImpGeofootprintGeo[]>([]);

  // Data store observables
  private allLocations$: Observable<ImpGeofootprintLocation[]>;
  private allLocationAttribs$: Observable<ImpGeofootprintLocAttrib[]>;

  public selectedListType: 'Site' | 'Competitor';
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

  // Observables for unique values to filter on in the grid
  public uniqueCity$: Observable<SelectItem[]>;
  public uniqueState$: Observable<SelectItem[]>;
  public uniqueMarket$: Observable<SelectItem[]>;
  public uniqueMarketCode$: Observable<SelectItem[]>;
  public uniqueRecStatuses$: Observable<SelectItem[]>;
  public uniqueMatchCodes$: Observable<SelectItem[]>;
  public uniqueMatchQualities$: Observable<SelectItem[]>;
  public uniqueOrigCity$: Observable<SelectItem[]>;
  public uniqueOrigState$: Observable<SelectItem[]>;

  public columnOptions: SelectItem[] = [];

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

  constructor(private appLocationService: AppLocationService,
              private confirmationService: ConfirmationService,
              private appProjectService: AppProjectService,
              private appStateService: AppStateService,
              private impLocationService: ImpGeofootprintLocationService,
              private store$: Store<FullAppState>) {}

  ngOnInit() {
    // Observe the behavior subjects on the input parameters
    this.allGeos$ = this.impGeofootprintGeosBS$.asObservable().pipe(startWith(null));

    this.allLocations$ = this.allLocationsBS$.asObservable();
    this.allLocationAttribs$ = this.allLocationAttribsBS$.asObservable();

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
    this.first = null;
    setTimeout(() => {
      this.first = 0;
    }, 0);

    this.selectedListType = data;

    // Choose to set current observables to sites or competitors
    if (this.selectedListType === 'Site') {
      this.currentAllSites$ = this.allClientLocationsBS$.asObservable();
      this.currentActiveSites$ = this.activeClientLocationsBS$.asObservable();
    }
    else {
      this.currentAllSites$ = this.allCompetitorLocationsBS$.asObservable();
      this.currentActiveSites$ = this.activeCompetitorLocationsBS$.asObservable();
    }

    this.flatAllSites$ = combineLatest(this.currentAllSites$, this.allGeos$)
                                      .pipe(map(([locs, geos]) => this.createComposite(locs, geos)));

    this.flatActiveSites$ = this.flatAllSites$.pipe(filterArray(flatLoc => flatLoc.loc.isActive === true));

    // ----------------------------------------------------------------------
    // Table filter observables
    // ----------------------------------------------------------------------

    // Create an observable for unique cities (By hand method)
    this.uniqueCity$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                  map(locs => Array.from(new Set(locs.map(loc => loc.locCity)))
                                                 .map(str => new Object({ label: str, value: str}) as SelectItem)));

    // Create an observable for unique states (By helper methods)
    this.uniqueState$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                   mapArray(loc => loc.locState),
                                                   distinctArray(),
                                                   mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique market names
    this.uniqueMarket$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                    mapArray(loc => loc.marketName),
                                                    distinctArray(),
                                                    mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique market codes
    this.uniqueMarketCode$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                        mapArray(loc => loc.marketCode),
                                                        distinctArray(),
                                                        mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique market codes
    this.uniqueRecStatuses$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                         mapArray(loc => loc.recordStatusCode),
                                                         distinctArray(),
                                                         mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique geocoder match codes
    this.uniqueMatchCodes$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                        mapArray(loc => loc.geocoderMatchCode),
                                                        distinctArray(),
                                                        mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique geocoder match qualities
    this.uniqueMatchQualities$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                            mapArray(loc => loc.geocoderLocationCode),
                                                            distinctArray(),
                                                            mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique original cities
    this.uniqueOrigCity$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                      mapArray(loc => loc.origCity),
                                                      distinctArray(),
                                                      mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    // Create an observable for unique original states
    this.uniqueOrigState$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true),
                                                       mapArray(loc => loc.origState),
                                                       distinctArray(),
                                                       mapArray(str => new Object({ label: str, value: str}) as SelectItem));

    this.setCounts();
  }

  public onRowSelect(event: any, isSelected: boolean) {
    this.setLocationHierarchyActiveFlag(event.data, isSelected);
  }

  public onEdit(row: ImpGeofootprintLocation) {
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
      homePcr: locAttribs.filter(la => la.attributeCode === 'Home Carrier Route').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue : ''
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
          console.log('remove successful');
        },
        reject: () => {
          console.log('cancelled remove');
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
    if ( this.impLocationService.get().length > 0) {
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
    const locType: SuccessfulLocationTypeCodes = this.selectedListType === 'Site'? ImpClientLocationTypeCodes.Site : ImpClientLocationTypeCodes.Competitor;
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
    console.log('setLocationHierarchyActiveFlag - location:', location, ', isActive: ', isActive);
    if (location == null) {
      console.log('setLocationHierarchyActive flag called with null location');
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
        gridSite[attribute.attributeCode] = attribute.attributeValue;

        const column = {'field': attribute.attributeCode, 'header': attribute.attributeCode, 'width': '10em', 'styleClass': ''};

        // If the column isn't already in the list, add it
        if (!this.flatSiteGridColumns.some(c => c.field === attribute.attributeCode))
        {
          this.flatSiteGridColumns.push(column);
          this.columnOptions.push({ label: column.header, value: column });
          this.selectedColumns.push(column);
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

  // Disabling dismissable events until we can get access to change detection in sub panels
  onSetDismissable(dismissable: boolean)
  {
    console.log('onSetDismissable: ', dismissable);
    // this.setContainerDismissable.emit(dismissable);
  }

  onFilterShow()
  {
    console.log('onFilterShow - fired');
    // this.onSetDismissable(false);
  }

  onFilterHide()
  {
    console.log('onFilterHide - fired');
    // this.onSetDismissable(true);
  }

  onFilter(event: any)
  {
     //this.cd.markForCheck();
  }
}
