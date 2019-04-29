import { isString } from 'util';
import { GeoAttribute } from '../../impower-datastore/state/geo-attributes/geo-attributes.model';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { FlatGeo } from '../geofootprint-geo-panel/geofootprint-geo-panel.component';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren, QueryList, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, tap, refCount, publishReplay } from 'rxjs/operators';
import { SelectItem } from 'primeng/components/common/selectitem';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintVar } from '../../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { Table } from 'primeng/table';
import { FilterData, TableFilterNumericComponent } from '../common/table-filter-numeric/table-filter-numeric.component';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { MultiSelect, SortMeta } from 'primeng/primeng';
import { distinctArray, groupBy, groupByExtended, mapArray, resolveFieldData, roundTo, mapArrayToEntity, safe } from '@val/common';

export interface FlatGeo {
   fgId: number;
   geo: ImpGeofootprintGeo;
}

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
  styleUrls: ['./geofootprint-geo-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   @Input('impProject')
   set project(val: ImpProject) {
      this.projectBS$.next(val);
   }

   @Input('impProjectVars')
   set pVars(val: ImpProjectVar[]) {
      this.allProjectVarsBS$.next(val);
   }

   @Input('impGeofootprintLocations')
   set locs(val: ImpGeofootprintLocation[]) {
      this.allLocationsBS$.next(val);
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
   set geoVars(val: ImpGeofootprintVar[]) {
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
   @ViewChild('geoGrid') public _geoGrid: Table;

   // Get grid filter components to clear them
   @ViewChildren('filterMs') msFilters: QueryList<MultiSelect>;
   @ViewChildren('filterNm') nmFilters: QueryList<TableFilterNumericComponent>;

   // Input Behavior subjects
   private projectBS$        = new BehaviorSubject<ImpProject>(null);
   private allProjectVarsBS$ = new BehaviorSubject<ImpProjectVar[]>([]);
   private allLocationsBS$   = new BehaviorSubject<ImpGeofootprintLocation[]>([]);
   private allGeosBS$        = new BehaviorSubject<ImpGeofootprintGeo[]>([]);
   private allMustCoversBS$  = new BehaviorSubject<string[]>([]);
   private allAttributesBS$  = new BehaviorSubject<AttributeEntity>(null);
   private allVarsBS$        = new BehaviorSubject<ImpGeofootprintVar[]>([]);
   private varColOrderBS$    = new BehaviorSubject<Map<string, number>>(new Map<string, number>());

   // Data store observables
   private project$: Observable<ImpProject>;
   private allProjectVars$: Observable<ImpProjectVar[]>;
   private allLocations$: Observable<ImpGeofootprintLocation[]>;
   private allGeos$: Observable<ImpGeofootprintGeo[]>;
   private allMustCovers$: Observable<string[]>;
   private allAttributes$: Observable<AttributeEntity>;
   private allVars$: Observable<ImpGeofootprintVar[]>;

   // FlatGeo grid observables
   public  allImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  displayedImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

   // Variable column order observable
   private _varColOrder: Map<string, number> = new Map();
// private varColOrder$: Observable<Map<string, number>>;

   // Project variables index lookup
   private projectVarsDict: { [varpk: number] : ImpProjectVar };

   // Grid Observables for totals
   private gridValuesBS$ = new BehaviorSubject<any[]>([]);
   private gridFilterBS$ = new BehaviorSubject<any[]>([]);

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

   // Grid Column Variables
   public flatGeoGridColumns: any[] =
   [{field: 'geo.impGeofootprintLocation.locationNumber', header: 'Number',          width: '5em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locationName',   header: 'Name',            width: '8em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.marketName',     header: 'Market',          width: '8em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locAddress',     header: 'Address',         width: '14em', matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locCity',        header: 'City',            width: '9em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locState',       header: 'State',           width: '4em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locZip',         header: 'ZIP',             width: '4em',  matchMode: 'contains', styleClass: ''},
    {field: 'home_geo',                                   header: 'Home Geo',        width: '4em',  matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'isMustCover',                                header: 'Must Cover',      width: '4em',  matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'geo.distance',                               header: 'Dist',            width: '4em',  matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'geo.geocode',                                header: 'Geocode',         width: '9em',  matchMode: 'contains', styleClass: ''},
    {field: 'city_name',                                  header: 'Geo City, State', width: '10em', matchMode: 'contains', styleClass: ''},
    {field: 'geo.hhc',                                    header: 'HHC',             width: '7em',  matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'allocHhc',                                   header: 'HHC Allocated',   width: '7em',  matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'cpm',                                        header: 'CPM',             width: '5.5em', matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'investment',                                 header: 'Inv',             width: '7em',  matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'allocInvestment',                            header: 'Inv Allocated',   width: '7em',  matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'ownergroup',                                 header: 'Owner Group',     width: '7em',  matchMode: 'contains', styleClass: ''},
    {field: 'coveragedescription',                        header: 'Cov Desc',        width: '12em', matchMode: 'contains', styleClass: ''},
    {field: 'pob',                                        header: 'POB',             width: '4em',  matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'dma',                                        header: 'DMA',             width: '10em', matchMode: 'contains', styleClass: ''},
    {field: 'geo.isDeduped',                              header: 'In Deduped',      width: '6em',  matchMode: 'contains', styleClass: 'val-text-center'},
   ];

   public  flatGeoGridExtraColumns: any[];
   public  selectedColumns: any[] = [];
   public  columnOptions: SelectItem[] = [];
// public  variableColOrder:Map<string, number> = new Map<string, number>();

   // Control table cell / header wrapping
   private tableWrapOn: string = 'val-table val-tbody-wrap';
   private tableWrapOff: string = 'val-table val-tbody-nowrap';
   public  tableWrapStyle: string = this.tableWrapOff;
   public  tableWrapIcon: string = 'fa fa-minus';
   public  tableHdrSlice: boolean = false;

   // Private component variables
   private varCache: any;

   // Miscellaneous variables
   public  gridStats = {
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
   constructor(private logger: LoggingService) { }

   ngOnInit()
   {
      // Observe the behavior subjects on the input parameters
      this.project$ = this.projectBS$.asObservable();
      this.allProjectVars$ = this.allProjectVarsBS$.asObservable();
      this.allLocations$ = this.allLocationsBS$.asObservable();
      this.allGeos$ = this.allGeosBS$.asObservable();
      this.allMustCovers$ = this.allMustCoversBS$.asObservable();
      this.allAttributes$ = this.allAttributesBS$.asObservable();
      this.allVars$ = this.allVarsBS$.asObservable();
      //this.varColOrder$ = this.varColOrderBS$.asObservable();

      //this.varColOrder$.subscribe(colOrder => {/*this.variableColOrder = colOrder; */console.log("OBSERVABLE FIRED: varColOrder$ - colOrder:", colOrder); console.log("variableColOrder: ", this.variableColOrder);})

      // Whenever the project changes, update the grid export file name
      this.project$.subscribe(project => {
         this._geoGrid.exportFilename = 'geo-grid' + ((project != null && project.projectId != null) ? '-' + project.projectId.toString() : '') + '-export';

         // In the event of a project load, clear the grid filters
         if (this.lastProjectId !== project.projectId) {
            this.lastProjectId = project.projectId;
            this.onClickResetFilters();
         }
      });

      // createComposite subscriptions
      this.allLocations$.subscribe(locs => this.gridStats = {...this.gridStats, numLocsActive: (locs != null) ? locs.filter(loc => loc.isActive).length : 0});

      // Remember that combineLatest is going to fire the pipe for each subscriber to allImpGeofootprintGeos$.  In the template, we have two | async values:
      // displayedImpGeofootprintGeos$ and selectedImpGeofootprintGeos$, which creates two subscribers.  This would fire createComposite twice, which is an expensive
      // operation.  The publishReplay is allows it to run once for the first subscriber, then the other uses the result of that.
      type createCompositeTuple = [ImpProject, ImpProjectVar[], ImpGeofootprintGeo[], string[], AttributeEntity, ImpGeofootprintVar[], Map<string, number>];

      this.allImpGeofootprintGeos$ = combineLatest<createCompositeTuple, createCompositeTuple>(this.projectBS$, this.allProjectVars$, this.allGeos$, this.allMustCovers$, this.allAttributesBS$, this.allVars$, this.varColOrderBS$)
                                    .pipe(tap(x => this.setGridTotals())
                                         , tap(x => this.syncHeaderFilter())
                                         , map(([discovery, projectVars, geos, mustCovers, attributes, vars, varColOrder]: createCompositeTuple) =>
                                            this.createComposite(discovery, projectVars, geos, mustCovers, attributes, vars, varColOrder))
                                          // Share the latest emitted value by creating a new behaviorSubject on the result of createComposite (The previous operator in the pipe)
                                          // Allows the first subscriber to run pipe and all other subscribers get the result of that
                                         , publishReplay(1)
                                         , refCount()       // Keeps track of all of the subscribers and tells publishReply to clean itself up
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
      this._geoGrid.filterConstraints['numericFilter']  = (value, filter) : boolean => FilterData.numericFilter(value, filter);
      this._geoGrid.filterConstraints['distanceFilter'] = (value, filter) : boolean => FilterData.numericFilter(value, filter, 2);

      //this._geoGrid._value
//      this.gridValuesBS$ =
//      this.gridValues$ = from(this._geoGrid._value);
      this.gridValues$ = Observable.create(observer => observer.next(this._geoGrid._value));

      this.gridValues$.subscribe(data => {
         console.log('gridValues$ Observable fired');
         this.setGridTotals();
      });

      const subscribe = this.gridValues$.subscribe(val => {
         console.log('subscribe fired - ', val);
      });
//      this.gridFilter$ =


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
      //this.gridStats = {
         //numLocsActive: 0,
         this.gridStats.numGeos = 0;
         this.gridStats.numGeosActive = 0;
         this.gridStats.numGeosInactive = 0;
      //}

      this.dedupeGrid = false;
      this.dupeCount = 0;
      this.dupeMsg = '';

      this.hhcRanges = [null, null];
      this.allocHhcRanges = [null, null];
      this.investmentRanges = [null, null];
      this.allocInvestmentRanges = [null, null];
      this.distanceRanges = [null, null];
      this.cpmRanges = [null, null];

      //console.log(this._geoGrid);
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
    *
    */
   createComposite(project: ImpProject, projectVars: ImpProjectVar[], geos: ImpGeofootprintGeo[], mustCovers: string[], geoAttributes: AttributeEntity, geoVars: ImpGeofootprintVar[], varColOrder: Map<string, number>) : FlatGeo[]
   {
      if (geos == null || geos.length === 0) {
        this.initializeGridTotals();
        return [];
      }

      this.projectVarsDict = mapArrayToEntity(projectVars,  v => v.varPk);

      //let uniqueGeos = (geos != null) ? new Set(geos.map(geo => geo.geocode)) : new Set();
      console.log('createComposite:'
                 , ' geos:' , (geos.length)
                //  ,' unique geos:' , ((uniqueGeos != null) ? uniqueGeos.size: null)
                 , ' must covers:' , ((mustCovers != null) ? mustCovers.length : null)
                 , ' projectVars: ', ((projectVars != null) ? projectVars.length : null)
                 , ' geo vars:' , ((geoVars != null) ? geoVars.length : null)
                 , ' geo vars custom:' , ((geoVars != null) ? geoVars.filter(gv => (this.projectVarsDict[gv.varPk] || safe).isCustom).length : null));
      // DEBUG: See additional parameters
      // console.log('createComposite: varColOrder: ', varColOrder
      //            ,' project: ', project
      //            ,' smAnneCpm: ' + project.smAnneCpm + ', smSoloCpm: ' + project.smSoloCpm + ', smValassisCpm: ' + project.smValassisCpm);

      // DEBUG: Print the geoVar counts
      let variablePkCounts: Map<string, ImpGeofootprintVar[]> = groupByExtended(geoVars, (i) => i.varPk + ', ' + (this.projectVarsDict[i.varPk] || safe).customVarExprDisplay);
      if (variablePkCounts != null && variablePkCounts.size > 0)
      {
        this.logger.info.groupCollapsed('createComposite - geoVar Counts:', variablePkCounts.size);
        this.logger.info.table(Array.from(variablePkCounts.keys()).map(v => ({Variable: v, Count: variablePkCounts.get(v).length})));
        this.logger.info.groupEnd();
      }
      variablePkCounts = null;

      let min: number;
      let max: number;
      let fgId = 0; // fgId is a fabricated flat geo id used by turbo grid to uniquely identify a row for filtering and selection
      const geoGridData: FlatGeo[] = [];
      this.flatGeoGridExtraColumns = [];

      // Get only geo variables that are flagged as usable
      const usableGeoVars = geoVars.filter(gv => this.projectVarsDict[gv.varPk] != null && this.projectVarsDict[gv.varPk].isIncludedInGeoGrid);
      //const varsInData = new Set(usableGeoVars.map(gv => this.getGeoVarFieldName(gv)));

      // Get the missing geoVars with no scores
      // const missingVars = projectVars.filter(pv => pv.isIncludedInGeoGrid && !varsInData.has(this.getProjectVarFieldName(pv)));
//    console.log('Vars with no data:::', missingVars);

       // Create a cache of geo variables, grouped by geocode
      const varCache = groupBy(usableGeoVars, 'geocode');
      //console.log('createComposite: varCache', { usableVars, usableGeoVars, varCache });
      // Populate the unique values for text variables, keyed by variable pk
      this.uniqueTextVals = new Map<string, SelectItem[]>();
      const distinctVarPks: number[] = Array.from(new Set(usableGeoVars.filter(gv => (this.projectVarsDict[gv.varPk]||safe).fieldconte === 'CHAR').map(v => v.varPk)));

      distinctVarPks.forEach(varPk => {
         // Reduce the geo vars to just the unique values
         const uniqueVals = Array.from(new Set(usableGeoVars.filter(geoVar => geoVar.varPk === varPk).map(geoVar => geoVar.value))).sort();

         // Store the unique values in a map keyed by the variable pk
         this.uniqueTextVals.set(varPk.toString(), uniqueVals.map(varVal => ({ label: varVal, value: varVal} as SelectItem)));
      });

      // Populate the range values for numeric variables, keyed by variable pk
      this.variableRanges = new Map<string, number[]>();

      const distinctNumVarPks: number[] = Array.from(new Set(usableGeoVars.filter(gv => (this.projectVarsDict[gv.varPk]||safe).fieldconte !== 'CHAR').map(v => v.varPk)));
      distinctNumVarPks.forEach(varPk => {
         // console.log('processing variable: ', varPk);
         // Filter out the variables for this pk
         const pkVars: ImpGeofootprintVar[] = usableGeoVars.filter(gv => gv.varPk === varPk);
         // console.log ('pkVars.length = ', (pkVars != null) ? pkVars.length : null);

         // Reduce the geo vars to just the min / max values
       //min = pkVars.reduce((min, v: ImpGeofootprintVar) => (v.valueNumber == null) ? 0 : v.valueNumber < min ? v.valueNumber : min, (pkVars != null && pkVars.length > 0) ? pkVars[0].valueNumber : 0);
       //max = pkVars.reduce((max, v: ImpGeofootprintVar) => (v.valueNumber == null) ? max : (v.valueNumber > max) ? v.valueNumber : max, (pkVars != null && pkVars.length > 0 && pkVars[0].valueNumber != null) ? pkVars[0].valueNumber : 0);
         min = pkVars.reduce((min, v: ImpGeofootprintVar) => (v.value == null) ? 0 : v.value < min ? v.value as number : min, (pkVars != null && pkVars.length > 0) ? pkVars[0].value as number : 0  as number );
         max = pkVars.reduce((max, v: ImpGeofootprintVar) => (v.value == null) ? max : (v.value > max) ? v.value as number : max, (pkVars != null && pkVars.length > 0 && pkVars[0].value != null) ? pkVars[0].value as number : 0);

         // Massage the min / max
         min = (min != null) ? Math.trunc(min) : null; // Number(min.toFixed(0)) : null;
         max = (max != null) ? Math.round(max) : null;

         // console.log('   min: ', min, ', max: ', max);
         // Store the min / max range values in a map keyed by the variable pk
         this.variableRanges.set(varPk.toString(), [min, max, min, max]);
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

      // For every geo, create a FlatGeo to pivot up the variables and attributes
      geos.forEach(geo => {
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
            gridGeo['coveragedescription'] = currentAttribute['cov_desc'];
            gridGeo['dma'] = currentAttribute['dma_name'];
            gridGeo['ownergroup'] = currentAttribute['owner_group_primary'];

            const cityName = currentAttribute['city_name'];
            if (cityName != null && isString(cityName)) {
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

         const currentVars = varCache.get(geo.geocode) || [];
         currentVars.filter(geoVar => geoVar.impGeofootprintTradeArea != null
                         && geoVar.impGeofootprintTradeArea.impGeofootprintLocation != null
                         && geoVar.impGeofootprintTradeArea.impGeofootprintLocation.locationNumber === geo.impGeofootprintLocation.locationNumber)
            .forEach(geovar => {
            if ((this.projectVarsDict[geovar.varPk]||safe).isString)
               gridGeo[geovar.varPk.toString()] = geovar.value !== 'null' ? geovar.value : '';
            else
            {
               // Format them
               switch ((this.projectVarsDict[geovar.varPk]||safe).fieldconte) {
                  case 'COUNT':
                  case 'MEDIAN':
                  case 'INDEX':
                     gridGeo[geovar.varPk.toString()] = (geovar.value != null) ? Math.round(geovar.value as number) : null;
                     break;

                  case 'PERCENT':
                  case 'RATIO':
                     gridGeo[geovar.varPk.toString()] = (geovar.value != null) ? (geovar.value as number).toFixed(2) : null;
                     break;

                  case 'CHAR':
                     gridGeo[geovar.varPk.toString()] = geovar.value; // (geovar.valueString != null) ? geovar.valueString : geovar.valueNumber;
                     break;

                  default:
                     console.log("### do not know fieldconte for varPk: ", geovar.varPk, "projectVarsDict:", this.projectVarsDict);
                     gridGeo[geovar.varPk.toString()] = (geovar.value != null) ? (geovar.value as number).toFixed(14) : null;
                     break;
               }
               //console.table(geovar);
            }
            // console.table(currentVars, ["geocode", "varPk", "fieldname", "fieldconte"]);
            // console.log("geovar.name: " + geovar.fieldname + ", fieldconte: " + geovar.fieldconte + ", geovar: ", geovar, ", gridGeo: ", gridGeo);

            // Create grid columns for the variables
            if (!this.flatGeoGridExtraColumns.find(f => f.field === geovar.varPk.toString()))
            {
              const colWidth: number = Math.min(200, Math.max(60, ((this.projectVarsDict[geovar.varPk]||safe).fieldname.length * 6) + 24));
              const colStyleClass: string = ((this.projectVarsDict[geovar.varPk]||safe).isNumber) ? 'val-text-right' : '';

              // Let the fieldConte decide what the match operator will be on the numeric filter
              let matchOper: string;
              switch ((this.projectVarsDict[geovar.varPk]||safe).fieldconte) {
               // SAMPLE: This is setup this way to show we can have different filters, per fieldconte value
               // case 'PERCENT':
               //    matchOper = ">=";
               //    break;
               default:
                  matchOper = 'between';
                  break;
              }

              //console.log("this.flatGeoGridExtraColumns adding ", geovar.varPk + " - Header:", header, ", colWidth:",colWidth,'px, styleClass: ', colStyleClass, ", isNumber: " + (this.projectVarsDict[geovar.varPk]||safe).isNumber, ", project Var:", this.projectVarsDict[geovar.varPk]);
              // const header = (this.projectVarsDict[geovar.varPk]||safe).isCustom ? (this.projectVarsDict[geovar.varPk]||safe).fieldname : (this.projectVarsDict[geovar.varPk]||safe).customVarExprDisplay;
              const header = (this.projectVarsDict[geovar.varPk] || safe).fieldname;
              this.flatGeoGridExtraColumns.push({field: geovar.varPk.toString(), header: header, width: colWidth + 'px'
                                                ,fieldname: (this.projectVarsDict[geovar.varPk]||safe).fieldname
                                                ,matchType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes((this.projectVarsDict[geovar.varPk]||safe).fieldconte)) ? 'numeric' : 'text'
                                                ,matchOper: matchOper
                                                ,matchMode: 'contains', styleClass: colStyleClass, sortOrder: (this.projectVarsDict[geovar.varPk]||safe).sortOrder});
            }
         });

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
         if (geoGridData != null)
         {
            min = geoGridData.reduce((min, p: FlatGeo) => p['geo.hhc'] < min ? (p['geo.hhc'] !== '' ? p['geo.hhc'] : 0) : min, (geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
            max = geoGridData.reduce((max, p: FlatGeo) => p['geo.hhc'] > max ? (p['geo.hhc'] !== '' ? p['geo.hhc'] : 0) : max, (geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
            this.hhcRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p: FlatGeo) => p['allocHhc'] < min ? (p['allocHhc'] !== '' ? p['allocHhc'] : 0) : min, (geoGridData.length > 0) ? geoGridData[0]['allocHhc'] : 0);
            max = geoGridData.reduce((max, p: FlatGeo) => p['allocHhc'] > max ? (p['allocHhc'] !== '' ? p['allocHhc'] : 0) : max, (geoGridData.length > 0) ? geoGridData[0]['allocHhc'] : 0);
            this.allocHhcRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p: FlatGeo) => p['investment'] < min ? p['investment'] : min, (geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
            max = geoGridData.reduce((max, p: FlatGeo) => p['investment'] > max ? p['investment'] : max, (geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
            this.investmentRanges = [min, max, min, max];

            max = geoGridData.reduce((max, p: FlatGeo) => p['allocInvestment'] > max ? p['allocInvestment'] : max, (geoGridData.length > 0) ? geoGridData[0]['allocInvestment'] : 0);
            min = geoGridData.reduce((min, p: FlatGeo) => p['allocInvestment'] < min && p['allocInvestment'] != null ? p['allocInvestment'] : min, max);
            this.allocInvestmentRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p: FlatGeo) => roundTo(p['geo.distance'], 2) < min ? roundTo(p['geo.distance'], 2) : min, (geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
            max = geoGridData.reduce((max, p: FlatGeo) => roundTo(p['geo.distance'], 2) > max ? roundTo(p['geo.distance'], 2) : max, (geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
            this.distanceRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p: FlatGeo) => p['cpm'] < min ? p['cpm'] : min, (geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
            max = geoGridData.reduce((max, p: FlatGeo) => p['cpm'] > max ? p['cpm'] : max, (geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
            this.cpmRanges = [min, max, min, max];
         }
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
     /*
      // Add the sort order to the object
      this.flatGeoGridExtraColumns.forEach(col => {
         if (this.variableColOrder != null  && this.variableColOrder instanceof Map) {
            if (this.variableColOrder.has(col.header))
               col['sortOrder'] = this.variableColOrder.get(col.header);
            else {
               if (this.variableColOrder.has(col.fieldname + ' ' + col.header))
                  col['sortOrder'] = this.variableColOrder.get(col.fieldname + ' ' + col.header);
               else
                  col['sortOrder'] = -1;
            }
         }
         else
            col['sortOrder'] = 0;
      });*/

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
      const dataKeyValue = this._geoGrid.dataKey ? String(this._geoGrid.objectUtils.resolveFieldData(rowData, this._geoGrid.dataKey)) : null;
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
            const dataKeyValue = this._geoGrid.dataKey ? String(this._geoGrid.objectUtils.resolveFieldData(geo, this._geoGrid.dataKey)) : null;
            this._geoGrid.preventSelectionSetterPropagation = true;

            // If that row is selected, filter it out of selection
            if (geo.isActive === 1) {
               //console.log('setting unselected row to selected');
               const selectionIndex = this._geoGrid.findIndexInSelection(geo);
               this._geoGrid._selection = this._geoGrid.selection.filter((val, i) => i != selectionIndex);
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

         const newSelection = this._geoGrid.selection.map(x => Object.assign({}, x));
         this._geoGrid._selection = newSelection;

         this._geoGrid.value = this._geoGrid.value.map(x => Object.assign({}, x));
// Works, but overkill         this.impGeofootprintGeoService.makeDirty();
      //console.log('sync finished - matches: ', matchCount, ', differences: ', diffCount);
   }

/* Just to document original process
      // Initialize the selection array
      this._geoGrid.selection = this._geoGrid.selection||[];

      // Determine if the row provided is selected
      let selected = this._geoGrid.isSelected(rowData);

      // Get the dataKeyValue of the row provided
      let dataKeyValue = this._geoGrid.dataKey ? String(this._geoGrid.objectUtils.resolveFieldData(rowData, this._geoGrid.dataKey)) : null;
      this._geoGrid.preventSelectionSetterPropagation = true;

      // If that row is selected, filter it out of selection
      if (selected) {
         let selectionIndex = this._geoGrid.findIndexInSelection(rowData);
         this._geoGrid._selection = this._geoGrid.selection.filter((val, i) => i != selectionIndex);
         this._geoGrid.selectionChange.emit(this._geoGrid.selection);
   //        this._geoGrid.onRowUnselect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
         if (dataKeyValue) {
            delete this._geoGrid.selectionKeys[dataKeyValue];
         }
      }
      else
      // The row was not selected, add it into selection
      {
         this._geoGrid._selection = this._geoGrid.selection ? [...this._geoGrid.selection, rowData] : [rowData];
         this._geoGrid.selectionChange.emit(this._geoGrid.selection);
   //        this._geoGrid.onRowSelect.emit({ originalEvent: event.originalEvent, data: rowData, type: 'checkbox' });
         if (dataKeyValue) {
            this._geoGrid.selectionKeys[dataKeyValue] = 1;
         }
      }

      // Tell the service that selection has changed
      this._geoGrid.tableService.onSelectionChange();
*/

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
         this.tableWrapIcon = 'fa fa-minus';
         //this.tableHdrSlice = true;  // Disabled to turn toggling of header wrapping off
      }
      else
      {
         this.tableWrapStyle = this.tableWrapOn;
         this.tableWrapIcon = 'fa fa-bars';
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
