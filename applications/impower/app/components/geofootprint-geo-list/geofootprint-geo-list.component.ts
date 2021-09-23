import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { disjointSets, entityToMap, isArray, isEmpty, isInteger, isNil, isNotNil, isNumber, isString, toNullOrNumber } from '@val/common';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { FilterMetadata, FilterService, SelectItem, SortMeta } from 'primeng/api';
import { Table } from 'primeng/table';
import { asapScheduler, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, map, observeOn, shareReplay, tap } from 'rxjs/operators';
import { SimpleGridColumn } from '../../common/ui-helpers';
import { GeoAttribute } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { GridGeoVar } from '../../impower-datastore/state/transient/transient.selectors';
import { AppStateService } from '../../services/app-state.service';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { SearchInputComponent } from '../common/search-input/search-input.component';
import { FlatGeo } from '../geofootprint-geo-panel/geofootprint-geo-panel.component';

export interface ColMetric {
  tot: number;
  cnt?: number;
  min?: number;
  max?: number;
  avg?: number;
}

interface GeoGridColumn extends SimpleGridColumn {
  getValue?: (g: ImpGeofootprintGeo) => any;
}

interface AttributeEntity {
  [geocode: string] : GeoAttribute;
}

function ProjectDistinctComparison(a: ImpProject, b: ImpProject) : boolean {
  return a.projectId === b.projectId
    && toNullOrNumber(a.estimatedBlendedCpm) === toNullOrNumber(b.estimatedBlendedCpm)
    && toNullOrNumber(a.smValassisCpm) === toNullOrNumber(b.smValassisCpm)
    && toNullOrNumber(a.smAnneCpm) === toNullOrNumber(b.smAnneCpm)
    && toNullOrNumber(a.smSoloCpm) === toNullOrNumber(b.smSoloCpm);
}

function AudienceDistinctComparison(a: Audience[], b: Audience[]) : boolean {
  const aPks = new Set(a.map(x => x.audienceIdentifier));
  const bPks = new Set(b.map(x => x.audienceIdentifier));
  return disjointSets(aPks, bPks).size === 0;
}

function GridGeoVarDistinctComparison(a: GridGeoVar, b: GridGeoVar) : boolean {
  const aGeocodeSize = Object.keys(a?.geoVars ?? {}).length;
  const bGeocodeSize = Object.keys(b?.geoVars ?? {}).length;
  if (aGeocodeSize === bGeocodeSize && aGeocodeSize > 0) {
    let usableGeocode;
    for (const currentGeocode of Object.keys(a.geoVars)) {
      if (Object.keys(a.geoVars[currentGeocode]).length > 1) {
        usableGeocode = currentGeocode;
        break;
      }
    }
    if (isNotNil(usableGeocode)) {
      return Object.keys(a.geoVars[usableGeocode]).length === Object.keys(b.geoVars[usableGeocode] ?? {}).length;
    } else {
      return false; // if I couldn't find a geocode to detect changes with, I'll just let it pass through to createComposite
    }
  } else {
    return aGeocodeSize === bGeocodeSize;
  }
}

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.scss'],
})
export class GeofootprintGeoListComponent implements OnInit {
  private exportAllText = 'All';
  private exportAllTip = 'Export all geos. (Selected & Deselected)';
  private exportFilteredText = 'Filtered';
  private exportFilteredTip = 'Export geos filtered in the grid.  (Selected & Deselected)';
  public exportAllButtonText: string = this.exportAllText;
  public exportAllButtonTip: string = this.exportAllTip;

  @Input() project$: Observable<ImpProject>;
  @Input() allAudiences$: Observable<Audience[]>;
  @Input() allLocations$: Observable<ImpGeofootprintLocation[]>;
  @Input() allGeos$: Observable<ImpGeofootprintGeo[]>;
  @Input() allMustCovers$: Observable<string[]>;
  @Input() allAttributes$: Observable<AttributeEntity>;
  @Input() allVars$: Observable<GridGeoVar>;

  @Output() onZoomGeo = new EventEmitter<ImpGeofootprintGeo>();
  @Output() onDeleteGeo = new EventEmitter<ImpGeofootprintGeo>();
  @Output() onSelectGeo = new EventEmitter<any>();
  @Output() onSetAllGeos = new EventEmitter<any>();
  @Output() onSetFilteredGeos = new EventEmitter<any>();

  // Get the grid as a view child to attach custom filters
  @ViewChild('geoGrid') public _geoGrid: Table;

  // FlatGeo grid observables
  public allImpGeofootprintGeos$: Observable<FlatGeo[]>;
  public selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

  // Header filter
  public allVisibleRowsSelected: boolean = true;
  public defaultLabel: string = 'All';

  // Filtered Totals
  public gridTotals: Map<string, ColMetric> = new Map<string, ColMetric>();

  // Grid Column Variables
  public flatGeoGridColumns: GeoGridColumn[] = [
    // @formatter:off
    { field: 'geo.impGeofootprintLocation.locationNumber', header: 'Number',          width: '5rem',   filterType: null,      getValue: g => g.impGeofootprintLocation.locationNumber },
    { field: 'geo.impGeofootprintLocation.locationName',   header: 'Name',            width: '8rem',   filterType: null,      getValue: g => g.impGeofootprintLocation.locationName },
    { field: 'geo.impGeofootprintLocation.marketName',     header: 'Market',          width: '8rem',   filterType: 'multi',   getValue: g => g.impGeofootprintLocation.marketName },
    { field: 'geo.impGeofootprintLocation.locAddress',     header: 'Address',         width: '14rem',  filterType: null,      getValue: g => g.impGeofootprintLocation.locAddress },
    { field: 'geo.impGeofootprintLocation.locCity',        header: 'City',            width: '9rem',   filterType: 'multi',   getValue: g => g.impGeofootprintLocation.locCity },
    { field: 'geo.impGeofootprintLocation.locState',       header: 'State',           width: '4rem',   filterType: 'multi',   getValue: g => g.impGeofootprintLocation.locState },
    { field: 'geo.impGeofootprintLocation.locZip',         header: 'ZIP',             width: '4rem',   filterType: null,      getValue: g => g.impGeofootprintLocation.locZip },
    { field: 'home_geo',                                   header: 'Home Geo',        width: '4rem',   filterType: 'bool10'  },
    { field: 'isMustCover',                                header: 'Must Cover',      width: '4rem',   filterType: 'bool10'  },
    { field: 'geo.distance',                               header: 'Dist',            width: '4rem',   filterType: 'numeric', getValue: g => g.distance },
    { field: 'geo.geocode',                                header: 'Geocode',         width: '9rem',   filterType: null,      getValue: g => g.geocode },
    { field: 'city_name',                                  header: 'Geo City, State', width: '10rem',  filterType: null      },
    { field: 'geo.hhc',                                    header: 'HHC',             width: '7rem',   filterType: 'numeric', getValue: g => g.hhc },
    { field: 'allocHhc',                                   header: 'HHC Allocated',   width: '7rem',   filterType: 'numeric' },
    { field: 'cpm',                                        header: 'CPM',             width: '5.5rem', filterType: 'numeric' },
    { field: 'investment',                                 header: 'Inv',             width: '7rem',   filterType: 'numeric' },
    { field: 'allocInvestment',                            header: 'Inv Allocated',   width: '7rem',   filterType: 'numeric' },
    { field: 'ownergroup',                                 header: 'Owner Group',     width: '7rem',   filterType: 'multi'   },
    { field: 'coveragedescription',                        header: 'Cov Desc',        width: '12rem',  filterType: 'multi'   },
    { field: 'pob',                                        header: 'POB',             width: '4rem',   filterType: 'boolYN'  },
    { field: 'dma',                                        header: 'DMA',             width: '10rem',  filterType: 'multi'   },
    { field: 'geo.isDeduped',                              header: 'In Deduped',      width: '6rem',   filterType: 'dedupe',  getValue: g => g.isDeduped },
    { field: 'geo.ownerSite',                              header: 'Owner Site',      width: '6rem',   filterType: null,      getValue: g => g.ownerSite },
    // @formatter:on
  ];

  public selectedColumns: GeoGridColumn[] = [];
  public columnOptions: SelectItem[] = [];
  public firstRowIndex: number = 0;

  // Miscellaneous variables
  public gridStats = {
    numLocs: 0,
    numLocsActive: 0,
    numGeos: 0,
    numGeosActive: 0,
    numGeosInactive: 0
  };
  private lastProjectId: number;
  public initialSort: SortMeta[] = [
    {field: 'geo.impGeofootprintLocation.locationNumber', order: 1},
    {field: 'geo.distance', order: 1}
  ];
  private trackedSort: SortMeta[];

  // Duplicate Geos filter variables
  public dedupeGrid: boolean = false;
  public dupeCount: number = 0;
  public dupeMsg: string;

  // filter lists
  private filterWorkingSets: Record<string, Set<string>> = {};
  public filterValues: Record<string, string[]> = {};

  generatingComposite: boolean;

  // -----------------------------------------------------------
  // LIFECYCLE METHODS
  // -----------------------------------------------------------
  constructor(private appStateService: AppStateService,
              private filterService: FilterService,
              private logger: LoggingService) {
  }

  ngOnInit() {
    const project$ = this.project$.pipe(
      tap(project => {
        // In the event of a project load, clear the grid filters and set the export filename
        if (this.lastProjectId !== project.projectId) {
          this.lastProjectId = project.projectId;
          this.firstRowIndex = 0;
          this.clearFilters(this._geoGrid);
          this._geoGrid.exportFilename = 'geo-grid' + ((project.projectId != null) ? '-' + project.projectId.toString() : '') + '-export';
        }
      }),
      distinctUntilChanged(ProjectDistinctComparison),
    );

    const locations$ = this.allLocations$.pipe(
      tap(locs => {
        this.gridStats = {
          ...this.gridStats,
          numLocs: locs?.length ?? 0,
          numLocsActive: locs?.filter(l => l.isActive).length ?? 0
        };
      }),
    );

    const audiences$ = this.allAudiences$.pipe(
      distinctUntilChanged(AudienceDistinctComparison),
    );

    const var$ = this.allVars$.pipe(
      distinctUntilChanged(GridGeoVarDistinctComparison),
    );

    // Remember that combineLatest is going to fire the pipe for each subscriber to allImpGeofootprintGeos$.  In the template, we have two | async values:
    // displayedImpGeofootprintGeos$ and selectedImpGeofootprintGeos$, which creates two subscribers.  This would fire createComposite twice, which is an expensive
    // operation.  The publishReplay is allows it to run once for the first subscriber, then the other uses the result of that.
    type createCompositeTuple = [ImpProject, Audience[], ImpGeofootprintGeo[], string[], AttributeEntity, GridGeoVar, boolean, ImpGeofootprintLocation[]];

    this.allImpGeofootprintGeos$ = combineLatest<createCompositeTuple>([
      project$,
      audiences$,
      this.allGeos$,
      this.allMustCovers$,
      this.allAttributes$,
      var$,
      this.appStateService.getCollapseObservable(),
      locations$]).pipe(
      tap(() => this.syncHeaderFilter()),
      tap(() => this.generatingComposite = true),
      observeOn(asapScheduler),
      map(([discovery, audiences, geos, mustCovers, attributes, vars, listCollapsed]) => {
        if (!listCollapsed) {
          const currentIndex = this.firstRowIndex;
          setTimeout(() => this.firstRowIndex = currentIndex); // ugly hack, but it will do for now
          return this.createComposite(discovery, audiences, geos, mustCovers, attributes, vars);
        } else {
          return [];
        }
      }),
      shareReplay()
    );

    this.selectedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$.pipe(
      map((allFlatGeos) => {
        const fullCount = allFlatGeos?.length ?? 0;
        const activeGeos = allFlatGeos?.filter(flatGeo => flatGeo.geo.isActive === true) ?? [];
        const activeCount = activeGeos.length;
        const inactiveCount = fullCount - activeCount;
        this.gridStats = {
          ...this.gridStats,
          numGeos: fullCount,
          numGeosActive: activeCount,
          numGeosInactive: inactiveCount
        };
        return activeGeos;
      })
    );

    // Column Picker Model
    for (const column of this.flatGeoGridColumns) {
      this.columnOptions.push({label: column.header, value: column});
      this.selectedColumns.push(column);
    }

    this.filterService.register('gridDedupeFilter', (rowValue, filterValue) => {
      this.dedupeGrid = filterValue === 1;
      return rowValue === (filterValue ?? rowValue);
    });

    this.initializeGridTotals();
    this.initializeState();
  }

  // -----------------------------------------------------------
  // COMPONENT METHODS
  // -----------------------------------------------------------
  public getGeoTooltip(flatGeo: FlatGeo) : string {
    let result: string = null;

    if (flatGeo == null || flatGeo.geo == null)
      return result;

    if (flatGeo.geo.isActive === false && flatGeo.geo['filterReasons'] == null)
      result = 'Filtered manually';
    else if (flatGeo.geo.isActive === true && flatGeo.geo['filterReasons'] != null && flatGeo.geo['filterReasons'].length > 0)
      result = '*** Manual Override ***\n' + flatGeo.geo['filterReasons'];
    else if (flatGeo.geo['filterReasons'] != null)
      result = flatGeo.geo['filterReasons'];
    else
      result = null;
    // this.logger.debug.log('ToolTip: [' + result + '] getGeoTooltip: flatGeo: ', flatGeo.geo.geocode, ', filterReasons: ', flatGeo['filterReasons'], ', geo.filterReasons: ', flatGeo.geo['filterReasons']);
    return result;
  }

  /**
   * Initializes various state variables
   */
  initializeState() {
    //this.logger.debug.log('geoGrid - initializeState - fired');
    this.gridStats.numGeos = 0;
    this.gridStats.numGeosActive = 0;
    this.gridStats.numGeosInactive = 0;

    this.dedupeGrid = false;
    this.dupeCount = 0;
    this.dupeMsg = '';
  }

  /**
   *  Initializes the accumulators for the totals located at the bottom of the column
   */
  initializeGridTotals() {
    //this.logger.debug.log('initializeGridTotals - fired');
    this.gridTotals = new Map<string, ColMetric>();
    this.gridTotals.set('hhc', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
    this.gridTotals.set('allocHhc', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
    this.gridTotals.set('cpm', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
    this.gridTotals.set('investment', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
    this.gridTotals.set('allocInvestment', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
    this.gridTotals.set('distance', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
  }

  debugLogGridTotals() {
    this.logger.debug.log('total distance:             ', this.gridTotals.get('distance'));
    this.logger.debug.log('total hhc:                  ', this.gridTotals.get('hhc'));
    this.logger.debug.log('total allocated hhc:        ', this.gridTotals.get('allocHhc'));
    this.logger.debug.log('total investment:           ', this.gridTotals.get('investment'));
    this.logger.debug.log('total allocated investment: ', this.gridTotals.get('allocInvestment'));
    this.logger.debug.log('total cpm:                  ', this.gridTotals.get('cpm'));
  }

  /**
   * createComposite produces a list of FlatGeos.  These are a flattened view of the geographies,
   * having pivoted up the variables and attributes to their respective geographies.
   */
  createComposite(project: ImpProject, audiences: Audience[], geos: ImpGeofootprintGeo[], mustCovers: string[], geoAttributes: AttributeEntity, gridGeoVars: GridGeoVar) : FlatGeo[] {
    this.logger.debug.log('createComposite:',
      ' geos:', (geos.length),
      ' must covers:', mustCovers?.length,
      ' geo vars:', gridGeoVars?.geoVars
    );

    // Initialize grid totals, filters, etc...
    this.initializeGridTotals();
    if (this.gridStats.numGeos !== geos.length) this.firstRowIndex = 0;
    this.dupeCount = 0;
    this.filterWorkingSets = {};
    this.filterValues = {};

    const geoGridData: FlatGeo[] = [];
    const varPkSet = new Set<string>();
    const mustCoverSet = new Set<string>(mustCovers);
    const geoSiteCounter = new Map<string, Set<string>>();
    const geoGrouper = new Map<string, FlatGeo[]>();
    const extraColumns: SimpleGridColumn[] = [];

    // Create grid columns for the variables
    audiences.forEach(audience => {
      varPkSet.add(audience.audienceIdentifier);
      // If more than one variable has this audience name, add the source name to the header
      const dupeNameCount = audiences.filter(aud => aud.audienceName === audience.audienceName).length;
      const audienceHeader = (dupeNameCount > 1 && audience.audienceSourceType !== 'Composite') ? `${audience.audienceName} (${audience.audienceSourceName})` : audience.audienceName;
      extraColumns.push({
        field: audience.audienceIdentifier,
        header: audienceHeader,
        width: '4rem',
        digitsInfo: ['PERCENT', 'RATIO'].includes(audience.fieldconte) ? '1.2-2' : '1.0-0',
        filterType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes(audience.fieldconte)) ? 'numeric' : null
      });
    });

    geos.forEach(geo => {
      if (geo.impGeofootprintLocation?.isActive && geo.impGeofootprintTradeArea?.isActive) {
        geoGridData.push(this.createFlatGeo(project, geo, mustCoverSet, geoSiteCounter, geoGrouper, geoAttributes, gridGeoVars, varPkSet));
      }
    });

    // Rebuild Selected columns including the variable columns, maintaining order
    if (extraColumns.length > 0) {
      this.selectedColumns = this.selectedColumns.filter(col => this.flatGeoGridColumns.includes(col)).concat(extraColumns);
    }

    Object.keys(this.filterWorkingSets).forEach(key => {
      const values = Array.from(this.filterWorkingSets[key]);
      values.sort();
      this.filterValues[key] = values;
    });

    // Update geo grid total columns
    if (!isEmpty(geoGridData)) this.setGridTotals(geoGridData);
    setTimeout(() => this.generatingComposite = false);
    return geoGridData;
  }

  private createFlatGeo(project: ImpProject,
                        geo: ImpGeofootprintGeo,
                        mustCovers: Set<string>,
                        geoSites: Map<string, Set<string>>,
                        geoGroups: Map<string, FlatGeo[]>,
                        geoAttributes: AttributeEntity,
                        gridGeoVars: GridGeoVar,
                        varPkSet: Set<string>) : FlatGeo {
    const gridGeo: FlatGeo = {
      geoLocNum: `${geo.geocode}-${geo.impGeofootprintLocation.locationNumber}`,
      geo,
      isActive: geo.isActive,
      isMustCover: mustCovers.has(geo.geocode) ? '1' : '0'
    };

    // Count dupes for display
    this.dupeCount += (gridGeo.geo.isDeduped === 1) ? 0 : 1;

    this.flatGeoGridColumns.forEach(col => {
      if (isNotNil(col.getValue)) {
        const fieldValue = col.getValue(geo);
        gridGeo[col.field] = fieldValue || '';
        if (col.filterType === 'multi' && isNotNil(fieldValue) && isString(fieldValue)) {
          if (isNil(this.filterWorkingSets[col.field])) this.filterWorkingSets[col.field] = new Set<string>();
          this.filterWorkingSets[col.field].add(fieldValue);
        }
      }
    });

    if (gridGeo.geo.impGeofootprintLocation != null && gridGeo.geo.impGeofootprintLocation.locZip != null) {
      gridGeo.geo.impGeofootprintLocation.locZip = gridGeo.geo.impGeofootprintLocation.locZip.slice(0, 5);
    }

    // Add attributes the grid is interested in and massage them where needed
    const currentAttribute = geoAttributes[geo.geocode];
    if (currentAttribute != null) {
      gridGeo['pob'] = (currentAttribute['pob'] === 'B') ? 'Y' : 'N';
      gridGeo['coveragedescription'] = currentAttribute['cov_desc'] ?? '';
      gridGeo['dma'] = currentAttribute['dma_name'] ?? '';
      gridGeo['ownergroup'] = currentAttribute['owner_group_primary'] ?? '';

      if (isNotNil(currentAttribute['cov_desc'])) {
        if (isNil(this.filterWorkingSets['coveragedescription'])) this.filterWorkingSets['coveragedescription'] = new Set<string>();
        this.filterWorkingSets['coveragedescription'].add(gridGeo['coveragedescription']);
      }
      if (isNotNil(currentAttribute['dma_name'])) {
        if (isNil(this.filterWorkingSets['dma'])) this.filterWorkingSets['dma'] = new Set<string>();
        this.filterWorkingSets['dma'].add(gridGeo['dma']);
      }
      if (isNotNil(currentAttribute['owner_group_primary'])) {
        if (isNil(this.filterWorkingSets['ownergroup'])) this.filterWorkingSets['ownergroup'] = new Set<string>();
        this.filterWorkingSets['ownergroup'].add(gridGeo['ownergroup']);
      }

      const cityName = currentAttribute['city_name'];
      if (cityName != null && typeof cityName === 'string') {
        gridGeo['city_name'] = cityName.substring(0, 1).toUpperCase() + cityName.substring(1, cityName.length - 3).toLowerCase() + ' ' + cityName.substring(cityName.length - 2);
      }

      if (project.estimatedBlendedCpm != null)
        gridGeo['cpm'] = project.estimatedBlendedCpm;
      else
        switch (currentAttribute['owner_group_primary']) {
          case 'VALASSIS':
            gridGeo['cpm'] = project.smValassisCpm;
            break;

          case 'ANNE':
            gridGeo['cpm'] = project.smAnneCpm;
            break;

          default:
            gridGeo['cpm'] = project.smSoloCpm;
            break;
        }
    }
    gridGeo['allocHhc'] = (gridGeo.geo.isDeduped === 1) ? gridGeo.geo.hhc : null;
    gridGeo['investment'] = (gridGeo['cpm'] != null) ? (gridGeo['cpm'] / 1000) * gridGeo.geo.hhc : 0;
    gridGeo['allocInvestment'] = (gridGeo.geo.isDeduped === 1) ? ((gridGeo['cpm'] != null) ? (gridGeo['cpm'] / 1000) * gridGeo.geo.hhc : 0) : null;
    if (geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.impGeofootprintLocAttribs != null) {
      gridGeo['home_geo'] = (geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
    }

    // Update current number of dupes when dedupe filter is on
    this.dupeMsg = (this.dedupeGrid) ? 'Filtered Dupe Geos' : 'Total Dupe Geos';

    if (gridGeoVars?.geoVars?.hasOwnProperty(geo.geocode)) {
      for (const [varPk, varValue] of Object.entries(gridGeoVars.geoVars[geo.geocode])) {
        const n = varPk.indexOf(':');
        const location = varPk.substr(0, n);
        const pk = varPk.substr(n + 1);
        if (location == null || location === '' || gridGeo.geo.impGeofootprintLocation?.locationNumber === location) {
          gridGeo[pk] = varValue;
        }
      }
    } else {
      varPkSet.forEach(pvID => {
        if (!gridGeo[pvID]) {
          gridGeo['geocode'] = geo.geocode;
          gridGeo[pvID] = '';
        }
      });
    }

    // Set the tooltip for the geography
    gridGeo['tooltip'] = this.getGeoTooltip(gridGeo);

    // track geos for site count per geocode
    geoGroups.set(geo.geocode, (geoGroups.get(geo.geocode) ?? []).concat(gridGeo));
    geoSites.set(geo.geocode, (geoSites.get(geo.geocode) ?? new Set<string>()).add(geo.impGeofootprintLocation.locationNumber));
    geoGroups.get(geo.geocode).forEach(fg => fg['siteCount'] = geoSites.get(geo.geocode).size);

    return gridGeo;
  }

  /**
   * Ensures that the header checkbox is in sync with the actual state of the geos.isActive flag.
   * If one geo is inactive, then the header checkbox is unselected.  If all geos are selected, its checked.
   */
  public syncHeaderFilter() {
    const rows = (this._geoGrid?.filteredValue ?? this._geoGrid?.value) ?? [];
    this.allVisibleRowsSelected = !rows.some(flatGeo => flatGeo.geo.isActive === false);
  }

  // -----------------------------------------------------------
  // UI CONTROL EVENTS
  // -----------------------------------------------------------
  public onZoomToGeo(flatGeo: FlatGeo) {
    if (flatGeo != null && flatGeo.geo != null)
      this.onZoomGeo.emit(flatGeo.geo);
  }

  public onClickDeleteGeo(flatGeo: FlatGeo) {
    if (flatGeo != null && flatGeo.geo != null)
      this.onDeleteGeo.emit(flatGeo.geo);
  }

  onClickSelectGeocode(geo: ImpGeofootprintGeo) {
    if (geo != null) this.onSelectGeo.emit({geo: geo, isSelected: !geo.isActive});
  }

  onFilter() {
    this.syncHeaderFilter();
    this.setGridTotals();
    if (isNil(this._geoGrid.filteredValue)) {
      this.exportAllButtonText = this.exportAllText;
      this.exportAllButtonTip = this.exportAllTip;
    } else {
      this.exportAllButtonText = this.exportFilteredText;
      this.exportAllButtonTip = this.exportFilteredTip;
    }
  }

  clearFilters(table: Table, searchWidget?: SearchInputComponent) : void {
    const currentSort = Array.from(this.trackedSort ?? []);
    table.reset();
    searchWidget?.reset();
    this.initialSort = currentSort;
  }

  /**
   * Utility method used by setGridTotals to reduce the complexity of it.
   * @param totalStr The key of the map to update
   * @param newValue The value to store in the map
   */
  private setGridTotal(totalStr: string, newValue: number) {
    if (newValue == null) newValue = 0;
    const val = (+this.gridTotals.get(totalStr).tot) + (+newValue);
    this.gridTotals.set(totalStr, {
      tot: val
      , min: (newValue < this.gridTotals.get(totalStr).min) ? newValue : this.gridTotals.get(totalStr).min
      , max: (newValue > this.gridTotals.get(totalStr).max) ? newValue : this.gridTotals.get(totalStr).max
    });
  }

  private setGridTotalSet(hhc: number, cpm: number, investment: number, distance: number, isDeduped: number) {
    this.setGridTotal('hhc', hhc);
    this.setGridTotal('cpm', cpm);
    this.setGridTotal('investment', investment);
    this.setGridTotal('distance', distance);
    // Accumulate allocated counts
    if (isDeduped === 1) {
      this.setGridTotal('allocHhc', hhc);
      this.setGridTotal('allocInvestment', investment);
    }
  }

  /**
   * Looks at the filtered and unfiltered arrays of the grid and computes totals for display at the
   * bottom of the column.
   */
  setGridTotals(flatGeos?: FlatGeo[]) {
    if (this._geoGrid == null || this._geoGrid._value == null)
      return;

    //this.logger.debug.log('setGridTotals - Fired');

    // Initialize totals
    this.initializeGridTotals();

    let numRows: number = 0;
    try {
      if (flatGeos != null && flatGeos.length > 0) {
        //this.logger.debug.log('setGridTotals - using flatGeos');

        flatGeos.forEach(element => {
          if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {
            this.setGridTotalSet(element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
            numRows++;
          }
        });
      } else {
        if (this._geoGrid.filteredValue != null && this._geoGrid.filteredValue.length > 0) {
          //this.logger.debug.log('setGridTotals - using filtered list');
          //this.logger.debug.log('this.geoGrid: ', this._geoGrid);

          this._geoGrid.filteredValue.forEach(element => {
            if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {
              this.setGridTotalSet(element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
              numRows++;
            }
          });
        } else {
          //this.logger.debug.log('setGridTotals - using normal list - numRows: ', this._geoGrid._value.length);

          this._geoGrid._value.forEach(element => {
            if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {

              if (isNaN(element.geo.hhc)) {
                element.geo.hhc = 0;
              }

              this.setGridTotalSet(element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
              numRows++;
            }
          });
        }
      }
      // Calculated grid totals
      this.gridTotals.set('hhc', {
        ...this.gridTotals.get('hhc')
        , avg: this.gridTotals.get('hhc').tot / numRows
      });

      this.gridTotals.set('allocHhc', {
        ...this.gridTotals.get('allocHhc')
        , avg: this.gridTotals.get('allocHhc').tot / numRows
      });

      this.gridTotals.set('investment', {
        ...this.gridTotals.get('investment')
        , avg: this.gridTotals.get('investment').tot / numRows
      });

      this.gridTotals.set('allocInvestment', {
        ...this.gridTotals.get('allocInvestment')
        , avg: this.gridTotals.get('allocInvestment').tot / numRows
      });

      this.gridTotals.set('cpm', {
        ...this.gridTotals.get('cpm')
        , avg: this.gridTotals.get('cpm').tot / numRows
      });

      this.gridTotals.set('distance', {
        ...this.gridTotals.get('distance')
        , avg: this.gridTotals.get('distance').tot / numRows
      });
    } catch (e) {
      this.logger.error.log('EXCEPTION: ', e);
      this.logger.error.log('this._geoGrid', this._geoGrid);
      this.debugLogGridTotals();
    }
  }

  selectVisibleRows(isSelected: boolean) {
    if (this._geoGrid.filteredValue != null)
      this.onSetFilteredGeos.emit({value: isSelected, geos: this._geoGrid.filteredValue.map(flatGeo => flatGeo.geo)});
    else
      this.onSetAllGeos.emit({value: isSelected});
  }

  private getSingleFilter(filterName: string, filterMatchMode: string) : FilterMetadata {
    const currentDedupeFilters = this._geoGrid.filters[filterName];
    if (isArray(currentDedupeFilters)) {
      return currentDedupeFilters.filter(f => f.matchMode === filterMatchMode)[0];
    } else {
      return currentDedupeFilters;
    }
  }

  onClickDedupeToggle(newValue: boolean) {
    const dedupeFilter = this.getSingleFilter('geo.isDeduped', 'gridDedupeFilter');
    dedupeFilter.value = newValue ? 1 : null;
    this._geoGrid._filter();
  }

  exportFunction(event) {
    return (isNumber(event.data)) && !(isInteger(event.data)) ?  Number(event.data).toFixed(2) : event.data;
  }

  exportCsv(selectedOnly: boolean) : void {
    if (selectedOnly) {
      let existingFilterValues: Map<string, any>;
      if (isNotNil(this._geoGrid.filteredValue)) {
        // filters are already applied - need to back them up and clear them
        existingFilterValues = entityToMap(this._geoGrid.filters, (k, v) => isArray(v) ? v.map(t => t.value) : v.value, null, (k, v) => !isEmpty(v));
        this.clearFilters(this._geoGrid);
      }
      // get the active filter, and filter the grid
      const activeFilter = this.getSingleFilter('geo.isActive', 'contains');
      activeFilter.value = true;
      this._geoGrid._filter();
      // do a normal filtered export
      this._geoGrid.exportCSV();
      // undo the active filter
      activeFilter.value = null;
      if (existingFilterValues != null) {
        // restore the previous filters, if any
        existingFilterValues.forEach((v, k) => {
          const currentFilter = this._geoGrid.filters[k];
          if (isArray(currentFilter)) {
            currentFilter.forEach((f, i) => f.value = v[i]);
          } else {
            currentFilter.value = v;
          }
        });
      }
      this._geoGrid._filter();
    } else {
      this._geoGrid.exportCSV();
    }
  }

  trackSortMeta(event: { multisortmeta: SortMeta[] }) : void {
    this.trackedSort = Array.from(event.multisortmeta);
  }
}
