import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren, ViewEncapsulation } from '@angular/core';
import { distinctArray, mapArray, resolveFieldData, roundTo } from '@val/common';
import { ImpClientLocationTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';
import { GridGeoVar } from 'app/impower-datastore/state/transient/transient.reducer';
import { SortMeta } from 'primeng/api';
import { SelectItem } from 'primeng/components/common/selectitem';
import { FilterUtils } from 'primeng/components/utils/filterutils';
import { ObjectUtils } from 'primeng/components/utils/objectutils';
import { MultiSelect } from 'primeng/multiselect';
import { Table } from 'primeng/table';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, publishReplay, refCount, tap } from 'rxjs/operators';
import { FieldContentTypeCodes } from '../../impower-datastore/state/models/impower-model.enums';
import { GeoAttribute } from '../../impower-datastore/state/transient/geo-attributes/geo-attributes.model';
import { AppStateService } from '../../services/app-state.service';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { FilterData, TableFilterNumericComponent } from '../common/table-filter-numeric/table-filter-numeric.component';
import { FlatGeo } from '../geofootprint-geo-panel/geofootprint-geo-panel.component';

export interface ColMetric {
  tot:  number;
  cnt?: number;
  min?: number;
  max?: number;
  avg?: number;
}

interface AttributeEntity { [geocode: string] : GeoAttribute; }

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private exportAllText = 'All';
   private exportAllTip  = 'Export all geos. (Selected & Deselected)';
   private exportFilteredText = 'Filtered';
   private exportFilteredTip  = 'Export geos filtered in the grid.  (Selected & Deselected)';

   private filterAllIcon = 'fa fa-check-square';
   private filterSelectedIcon = 'fa fa-check-square-o';
   private filterDeselectedIcon = 'fa fa-square';
   private filterAllTip = 'Selected & Deselected';
   private filterSelectedTip = 'All Selected';
   private filterDeselectedTip = 'All Deselected';

   private gridUpdateFlag: boolean;
   public  exportAllButtonText: string = this.exportAllText;
   public  exportAllButtonTip:  string = this.exportAllTip;
   public  filterIsSelected: boolean = true;

   @Input('impProject')
   set project(val: ImpProject) {
      this.projectBS$.next(val);
   }

   @Input('audiences')
   set audiences(val: Audience[]) {
      this.allAudiencesBS$.next(val);
   }

   @Input('impProjectVars')
   set pVars(val: ImpProjectVar[]) {
      this.allProjectVarsBS$.next(val);
   }

   @Input('impGeofootprintLocations')
   set locs(val: ImpGeofootprintLocation[]) {
      this.gridStats = {...this.gridStats, numLocs: (val != null) ? val.length : 0};
      this.allLocationsBS$.next(val.filter(loc => loc.isActive));
   }

   @Input('impGeofootprintGeos')
   set geos(val: ImpGeofootprintGeo[]) {
      this.allGeosBS$.next(val);
   }

   @Input('mustCoverGeos')
   set mustCovers(val: string[]) {
      this.allMustCoversBS$.next(val);
   }

   @Input('impGeofootprintGeoAttribs')
   set geoAttribs(val: AttributeEntity) {
      this.allAttributesBS$.next(val);
   }

   @Input('impGeofootprintVars')
   set geoVars(val: GeoVar[]) {
     this.allVarsBS$.next(val);
   }

   @Input('variableColOrder')
   set variableColOrder(val: Map<string, number>) {
      this._varColOrder = val;
      this.varColOrderBS$.next(val);
   }

   get variableColOrder() {
      return this._varColOrder;
   }

   @Output()
   onZoomGeo: EventEmitter<ImpGeofootprintGeo> = new EventEmitter<ImpGeofootprintGeo>();

   @Output()
   onDeleteGeo: EventEmitter<ImpGeofootprintGeo> = new EventEmitter<ImpGeofootprintGeo>();

   @Output()
   onSelectGeo: EventEmitter<any> = new EventEmitter<any>();

   @Output()
   onDedupeToggle: EventEmitter<any> = new EventEmitter<any>();

   @Output()
   onSetAllGeos: EventEmitter<any> = new EventEmitter<any>();

   @Output()
   onSetFilteredGeos: EventEmitter<any> = new EventEmitter<any>();

   @Output()
   onForceRedraw: EventEmitter<any> = new EventEmitter<any>();

   // Get the grid as a view child to attach custom filters
   @ViewChild('geoGrid', { static: true }) public _geoGrid: Table;

   // Get grid filter components to clear them
   @ViewChildren('filterMs') msFilters: QueryList<MultiSelect>;
   @ViewChildren('filterNm') nmFilters: QueryList<TableFilterNumericComponent>;

   // Input Behavior subjects
   private projectBS$        = new BehaviorSubject<ImpProject>(null);
   private allAudiencesBS$   = new BehaviorSubject<Audience[]>([]);
   private allProjectVarsBS$ = new BehaviorSubject<ImpProjectVar[]>([]);
   private allLocationsBS$   = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
   private allGeosBS$        = new BehaviorSubject<ImpGeofootprintGeo[]>([]);
   private allMustCoversBS$  = new BehaviorSubject<string[]>([]);
   private allAttributesBS$  = new BehaviorSubject<AttributeEntity>(null);
   private allVarsBS$        = new BehaviorSubject<GeoVar[]>([]);
   private varColOrderBS$    = new BehaviorSubject<Map<string, number>>(new Map<string, number>());
   private listCollapse$: Observable<boolean>;

   // Data store observables
   private project$: Observable<ImpProject>;
   private allAudiences$: Observable<Audience[]>;
   private allProjectVars$: Observable<ImpProjectVar[]>;
   private allLocations$: Observable<ImpGeofootprintLocation[]>;
   private allGeos$: Observable<ImpGeofootprintGeo[]>;
   private allMustCovers$: Observable<string[]>;
   private allAttributes$: Observable<AttributeEntity>;
   private allVars$: Observable<GeoVar[]>;

   // FlatGeo grid observables
   public  allImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  displayedImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

   // Variable column order observable
   private _varColOrder: Map<string, number> = new Map();

   public  gridValues$: Observable<any[]>;
   public  gridFilter$: Observable<any[]>;

   // Observables for unique values to filter on in the grid
   public  uniqueCity$: Observable<SelectItem[]>;
   public  uniqueState$: Observable<SelectItem[]>;
   public  uniqueMarket$: Observable<SelectItem[]>;
   public  uniqueOwnerGroup$: Observable<SelectItem[]>;
   public  uniqueCoverageDesc$: Observable<SelectItem[]>;
   public  uniqueDma$: Observable<SelectItem[]>;

   // Track unique values for text variables for filtering
   public  uniqueTextVals: Map<string, SelectItem[]> = new Map();
   public  variableRanges: Map<string, number[]> = new Map();

   // Header filter
   public  headerFilter: boolean = true;
   public  defaultLabel: string = 'All';

   // Filter Ranges
   public  hhcRanges: number[] = [null, null];
   public  allocHhcRanges: number[] = [null, null];
   public  investmentRanges: number[] = [null, null];
   public  allocInvestmentRanges: number[] = [null, null];
   public  distanceRanges: number[] = [null, null];
   public  cpmRanges: number[] = [null, null];

   // Filtered Totals
   public  gridTotals: Map<string, ColMetric> = new Map<string, ColMetric>();

   // Filter selected rows
   public  isSelectedFilterState: string = this.filterAllIcon;
   public  isSelectedToolTip: string = this.filterAllTip;

   // Grid Column Variables
   public flatGeoGridColumns: any[] =
   [{field: 'geo.impGeofootprintLocation.locationNumber', header: 'Number',          width: '5em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locationName',   header: 'Name',            width: '8em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.marketName',     header: 'Market',          width: '8em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locAddress',     header: 'Address',         width: '14em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locCity',        header: 'City',            width: '9em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locState',       header: 'State',           width: '4em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locZip',         header: 'ZIP',             width: '4em',   matchMode: 'contains', styleClass: ''},
    {field: 'home_geo',                                   header: 'Home Geo',        width: '4em',   matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'isMustCover',                                header: 'Must Cover',      width: '4em',   matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'geo.distance',                               header: 'Dist',            width: '4em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'geo.geocode',                                header: 'Geocode',         width: '9em',   matchMode: 'contains', styleClass: ''},
    {field: 'city_name',                                  header: 'Geo City, State', width: '10em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.hhc',                                    header: 'HHC',             width: '7em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'allocHhc',                                   header: 'HHC Allocated',   width: '7em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'cpm',                                        header: 'CPM',             width: '5.5em', matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'investment',                                 header: 'Inv',             width: '7em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'allocInvestment',                            header: 'Inv Allocated',   width: '7em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'ownergroup',                                 header: 'Owner Group',     width: '7em',   matchMode: 'contains', styleClass: ''},
    {field: 'coveragedescription',                        header: 'Cov Desc',        width: '12em',  matchMode: 'contains', styleClass: ''},
    {field: 'pob',                                        header: 'POB',             width: '4em',   matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'dma',                                        header: 'DMA',             width: '10em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.isDeduped',                              header: 'In Deduped',      width: '6em',   matchMode: 'contains', styleClass: 'val-text-center'},
   ];

   public  flatGeoGridExtraColumns: any[];
   public  selectedColumns: any[] = [];
   public  columnOptions: SelectItem[] = [];

   // Control table cell / header wrapping
   private tableWrapOn: string = 'val-table val-tbody-wrap';
   private tableWrapOff: string = 'val-table val-tbody-nowrap';
   public  tableWrapStyle: string = this.tableWrapOff;
   public  tableWrapIcon: string = 'ui-icon-menu';
   public  tableHdrSlice: boolean = false;

   // Private component variables
   private varCache: any;

   // Miscellaneous variables
   public  gridStats = {
      numLocs: 0,
      numLocsActive: 0,
      numGeos: 0,
      numGeosActive: 0,
      numGeosInactive: 0
   };
   private lastProjectId: number;
   public  multiSortMeta: Array<SortMeta>;

   // Duplicate Geos filter variables
   public  dedupeGrid: boolean = false;
   public  dupeCount: number = 0;
   public  dupeMsg: string;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private logger: LoggingService,
               private appStateService: AppStateService) { }

   ngOnInit()
   {
      this.listCollapse$ = this.appStateService.getCollapseObservable();
      this.listCollapse$.subscribe(collapseFlag => this.gridUpdateFlag = collapseFlag);

      // Observe the behavior subjects on the input parameters
      this.project$ = this.projectBS$.asObservable();
      this.allAudiences$ = this.allAudiencesBS$.asObservable();
      this.allProjectVars$ = this.allProjectVarsBS$.asObservable();
      this.allLocations$ = this.allLocationsBS$.asObservable();
      this.allGeos$ = this.allGeosBS$.asObservable();
      this.allMustCovers$ = this.allMustCoversBS$.asObservable();
      this.allAttributes$ = this.allAttributesBS$.asObservable();
      this.allVars$ = this.allVarsBS$.asObservable();

      // Whenever the project changes, update the grid export file name
      this.project$.pipe(filter(p => p != null)).subscribe(project => {
         this._geoGrid.exportFilename = 'geo-grid' + ((project.projectId != null) ? '-' + project.projectId.toString() : '') + '-export';

         // In the event of a project load, clear the grid filters
         if (this.lastProjectId !== project.projectId) {
            this.lastProjectId = project.projectId;
            this.onClickResetFilters();
         }
      });

      // createComposite subscriptions
      this.allLocations$.subscribe(locs => this.gridStats = {...this.gridStats, numLocsActive: (locs != null) ? locs.filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site && loc.isActive).length : 0});

      // Remember that combineLatest is going to fire the pipe for each subscriber to allImpGeofootprintGeos$.  In the template, we have two | async values:
      // displayedImpGeofootprintGeos$ and selectedImpGeofootprintGeos$, which creates two subscribers.  This would fire createComposite twice, which is an expensive
      // operation.  The publishReplay is allows it to run once for the first subscriber, then the other uses the result of that.
      type createCompositeTuple = [ImpProject, Audience[], ImpProjectVar[], ImpGeofootprintGeo[], string[], AttributeEntity, GridGeoVar, Map<string, number>, boolean];

      this.allImpGeofootprintGeos$ = combineLatest<createCompositeTuple, createCompositeTuple>
        (this.projectBS$, this.allAudiences$, this.allProjectVars$, this.allGeos$, this.allMustCovers$, this.allAttributesBS$, this.allVars$, this.varColOrderBS$, this.listCollapse$, this.allLocations$)
        .pipe(tap(x => this.setGridTotals()),
              tap(x => this.syncHeaderFilter()),
              map(([discovery, audiences, projectVars, geos, mustCovers, attributes, vars, varColOrder]: createCompositeTuple) => {
                if (!this.gridUpdateFlag) {
                  return this.createComposite(discovery, audiences, projectVars, geos, mustCovers, attributes, vars, varColOrder);
                }
                return [];
              }),

              // Share the latest emitted value by creating a new behaviorSubject on the result of createComposite (The previous operator in the pipe)
              // Allows the first subscriber to run pipe and all other subscribers get the result of that
              publishReplay(1),
              refCount()       // Keeps track of all of the subscribers and tells publishReply to clean itself up
              //,tap(geoData => console.log("OBSERVABLE FIRED: allImpGeofootprintGeos$ - Geo Data changed (combineLatest)", geoData))
        );

      this.displayedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$
                                                  .pipe(map((AllGeos) => {
                                                        //console.log("OBSERVABLE FIRED: displayedImpGeofootprintGeos$");
                                                        return AllGeos.filter(flatGeo => flatGeo.geo.isDeduped === 1 || this.dedupeGrid === false); })
                                                       , tap(ActualGeos => {if (ActualGeos.length === 0) this.initializeState(); }));

      this.selectedImpGeofootprintGeos$ = this.displayedImpGeofootprintGeos$
                                              .pipe(map((AllGeos) => {
                                                //console.log("OBSERVABLE FIRED: selectedImpGeofootprintGeos$");
                                                this.gridStats = {...this.gridStats
                                                                  , numGeos:         (AllGeos != null) ? AllGeos.length : 0
                                                                  , numGeosActive:   (AllGeos != null) ? AllGeos.filter(flatGeo => flatGeo.geo.isActive === true).length : 0
                                                                  , numGeosInactive: (AllGeos != null) ? AllGeos.filter(flatGeo => flatGeo.geo.isActive === false).length : 0
                                                                 };
                                                return AllGeos.filter(flatGeo => flatGeo.geo.isActive === true); }));

      // Column Picker Model
      for (const column of this.flatGeoGridColumns) {
         this.columnOptions.push({ label: column.header, value: column });
         this.selectedColumns.push(column);
      }

      // Setup a custom filter for the grid
      FilterUtils['numericFilter'] = (value, f) : boolean => FilterData.numericFilter(value, f);
      FilterUtils['distanceFilter'] = (value, f) : boolean => FilterData.numericFilter(value, f, 2);

      this.gridValues$ = Observable.create(observer => observer.next(this._geoGrid._value));

      this.gridValues$.subscribe(data => {
        console.log('gridValues$ Observable fired');
        this.setGridTotals();
      });

      const subscribe = this.gridValues$.subscribe(val => {
         console.log('subscribe fired - ', val);
      });

      // ----------------------------------------------------------------------
      // Table filter observables
      // ----------------------------------------------------------------------

      // Create an observable for unique cities (By hand method)
      this.uniqueCity$ = this.allGeos$.pipe(map(geos => Array.from(new Set(geos.map(geo => geo.impGeofootprintLocation.locCity).sort()))
                                           .map(str => new Object({ label: str, value: str}) as SelectItem)));

      // Create an observable for unique states (By helper methods)
      this.uniqueState$ = this.allGeos$.pipe(mapArray(geo => geo.impGeofootprintLocation.locState)
                                            , distinctArray()
                                            , map(arr => arr.sort())
                                            , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique market names
      this.uniqueMarket$ = this.allGeos$.pipe(mapArray(geo => geo.impGeofootprintLocation.marketName)
                                             , distinctArray()
                                             , map(arr => arr.sort())
                                             , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      const attributeArray$ = this.allAttributes$.pipe(map(entity => Object.values(entity) as GeoAttribute[]));
      // Create an observable for unique owner groups
      this.uniqueOwnerGroup$ = attributeArray$.pipe(mapArray(attribute => attribute['owner_group_primary'])
                                                       , distinctArray()
                                                       , map(arr => arr.sort())
                                                       , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique coverage description
      this.uniqueCoverageDesc$ = attributeArray$.pipe(mapArray(attribute => attribute['cov_desc'])
                                                         , distinctArray()
                                                         , map(arr => arr.sort())
                                                         , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique coverage description
      this.uniqueDma$ = attributeArray$.pipe(mapArray(attribute => attribute['dma_name'])
                                                , distinctArray()
                                                , map(arr => arr.sort())
                                                , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      this.initializeGridTotals();
      this.initializeState();
   }

   ngOnDestroy()
   {
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
   public getGeoTooltip(flatGeo: FlatGeo) : string
   {
      let result: string = null;

      if (flatGeo == null || flatGeo.geo == null)
         return result;

      if (flatGeo.geo.isActive === false && flatGeo.geo['filterReasons'] == null)
         result = 'Filtered manually';
      else
         if (flatGeo.geo.isActive === true && flatGeo.geo['filterReasons'] != null && flatGeo.geo['filterReasons'].length > 0)
            result = '*** Manual Override ***\n' + flatGeo.geo['filterReasons'];
         else
            if (flatGeo.geo['filterReasons'] != null)
               result = flatGeo.geo['filterReasons'];
            else
               result = null;
      // console.log('ToolTip: [' + result + '] getGeoTooltip: flatGeo: ', flatGeo.geo.geocode, ', filterReasons: ', flatGeo['filterReasons'], ', geo.filterReasons: ', flatGeo.geo['filterReasons']);
      return result;
   }

   /**
    * Initializes various state variables
    */
   initializeState() {
      //console.log('geoGrid - initializeState - fired');
      this.gridStats.numGeos = 0;
      this.gridStats.numGeosActive = 0;
      this.gridStats.numGeosInactive = 0;

      this.dedupeGrid = false;
      this.dupeCount = 0;
      this.dupeMsg = '';

      this.hhcRanges = [null, null];
      this.allocHhcRanges = [null, null];
      this.investmentRanges = [null, null];
      this.allocInvestmentRanges = [null, null];
      this.distanceRanges = [null, null];
      this.cpmRanges = [null, null];

      this._geoGrid.reset();
      this._varColOrder = {...this._varColOrder};

      // Initialize the default sort order
      this.multiSortMeta = [];
      this.multiSortMeta.push({field: 'geo.impGeofootprintLocation.locationNumber', order: 1});
      this.multiSortMeta.push({field: 'geo.distance', order: 1});
   }

   /**
    *  Initializes the accumulators for the totals located at the bottom of the column
    */
   initializeGridTotals() {
      //console.log('initializeGridTotals - fired');
      this.gridTotals = new Map<string, ColMetric>();
      this.gridTotals.set('hhc',             {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('allocHhc',        {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('cpm',             {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('investment',      {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('allocInvestment', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('distance',        {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
   }

   debugLogGridTotals() {
      console.log('total distance:             ', this.gridTotals.get('distance'));
      console.log('total hhc:                  ', this.gridTotals.get('hhc'));
      console.log('total allocated hhc:        ', this.gridTotals.get('allocHhc'));
      console.log('total investment:           ', this.gridTotals.get('investment'));
      console.log('total allocated investment: ', this.gridTotals.get('allocInvestment'));
      console.log('total cpm:                  ', this.gridTotals.get('cpm'));
   }

   /**
    * createComposite produces a list of FlatGeos.  These are a flattened view of the geographies,
    * having pivoted up the variables and attributes to their respective geographies.
    */
   createComposite(project: ImpProject, audiences: Audience[], projectVars: ImpProjectVar[], geos: ImpGeofootprintGeo[], mustCovers: string[],
                   geoAttributes: AttributeEntity, gridGeoVars: GridGeoVar, varColOrder: Map<string, number>, collapsed?: boolean) : FlatGeo[]
   {
      if (geos == null || geos.length === 0) {
        this.initializeGridTotals();
        return [];
      }
      console.log('createComposite:',
                  ' geos:' , (geos.length),
                  ' must covers:' , ((mustCovers != null) ? mustCovers.length : null),
                  ' projectVars: ', ((projectVars != null) ? projectVars.length : null),
                  ' geo vars:' , ((gridGeoVars != null) ? gridGeoVars.geoVars.length : null),
      );
      // DEBUG: See additional parameters
      // console.log('createComposite: varColOrder: ', varColOrder
      //            ,' project: ', project
      //            ,' smAnneCpm: ' + project.smAnneCpm + ', smSoloCpm: ' + project.smSoloCpm + ', smValassisCpm: ' + project.smValassisCpm);

      let min: number;
      let max: number;
      let fgId = 0; // fgId is a fabricated flat geo id used by turbo grid to uniquely identify a row for filtering and selection
      const geoGridData: FlatGeo[] = [];
      this.flatGeoGridExtraColumns = [];

      this.variableRanges = new Map<string, number[]>();
      audiences.forEach(audience => {
        this.variableRanges.set(audience.audienceIdentifier, [null, null]);
        this.uniqueTextVals.set(audience.audienceIdentifier, null);
      });

      gridGeoVars.ranges.forEach((value, varPk) => {
        const n = varPk.indexOf(':');
        const key = varPk.substr(n + 1);
        this.variableRanges.set(key, [(value.min != null) ? Math.floor(value.min) : null, (value.max != null) ? Math.ceil(value.max) : null]);
      });
      //gridGeoVars.lov.forEach((value, key) => this.variableRanges.set(key, [null, null]));

      // Store the unique values in a map keyed by the variable pk
      this.uniqueTextVals = new Map<string, SelectItem[]>();
      gridGeoVars.lov.forEach((value, key) => {
        this.variableRanges.set(key, [null, null]);
        this.uniqueTextVals.set(key, value.map(varVal => ({ label: varVal, value: varVal} as SelectItem)));
      });

      // Debug
      // console.log("-".padEnd(80, "-"));
      // console.log("VARIABLE RANGES");
      // console.log("-".padEnd(80, "-"));
      // this.variableRanges.forEach((value, key, map) => console.log(`m[${key}] = ${value}`));
      // console.log("-".padEnd(80, "-"));

      // Clear out the filtered values so it will rebuild them, especially when a filter is cleared
      this._geoGrid.filteredValue = null;

      // Initialize grid totals & numDupes
      this.initializeGridTotals();
      this.dupeCount = 0;

      // Create a map, keyed by geocode to store the sites in order to count them up at the end
      const geoSites: Map<string, Set<string>> = new Map();

      // Create grid columns for the variables
      audiences.forEach(audience => {
        //console.log('### createComposite - aud:', audience);
        let colWidth: number = Math.min(200, Math.max(60, (audience.audienceName.length * 6) + 24));
        const colStyleClass: string = (audience.fieldconte !== FieldContentTypeCodes.Char) ? 'val-text-right' : '';

        // Let the fieldConte decide what the match operator will be on the numeric filter
        let matchOper: string;
        switch (audience.fieldconte) {
          // SAMPLE: This is setup this way to show we can have different filters, per fieldconte value
          // case 'PERCENT':
          //    matchOper = ">=";
          //    break;
          default:
            matchOper = 'between';
            break;
        }

        // If more than one variable has this audience name, add the source name to the header
        const dupeNameCount = audiences.filter(aud => aud.audienceName === audience.audienceName).length;
        if (dupeNameCount > 1)
          colWidth = (audience.audienceSourceName.length + 3 > audience.audienceName.length) ? Math.min(200, Math.max(60, (audience.audienceSourceName.length + 3) * 6 + 24)) : colWidth;

        this.flatGeoGridExtraColumns.push({field: audience.audienceIdentifier,
                                           header: audience.audienceName + ((dupeNameCount > 1) ? ' (' + audience.audienceSourceName + ')' : ''),
                                           width: colWidth + 'px',
                                           fieldname: audience.audienceName,
                                           decimals:  ['PERCENT', 'RATIO'].includes(audience.fieldconte) ? 2 : 0,
                                           fieldConte: audience.fieldconte,
                                           matchType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes(audience.fieldconte)) ? 'numeric' : 'text',
                                           matchOper: matchOper,
                                           matchMode: 'contains', styleClass: colStyleClass, sortOrder: audience.seq, sourceType: audience.audienceSourceType});
      });

      // For every geo, create a FlatGeo to pivot up the variables and attributes
      const varPkSet = new Set<number>();
      projectVars.forEach(pv => varPkSet.add(pv.varPk));

      geos.filter(geo => geo.impGeofootprintLocation && geo.impGeofootprintTradeArea && geo.impGeofootprintLocation.isActive && geo.impGeofootprintTradeArea.isActive).forEach(geo => {
         const gridGeo: FlatGeo = new Object() as FlatGeo;
         gridGeo.geo = geo;
         gridGeo.fgId = fgId++;

         // Is the geo a must cover?
         if (mustCovers != null && mustCovers.includes(geo.geocode))// && geo.rank === 0)
            gridGeo['isMustCover'] = '1';
         else
            gridGeo['isMustCover'] = '0';

         // Count dupes for display
         this.dupeCount += (gridGeo.geo.isDeduped === 1) ? 0 : 1;

         // Grid doesn't work well with child values.  Can use resolveFieldData in the template, but then filtering doesn't work
         this.flatGeoGridColumns.forEach(col => {
            gridGeo[col.field] = resolveFieldData(gridGeo, col.field) || '';
         });

         // Track sites per geo, but only for deduped geos
         if (geo.isDeduped === 0 && gridGeo.geo.impGeofootprintLocation != null && gridGeo.geo.impGeofootprintLocation.locZip != null) {
            const id = resolveFieldData(gridGeo, 'geo.impGeofootprintLocation.glId');
            if (!geoSites.has(geo.geocode))
               geoSites.set(geo.geocode, new Set([geo.impGeofootprintLocation.locationNumber]));
            else
               if (geoSites.get(geo.geocode).has(geo.impGeofootprintLocation.locationNumber) === false)
                  geoSites.get(geo.geocode).add(geo.impGeofootprintLocation.locationNumber);
         }

         if (gridGeo.geo.impGeofootprintLocation != null && gridGeo.geo.impGeofootprintLocation.locZip != null) {
           gridGeo.geo.impGeofootprintLocation.locZip = gridGeo.geo.impGeofootprintLocation.locZip.slice(0, 5);
         }

         // Add attributes the grid is interested in and massage them where needed
         const currentAttribute = geoAttributes[geo.geocode];
         if (currentAttribute != null)
         {
            gridGeo['pob'] = (currentAttribute['pob'] === 'B') ? 'Y' : 'N';
            gridGeo['coveragedescription'] = (currentAttribute['cov_desc'] == null) ? '' : currentAttribute['cov_desc'] ;
            gridGeo['dma'] = (currentAttribute['dma_name'] == null) ? '' : currentAttribute['dma_name'];
            gridGeo['ownergroup'] = (currentAttribute['owner_group_primary'] == null) ? '' : currentAttribute['owner_group_primary'];

            const cityName = currentAttribute['city_name'];
            if (cityName != null && typeof cityName === 'string') {
              gridGeo['city_name'] = cityName.substring(0, 1).toUpperCase() + cityName.substring(1, cityName.length - 3).toLowerCase() + ' ' + cityName.substring(cityName.length - 2);
            }

            if (project.estimatedBlendedCpm != null)
               gridGeo['cpm'] = project.estimatedBlendedCpm;
            else
               switch (currentAttribute['owner_group_primary'])
               {
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

         if (gridGeoVars != null && gridGeoVars.geoVars != null && gridGeoVars.geoVars.hasOwnProperty(geo.geocode)){
            for (const [varPk, varValue] of Object.entries(gridGeoVars.geoVars[geo.geocode])) {
               const n = varPk.indexOf(':');
               const location = varPk.substr(0, n);
               const pk = varPk.substr(n + 1);
               if (location == null || location === '' || gridGeo.geo.impGeofootprintLocation.locationNumber === location)
                  gridGeo[pk] = varValue;

               // Hack to prevent empty columns because geovars structure isn't getting cleared out on new project
               const pv = projectVars.filter(findPv => findPv.varPk.toString() === varPk);
               }
         }
         else{
            varPkSet.forEach(pvID => {
                  if (!gridGeo[pvID]){
                     gridGeo['geocode'] = geo.geocode;
                     gridGeo[pvID] = '';
                  }
               });
         }

         // Set the tooltip for the geography
         gridGeo['tooltip'] = this.getGeoTooltip(gridGeo);

        // Update geos with the dupecount
        if (geoSites != null && geoSites.has(gridGeo.geo.geocode)) {
          gridGeo['sitesTooltip'] = gridGeo.geo.geocode + ' is in ' + (geoSites.get(gridGeo.geo.geocode).size + 1) + ' sites';
        } else {
          gridGeo['sitesTooltip'] = gridGeo.geo.geocode + ' is in 1 site';
        }

         geoGridData.push(gridGeo);
      });

      // Clear out the temporary map of sites for geos
      if (geoSites != null)
         geoSites.clear();

      // Code changes to display variables with no data in Grid
      /* if(missingVars.length > 0 ){
         missingVars.forEach(v =>
            this.flatGeoGridExtraColumns.push({field: v.varPk.toString(), header: this.getProjectVarFieldName(v), matchMode: 'contains', sortOrder: v.sortOrder, styleClass: 'val-text-right', width: '100px'})
         )}
       */
      // Set Ranges
      try
      {
          min = geoGridData.reduce((currMin, p: FlatGeo) => p['geo.hhc'] < currMin ? (p['geo.hhc'] !== '' ? p['geo.hhc'] : 0) : currMin, (geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
          max = geoGridData.reduce((currMax, p: FlatGeo) => p['geo.hhc'] > currMax ? (p['geo.hhc'] !== '' ? p['geo.hhc'] : 0) : currMax, (geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
          this.hhcRanges = [min, max, min, max];

          min = geoGridData.reduce((currMin, p: FlatGeo) => p['allocHhc'] < currMin ? (p['allocHhc'] !== '' ? p['allocHhc'] : 0) : currMin, (geoGridData.length > 0) ? geoGridData[0]['allocHhc'] : 0);
          max = geoGridData.reduce((currMax, p: FlatGeo) => p['allocHhc'] > currMax ? (p['allocHhc'] !== '' ? p['allocHhc'] : 0) : currMax, (geoGridData.length > 0) ? geoGridData[0]['allocHhc'] : 0);
          this.allocHhcRanges = [min, max, min, max];

          min = geoGridData.reduce((currMin, p: FlatGeo) => p['investment'] < currMin ? p['investment'] : currMin, (geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
          max = geoGridData.reduce((currMax, p: FlatGeo) => p['investment'] > currMax ? p['investment'] : currMax, (geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
          this.investmentRanges = [min, max, min, max];

          max = geoGridData.reduce((currMax, p: FlatGeo) => p['allocInvestment'] > currMax ? p['allocInvestment'] : currMax, (geoGridData.length > 0) ? geoGridData[0]['allocInvestment'] : 0);
          min = geoGridData.reduce((currMin, p: FlatGeo) => p['allocInvestment'] < currMin && p['allocInvestment'] != null ? p['allocInvestment'] : currMin, max);
          this.allocInvestmentRanges = [min, max, min, max];

          min = geoGridData.reduce((currMin, p: FlatGeo) => roundTo(p['geo.distance'], 2) < currMin ? roundTo(p['geo.distance'], 2) : currMin, (geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
          max = geoGridData.reduce((currMax, p: FlatGeo) => roundTo(p['geo.distance'], 2) > currMax ? roundTo(p['geo.distance'], 2) : currMax, (geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
          this.distanceRanges = [min, max, min, max];

          min = geoGridData.reduce((currMin, p: FlatGeo) => p['cpm'] < currMin ? p['cpm'] : currMin, (geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
          max = geoGridData.reduce((currMax, p: FlatGeo) => p['cpm'] > currMax ? p['cpm'] : currMax, (geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
          this.cpmRanges = [min, max, min, max];
      }
      catch (e)
      {
         console.error('Error setting range: ', e);
      }
      // console.log("distanceRanges: ", this.distanceRanges);

      // Sort the geo variable columns
      this.sortFlatGeoGridExtraColumns();

      // Rebuild Selected columns including the variable columns
      this.selectedColumns = [];
      for (const column of this.flatGeoGridColumns) {
         this.selectedColumns.push(column);
      }
      this.flatGeoGridExtraColumns.forEach(column => this.selectedColumns.push(column));

      // Update geo grid total columns
      this.setGridTotals(geoGridData);

      //console.table(geoGridData);
      return geoGridData;
   }

   public sortFlatGeoGridExtraColumns() {
      // Sort the array of columns
      this.flatGeoGridExtraColumns.sort((a, b) => this.sortVarColumns(a, b));
   }

   public sortVarColumns (a, b) : number
   {
      const aValue: number = a['sortOrder'];
      const bValue: number = b['sortOrder'];

      if (a == null || b == null || aValue == null || bValue == null)
         return 0;

      if (aValue === bValue)
         return 0;
      else
         if (aValue > bValue)
            return 1;
         else
            return -1;
   }

   /**
    * Ensures that the header checkbox is in sync with the actual state of the geos.isActive flag.
    * If one geo is inactive, then the header checkbox is unselected.  If all geos are selected, its checked.
    */
   public syncHeaderFilter() {
      if (this._geoGrid.filteredValue != null)
         this.headerFilter = !this._geoGrid.filteredValue.some(flatGeo => flatGeo.geo.isActive === false);
      else
         this.headerFilter = !this._geoGrid._value.some(flatGeo => flatGeo.geo.isActive === false);
   }

   public applyHeaderFilter() {
      if (this._geoGrid.filteredValue != null)
         this.onSetFilteredGeos.emit({value: this.headerFilter, geos: this._geoGrid.filteredValue.map(flatGeo => flatGeo.geo)});
      else
        this.onSetAllGeos.emit({value: this.headerFilter});
   }


   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
   public onZoomToGeo(flatGeo: FlatGeo)
   {
      if (flatGeo != null && flatGeo.geo != null)
         this.onZoomGeo.emit(flatGeo.geo);
   }

   public onClickDeleteGeo(flatGeo: FlatGeo)
   {
      if (flatGeo != null && flatGeo.geo != null)
         this.onDeleteGeo.emit(flatGeo.geo);
   }

   onClickSelectGeocode(event: any, isSelected: boolean)
   {
      const geo: ImpGeofootprintGeo = (event.data.geo as ImpGeofootprintGeo);

      if (geo != null)
         this.onSelectGeo.emit({ geo: geo, isSelected: isSelected });
   }

/* Unused, thinking about overwriting this behavior in the grid
   toggleRowsWithCheckbox(event: Event, check: boolean) {
      if (this._geoGrid != null)
      {
         this._geoGrid._selection = this._geoGrid.filteredValue ? this._geoGrid.filteredValue.slice(): this._geoGrid.value.slice();
         this._geoGrid.preventSelectionSetterPropagation = true;
         this._geoGrid.updateSelectionKeys();
      }
   }*/

   // toggleRowWithCheckbox from turbotable src (currently unused, experimental)
   gridToggleRowWithCheckbox(event, rowData: any) {
      //console.log('gridToggleRowWithCheckbox - rowData: ', rowData);
      this._geoGrid.selection = this._geoGrid.selection || [];
      const selected = this._geoGrid.isSelected(rowData);
      const dataKeyValue = this._geoGrid.dataKey ? ObjectUtils.resolveFieldData(rowData, this._geoGrid.dataKey) : null;
      this._geoGrid.preventSelectionSetterPropagation = true;

      if (selected) {
          const selectionIndex = this._geoGrid.findIndexInSelection(rowData);
          this._geoGrid._selection = this._geoGrid.selection.filter((val, i) => i !== selectionIndex);
          this._geoGrid.selectionChange.emit(this._geoGrid.selection);
//        this._geoGrid.onRowUnselect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
          if (dataKeyValue) {
              delete this._geoGrid.selectionKeys[dataKeyValue];
          }
      }
      else {
          this._geoGrid._selection = this._geoGrid.selection ? [...this._geoGrid.selection, rowData] : [rowData];
          this._geoGrid.selectionChange.emit(this._geoGrid.selection);
//        this._geoGrid.onRowSelect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
          if (dataKeyValue) {
              this._geoGrid.selectionKeys[dataKeyValue] = 1;
          }
      }

      this._geoGrid.tableService.onSelectionChange();
   }

   // Currently Experimental (Enable debug button in template)
   syncGridSelection() {
      //console.log('syncGridSelection - fired ');

      let diffCount: number = 0;
      let matchCount: number = 0;

      // Initialize the selection array
      this._geoGrid.selection = this._geoGrid.selection || [];

      // Loop through the grid values, looking at isActive to determine if selected or not
      this._geoGrid.value.forEach (geo => {

         // Determine if the row provided is selected
         const selected = this._geoGrid.isSelected(geo);

         // If there is a difference between what the grid has selected and what the data indicates
         if (selected !== (geo.isActive === 1))
         {
            console.log('grid and data mismatch: grid: ', selected ? 'selected' : 'unselected', ', data: ', (geo.isActive === 1) ? 'selected' : 'unselected');
            diffCount++;

            // Get the dataKeyValue of the row provided
            const dataKeyValue = this._geoGrid.dataKey ? ObjectUtils.resolveFieldData(geo, this._geoGrid.dataKey) : null;
            this._geoGrid.preventSelectionSetterPropagation = true;

            // If that row is selected, filter it out of selection
            if (geo.isActive === 1) {
               //console.log('setting unselected row to selected');
               const selectionIndex = this._geoGrid.findIndexInSelection(geo);
               this._geoGrid._selection = this._geoGrid.selection.filter((val, i) => i !== selectionIndex);
               this._geoGrid.selectionChange.emit(this._geoGrid.selection);
         //    this._geoGrid.onRowUnselect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
               if (dataKeyValue) {
                  delete this._geoGrid.selectionKeys[dataKeyValue];
               }
            }
            else
            // The row was not selected, add it into selection
            {
               //console.log('setting selected row to unselected');
               this._geoGrid._selection = this._geoGrid.selection ? [...this._geoGrid.selection, geo] : [geo];
               this._geoGrid.selectionChange.emit(this._geoGrid.selection);
         //    this._geoGrid.onRowSelect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
               if (dataKeyValue) {
                  this._geoGrid.selectionKeys[dataKeyValue] = 1;
               }
            }
         }
         else
            matchCount++;
      });

      // Tell the service that selection has changed
//      if (diffCount > 0)
         this._geoGrid.tableService.onSelectionChange();

         this._geoGrid._selection = this._geoGrid.selection.map(x => Object.assign({}, x));

         this._geoGrid.value = this._geoGrid.value.map(x => Object.assign({}, x));
// Works, but overkill         this.impGeofootprintGeoService.makeDirty();
      //console.log('sync finished - matches: ', matchCount, ', differences: ', diffCount);
   }

   // Experimental enable as replacement for p-tableHeaderCheckbox in template
   onToggleFilteredGeocodes(checked: boolean) {
         //console.log('onToggleFilteredGeocodes - All Geos isActive set to: ', checked);
         let toggleCount: number = 0;
         //this.impGeofootprintGeoService.setActive(this.impGeofootprintGeoService.get(), event.checked);
         if (this._geoGrid != null)
         {
            if (this._geoGrid.filteredValue != null)
            {
               this._geoGrid.toggleRowsWithCheckbox(null, true);
               this._geoGrid.filteredValue.forEach(geo => {
                  toggleCount++;
                  geo.isActive = (checked) ? 1 : 0;
                  this._geoGrid.toggleRowWithCheckbox(event, geo);
               });
               //console.log('filtered set ' + toggleCount + ' geos');
            }
            else
            {
               // this._geoGrid.value.forEach(geo => geo.isActive = (checked) ? 1 : 0);
               this._geoGrid.value.forEach(geo => {
                  toggleCount++;
                  geo.isActive = (checked) ? 1 : 0;
                  this._geoGrid.toggleRowWithCheckbox(event, geo);
               });
               //console.log('all set ' + toggleCount + ' geos');
            }
         }
         else
            console.log('No geos to set');
   }

   onClickDedupeToggle(event: any, geoGrid)
   {
      this.onDedupeToggle.emit(event);
   }

   onFilter(event: any)
   {
      this.syncHeaderFilter();
      this.setGridTotals();
      const noFilters: boolean = event == null || event.filters == null || (Object.keys(event.filters).length === 0 && event.filters.constructor === Object);
      if (noFilters) {
        this.exportAllButtonText = this.exportAllText;
        this.exportAllButtonTip  = this.exportAllTip;
      }
      else {
        this.exportAllButtonText = this.exportFilteredText;
        this.exportAllButtonTip  = this.exportFilteredTip;
      }
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
      if (this._geoGrid.rows > 0) {
        this._geoGrid.filter(filterVal, 'geo.isActive', 'equals');
        this.onForceRedraw.emit();
      }
      this.onForceRedraw.emit();
   }

   /**
    * Clears out the filters from the grid and reset the filter components
    */
   onClickResetFilters()
   {
      // Clear the multi select filters
      if (this.msFilters)
         this.msFilters.forEach(ms => {
            ms.value = null;
            ms.valuesAsString = this.defaultLabel;
         });

      // Clear the custom numeric filters
      if (this.nmFilters)
         this.nmFilters.forEach(nm => {
            nm.clearFilter('');
         });

      // Reset the grid and grid filters
      this._geoGrid.reset();
      this.onFilter(null);

      // Reset the row selection filter
      this.isSelectedFilterState = this.filterAllIcon;
      this.isSelectedToolTip = this.filterAllTip;
   }

   onRemoveFilter(filterName: string) {
      console.log('-'.padEnd(80, '-'));
      console.log('onRemoveFilter: ', filterName);
      console.log('-'.padEnd(80, '-'));
      console.log('before: ', this._geoGrid.filters);
      delete this._geoGrid.filters[filterName];
      this.onForceRedraw.emit();
      console.log('after: ', this._geoGrid.filters);
      console.log('-'.padEnd(80, '-'));
      this._geoGrid.tableService.onSelectionChange();
   }

   /**
    * Utility method used by setGridTotals to reduce the complexity of it.
    * @param totalStr The key of the map to update
    * @param newValue The value to store in the map
    */
   private setGridTotal(totalStr: string, newValue: number) {
   if (newValue == null) newValue = 0;
     const val = (+this.gridTotals.get(totalStr).tot) + (+newValue);
     this.gridTotals.set(totalStr, {tot: val
                                   , min: (newValue < this.gridTotals.get(totalStr).min) ? newValue : this.gridTotals.get(totalStr).min
                                   , max: (newValue > this.gridTotals.get(totalStr).max) ? newValue : this.gridTotals.get(totalStr).max
                                   });
   }

   private setGridTotalSet (hhc: number, cpm: number, investment: number, distance: number, isDeduped: number) {
      this.setGridTotal('hhc',        hhc);
      this.setGridTotal('cpm',        cpm);
      this.setGridTotal('investment', investment);
      this.setGridTotal('distance',   distance);
      // Accumulate allocated counts
      if (isDeduped === 1) {
         this.setGridTotal('allocHhc',        hhc);
         this.setGridTotal('allocInvestment', investment);
      }
   }

   /**
    * Looks at the filtered and unfiltered arrays of the grid and computes totals for display at the
    * bottom of the column.
    */
   setGridTotals(flatGeos?: FlatGeo[]) {
      if (this._geoGrid == null || this._geoGrid._value == null || this._geoGrid._value.length === 0)
         return;

      //console.log('setGridTotals - Fired');

      // Initialize totals
      this.initializeGridTotals();

      let numRows: number = 0;
      try
      {
         if (flatGeos != null && flatGeos.length > 0)
         {
            //console.log('setGridTotals - using flatGeos');

            flatGeos.forEach(element => {
               if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {
                  this.setGridTotalSet (element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
                  numRows++;
               }});
         }
         else
         {
            if (this._geoGrid.filteredValue != null && this._geoGrid.filteredValue.length > 0)
            {
               //console.log('setGridTotals - using filtered list');
               //console.log('this.geoGrid: ', this._geoGrid);

               this._geoGrid.filteredValue.forEach(element => {
                  if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {
                     this.setGridTotalSet (element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
                     numRows++;
                  }});
            }
            else
            {
               //console.log('setGridTotals - using normal list - numRows: ', this._geoGrid._value.length);

               this._geoGrid._value.forEach(element => {
                  if (element.geo.isActive && (this.dedupeGrid === false || (this.dedupeGrid && element.geo.isDeduped === 1))) {

                    if (isNaN(element.geo.hhc)) {
                        element.geo.hhc = 0;
                     }

                     this.setGridTotalSet (element.geo.hhc, element['cpm'], element['investment'], element.geo.distance, element.geo.isDeduped);
                     numRows++;
                  }});
            }
         }
         // Calculated grid totals
         this.gridTotals.set('hhc', {...this.gridTotals.get('hhc')
                                    , avg: this.gridTotals.get('hhc').tot / numRows});

         this.gridTotals.set('allocHhc', {...this.gridTotals.get('allocHhc')
                                         , avg: this.gridTotals.get('allocHhc').tot / numRows});

         this.gridTotals.set('investment', {...this.gridTotals.get('investment')
                                           , avg: this.gridTotals.get('investment').tot / numRows});

         this.gridTotals.set('allocInvestment', {...this.gridTotals.get('allocInvestment')
                                                , avg: this.gridTotals.get('allocInvestment').tot / numRows});

         this.gridTotals.set('cpm', {...this.gridTotals.get('cpm')
                                    , avg: this.gridTotals.get('cpm').tot / numRows});

         this.gridTotals.set('distance', {...this.gridTotals.get('distance')
                                         , avg: this.gridTotals.get('distance').tot / numRows});
      }
      catch (e)
      {
         console.error('EXCEPTION: ', e);
         console.error('this._geoGrid', this._geoGrid);
         this.debugLogGridTotals();
      }
   }

   /**
    * Used to toggle the gizmo icon and styles used to turn word wrapping on and off in the grid
    */
   public onToggleTableWrap() {
      if (this.tableWrapStyle === this.tableWrapOn)
      {
         this.tableWrapStyle = this.tableWrapOff;
         this.tableWrapIcon = 'ui-icon-menu';
         //this.tableHdrSlice = true;  // Disabled to turn toggling of header wrapping off
      }
      else
      {
         this.tableWrapStyle = this.tableWrapOn;
         this.tableWrapIcon = 'ui-icon-wrap-text';
         //this.tableHdrSlice = false;
      }
   }

   debugPrintGrid() {
      console.log('Grid: ', this._geoGrid);
   }

   debugPrintInputs() {
      // console.log("impProject:                ", this.impProject);
      // console.log("impGeofootprintGeos:       ", this.impGeofootprintGeos);
      // console.log("impGeofootprintGeoAttribs: ", this.impGeofootprintGeoAttribs);
      // console.log("impGeofootprintVar:        ", this.impGeofootprintVars);
   }
}
