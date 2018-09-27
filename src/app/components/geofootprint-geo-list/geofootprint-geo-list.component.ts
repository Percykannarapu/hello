import { distinctArray, mapArray, filterArray } from './../../val-modules/common/common.rxjs';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/primeng';
import { SelectItem } from 'primeng/components/common/selectitem';
import { AppStateService } from '../../services/app-state.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppConfig } from '../../app.config';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { EsriMapService } from '../../esri/services/esri-map.service';
import { ImpGeofootprintVarService } from '../../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintVar } from '../../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { ImpProjectVarService } from '../../val-modules/targeting/services/ImpProjectVar.service';
import { groupBy, resolveFieldData, roundTo } from '../../val-modules/common/common.utils';
import { TradeAreaTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { TargetAudienceService } from '../../services/target-audience.service';
import { Table } from 'primeng/table';
import { FilterData } from '../common/table-filter-numeric/table-filter-numeric.component';

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

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   @ViewChild('geoGrid') public _geoGrid: Table;  // To add custom filters to the grid

   // Data store observables
   private allGeos$: Observable<ImpGeofootprintGeo[]>;
   private allAttributes$: Observable<ImpGeofootprintGeoAttrib[]>;
   private allVars$: Observable<ImpGeofootprintVar[]>;

   public  allImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  displayedImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

   // Observables for unique values to filter on in the grid
   public  uniqueCity$: Observable<SelectItem[]>;
   public  uniqueState$: Observable<SelectItem[]>;
   public  uniqueMarket$: Observable<SelectItem[]>;
   public  uniqueOwnerGroup$: Observable<SelectItem[]>;
   public  uniqueCoverageDesc$: Observable<SelectItem[]>;
   public  uniqueDma$: Observable<SelectItem[]>;

   // Header filter
   public  headerFilter: boolean = true;

   // Filter Ranges
   public  hhcRanges: number[] = [null, null];
   public  investmentRanges: number[] = [null, null];
   public  distanceRanges: number[] = [null, null];
   public  cpmRanges: number[] = [null, null];

   // Filtered Totals
   public  gridTotals: Map<string, ColMetric> = new Map<string, ColMetric>();

   // Grid Column Variables
   public flatGeoGridColumns: any[] =
   [{field: 'geo.impGeofootprintLocation.locationNumber', header: 'Number',               width: '5em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locationName',   header: 'Name',                 width: '8em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.marketName',     header: 'Market',               width: '8em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locAddress',     header: 'Address',              width: '14em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locCity',        header: 'City',                 width: '9em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locState',       header: 'State',                width: '4em',   matchMode: 'contains', styleClass: ''},
    {field: 'geo.impGeofootprintLocation.locZip',         header: 'ZIP',                  width: '4em',   matchMode: 'contains', styleClass: ''},
    {field: 'home_geo',                                   header: 'Home Geo',             width: '4em',   matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'geo.distance',                               header: 'Dist',                 width: '4em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'geo.geocode',                                header: 'Geocode',              width: '9em',   matchMode: 'contains', styleClass: ''},
    {field: 'city_name',                                  header: 'Geo City, State',      width: '10em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.hhc',                                    header: 'HHC',                  width: '5em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'cpm',                                        header: 'CPM',                  width: '5em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'investment',                                 header: 'Inv',                  width: '6em',   matchMode: 'contains', styleClass: 'val-text-right'},
    {field: 'ownergroup',                                 header: 'Owner Group',          width: '7em',   matchMode: 'contains', styleClass: ''},
    {field: 'coveragedescription',                        header: 'Cov Desc',             width: '12em',   matchMode: 'contains', styleClass: ''},
    {field: 'pob',                                        header: 'POB',                  width: '4em',   matchMode: 'contains', styleClass: 'val-text-center'},
    {field: 'dma',                                        header: 'DMA',                  width: '10em',  matchMode: 'contains', styleClass: ''},
    {field: 'geo.isDeduped',                              header: 'In Deduped',           width: '6em',   matchMode: 'contains', styleClass: 'val-text-center'},
   ];

   public  flatGeoGridExtraColumns: any[];
   public  selectedColumns: any[] = [];
   public  columnOptions: SelectItem[] = [];
   public  variableColOrder:Map<string, number> = new Map<string, number>();

   // Control table cell / header wrapping
   private tableWrapOn: string = "val-table val-tbody-wrap";
   private tableWrapOff: string = "val-table val-tbody-nowrap"
   public  tableWrapStyle: string = this.tableWrapOff;
   public  tableWrapIcon: string = "fa fa-minus";
   public  tableHdrSlice: boolean = true;

   // Miscellaneous variables
   public  numGeosActive: number = 0;
   public  numGeosInactive: number = 0;
   public  dedupeGrid: boolean = false;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public  config: AppConfig,
               public  impProjectService: ImpProjectService,
               public  impGeofootprintGeoService: ImpGeofootprintGeoService,
               public  impGeofootprintLocationService: ImpGeofootprintLocationService,
               private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService,
               private impGeofootprintVarService: ImpGeofootprintVarService,
               private appStateService: AppStateService,
               private esriMapService: EsriMapService,
               private confirmationService: ConfirmationService,
               private impProjectVarService: ImpProjectVarService,
               private usageService: UsageService,
               private targetAudienceService: TargetAudienceService) { }

   ngOnInit()
   {
      // Subscribe to the data stores
      this.allGeos$ = this.impGeofootprintGeoService.storeObservable;
      this.allAttributes$ = this.impGeofootprintGeoAttribService.storeObservable;
      this.allVars$ = this.impGeofootprintVarService.storeObservable;

      const nonNullProject$ = this.appStateService.currentProject$.pipe(filter(project => project != null));

      // createComposite subscriptions
      this.allImpGeofootprintGeos$ = combineLatest(nonNullProject$, this.allGeos$, this.allAttributes$, this.allVars$)
                                    .pipe(map(([discovery, geos, attributes]) => this.createComposite(discovery, geos, attributes)));

      this.displayedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$
                                               .pipe(map((AllGeos) => {
                                                  return AllGeos.filter(flatGeo => flatGeo.geo.isDeduped === 1 || this.dedupeGrid === false); }));

      this.selectedImpGeofootprintGeos$ = this.displayedImpGeofootprintGeos$
                                              .pipe(map((AllGeos) => {
                                                 this.numGeosActive   = AllGeos.filter(flatGeo => flatGeo.geo.isActive === true).length;
                                                 this.numGeosInactive = AllGeos.filter(flatGeo => flatGeo.geo.isActive === false).length;
                                                 return AllGeos.filter(flatGeo => flatGeo.geo.isActive === true); }));

      // Column Picker Model
      for (const column of this.flatGeoGridColumns) {
         this.columnOptions.push({ label: column.header, value: column });
         this.selectedColumns.push(column);
      }

      // Setup a custom filter for the grid
      this._geoGrid.filterConstraints['numericFilter']  = (value, filter): boolean => FilterData.numericFilter(value, filter);
      this._geoGrid.filterConstraints['distanceFilter'] = (value, filter): boolean => FilterData.numericFilter(value, filter, 2);

      // Whenever the project changes, update the grid export file name
      this.impProjectService.storeObservable.pipe(
        filter(projects => projects != null && projects.length > 0 && projects[0] != null)
      ).subscribe(projects => this._geoGrid.exportFilename = "geo-grid-" + projects[0].projectId);

      // ----------------------------------------------------------------------
      // Table filter observables
      // ----------------------------------------------------------------------

      // Create an observable for unique cities (By hand method)
      this.uniqueCity$ = this.allGeos$.pipe(filterArray(geo => geo.isActive === true)
                                           ,map(geos => Array.from(new Set(geos.map(geo => geo.impGeofootprintLocation.locCity).sort()))
                                           .map(str => new Object({ label: str, value: str}) as SelectItem)));

      // Create an observable for unique states (By helper methods)
      this.uniqueState$ = this.allGeos$.pipe(filterArray(geo => geo.isActive === true)
                                            ,mapArray(geo => geo.impGeofootprintLocation.locState)
                                            ,distinctArray()
                                            ,map(arr => arr.sort())
                                            ,mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique market names
      this.uniqueMarket$ = this.allGeos$.pipe(filterArray(geo => geo.isActive === true)
                                             ,mapArray(geo => geo.impGeofootprintLocation.marketName)
                                             ,distinctArray()
                                             ,map(arr => arr.sort())
                                             ,mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique owner groups
      this.uniqueOwnerGroup$ = this.allAttributes$.pipe(filterArray(attribute => attribute.isActive === true 
                                                                 && attribute.attributeCode === "owner_group_primary")
                                                       ,mapArray(attribute => attribute.attributeValue)
                                                       ,distinctArray()
                                                       ,map(arr => arr.sort())
                                                       ,mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique coverage description
      this.uniqueCoverageDesc$ = this.allAttributes$.pipe(filterArray(attribute => attribute.isActive === true 
                                                                   && attribute.attributeCode === "cov_desc")
                                                         ,mapArray(attribute => attribute.attributeValue)
                                                         ,distinctArray()
                                                         ,map(arr => arr.sort())
                                                         ,mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique coverage description
      this.uniqueDma$ = this.allAttributes$.pipe(filterArray(attribute => attribute.isActive === true 
                                                          && attribute.attributeCode === "dma_name")
                                                ,mapArray(attribute => attribute.attributeValue)
                                                ,distinctArray()
                                                ,map(arr => arr.sort())
                                                ,mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      this.initializeGridTotals();
   }

   ngOnDestroy()
   {
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
   public getGeoTooltip(flatGeo: FlatGeo): string
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

  private getProjectVarFieldName(pv: ImpProjectVar) : string {
    if (pv.source.includes('Online') && !pv.source.includes('Audience-TA')) {
      const sourceName = pv.source.split('_')[1];
      return `${pv.fieldname} (${sourceName})`;
    } else {
      return pv.fieldname;
    }
  }

  private getGeoVarFieldName(gv: ImpGeofootprintVar) : string {
    if (TradeAreaTypeCodes.parse(gv.impGeofootprintTradeArea.taType) === TradeAreaTypeCodes.Audience) {
      if (gv.customVarExprQuery && gv.customVarExprQuery.includes('Offline')) {
        return gv.customVarExprDisplay;
      } else {
        return gv.fieldname ? `${gv.fieldname} ${gv.customVarExprDisplay}` : gv.customVarExprDisplay;
      }
    } else {
      return gv.customVarExprDisplay;
    }
  }

/**
 *  Initializes the accumulators for the totals located at the bottom of the column
 */  
   initializeGridTotals() {
      this.gridTotals.set('hhc',        {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('cpm',        {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('investment', {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
      this.gridTotals.set('distance',   {tot: 0, cnt: 0, min: 99999999, max: 0, avg: 0});
   }

   debugLogGridTotals() {
      console.debug("total distance:   ", this.gridTotals.get('distance'));
      console.debug("total hhc:        ", this.gridTotals.get('hhc'));
      console.debug("total investment: ", this.gridTotals.get('investment'));
      console.debug("total cpm:        ", this.gridTotals.get('cpm'));
   }

   /**
    * createComposite produces a list of FlatGeos.  These are a flattened view of the geographies,
    * having pivoted up the variables and attributes to their respective geographies.
    * 
    * @param project The current projectd
    * @param geos List of geos for the grid
    * @param geoAttributes List of geo attributes to pivot up to the geos
    */
   createComposite(project: ImpProject, geos: ImpGeofootprintGeo[], geoAttributes: ImpGeofootprintGeoAttrib[]) : FlatGeo[]
   {
      //console.log('createComposite: geos: ', (geos != null) ? geos.length : null, ', Unselected Geos', UnselGeoCount, ', attributes: ', (geoAttributes != null) ? geoAttributes.length : null, ', vars: ', (vars != null) ? vars.length : null);
      let min: number;
      let max: number;
      let fgId = 0; // fgId is a fabricated flat geo id used by turbo grid to uniquely identify a row for filtering and selection
      const geoGridData: FlatGeo[] = [];
      this.flatGeoGridExtraColumns = [];

      // Get all of the attributes for the geo
      const  attributeMap = new Map<string, ImpGeofootprintGeoAttrib[]>();
      geoAttributes.forEach(attribute => {if (attribute.attributeCode === 'pob'
                                          ||  attribute.attributeCode === 'owner_group_primary'
                                          ||  attribute.attributeCode === 'cov_frequency'
                                          ||  attribute.attributeCode === 'cov_desc'
                                          ||  attribute.attributeCode === 'dma_name'
                                          ||  attribute.attributeCode === 'city_name') {
                                             if (attributeMap[attribute.impGeofootprintGeo.geocode] == null)
                                                attributeMap[attribute.impGeofootprintGeo.geocode] = [];
                                             attributeMap[attribute.impGeofootprintGeo.geocode].push(attribute);
                                             }
                                          });

      // Rank the geos by distance
      this.impGeofootprintGeoService.calculateGeoRanks();

      // Sort the geos
      this.impGeofootprintGeoService.sort(this.impGeofootprintGeoService.defaultSort);

      // Get all of the variables
      const usableVars = new Set(this.impProjectVarService.get()
                                     .filter(pv => pv.isIncludedInGeoGrid)
                                     .map(pv => this.getProjectVarFieldName(pv)));
      const geovars = this.impGeofootprintVarService.get().filter(gv => usableVars.has(this.getGeoVarFieldName(gv)));
      const varCache = groupBy(geovars, 'geocode');

      // Initialize grid totals
      this.initializeGridTotals();

      // For every geo, create a FlatGeo to pivot up the variables and attributes
      geos.forEach(geo => {
         const gridGeo: FlatGeo = new Object() as FlatGeo;
         gridGeo.geo = geo;         
         gridGeo.fgId = fgId++;

         // Grid doesn't work well with child values.  Can use resolveFieldData in the template, but then filtering doesn't work
         this.flatGeoGridColumns.forEach(col => {
            gridGeo[col.field] = resolveFieldData(gridGeo, col.field) || "";
         });

         if (gridGeo.geo.impGeofootprintLocation.locZip != null)
            gridGeo.geo.impGeofootprintLocation.locZip = gridGeo.geo.impGeofootprintLocation.locZip.slice(0, 5);
         else
            ' ';

         // Add attributes the grid is interested in and massage them where needed
         if (attributeMap[geo.geocode] != null)
         {
            attributeMap[geo.geocode].forEach(attribute => {
               if (attribute.attributeCode === 'pob')
                  gridGeo['pob'] = (attribute.attributeValue === 'B') ? 'Y' : 'N';

               if (attribute.attributeCode === 'city_name' && attribute.attributeValue != null)
                  gridGeo['city_name'] = attribute.attributeValue.substring(0,1).toUpperCase() + attribute.attributeValue.substring(1, attribute.attributeValue.length-3).toLowerCase() + ' ' + attribute.attributeValue.substring(attribute.attributeValue.length-2);

               if (attribute.attributeCode === 'owner_group_primary')
               {
                  gridGeo['ownergroup'] = attribute.attributeValue;
                  if (project.estimatedBlendedCpm != null)
                     gridGeo['cpm'] = project.estimatedBlendedCpm;
                  else
                     switch (attribute.attributeValue)
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
                  gridGeo['investment'] = (gridGeo['cpm'] != null) ? (gridGeo['cpm'] / 1000) * gridGeo.geo.hhc : 0;
               }

               if (geo != null && geo.impGeofootprintLocation != null && geo.impGeofootprintLocation.impGeofootprintLocAttribs != null) {
                  gridGeo['home_geo'] = (geo.geocode === geo.impGeofootprintLocation.homeGeocode) ? 1 : 0;
               }

               if (attribute.attributeCode === 'cov_desc')
                  gridGeo['coveragedescription'] = attribute.attributeValue;

               if (attribute.attributeCode === 'dma_name')
                  gridGeo['dma'] = attribute.attributeValue;
           });
         }

         let currentVars = varCache.get(geo.geocode) || [];
         currentVars.filter(geoVar => geoVar.impGeofootprintTradeArea.impGeofootprintLocation === geo.impGeofootprintLocation)
            .forEach(geovar => {
            if (geovar.geocode === "48150B1" && geovar.gvId === 72)
               console.log("geo var: ", geovar.varPk, ", ", geovar.fieldname, " - ", geovar);
            if (geovar.isString)
               gridGeo[geovar.varPk.toString()] = geovar.valueString;            
            else
            {
              // Format them
              switch (geovar.fieldconte) {
                case 'COUNT':
                case 'MEDIAN':
                case 'INDEX':
                  gridGeo[geovar.varPk.toString()] = Math.round(geovar.valueNumber);
                  break;

                case 'PERCENT':
                case 'RATIO':
                  gridGeo[geovar.varPk.toString()] = geovar.valueNumber.toFixed(2);
                  break;

                default:
                  gridGeo[geovar.varPk.toString()] = geovar.valueNumber.toFixed(14);
                  break;
              }
            }
            // console.debug("geovar.name: " + geovar.fieldname + ", fieldconte: " + geovar.fieldconte + ", geovar: ", geovar, ", gridGeo: ", gridGeo);

            // Create grid columns for the variables
            if (!this.flatGeoGridExtraColumns.find(f => f.field === geovar.varPk.toString()))
            {
              const colWidth: number = Math.min(160, Math.max(80, (geovar.customVarExprDisplay.length * 8) + 45));
              const colStyleClass: string = (geovar.isNumber) ? 'val-text-right' : '';
              //console.debug("this.flatGeoGridExtraColumns adding ", geovar.varPk + ", colWidth: " + colWidth + 'px, styleClass: ' + colStyleClass + ", isNumbeR: " + geovar.isNumber);
              this.flatGeoGridExtraColumns.push({field: geovar.varPk.toString(), header: geovar.customVarExprDisplay, width: colWidth + 'px'
                                                ,matchType: (['COUNT', 'MEDIAN', 'INDEX', 'PERCENT', 'RATIO'].includes(geovar.fieldconte)) ? "numeric" : "text"
                                                ,matchMode: 'contains', styleClass: colStyleClass});
            }
         });

         // Set the tooltip for the geography
         gridGeo['tooltip'] = this.getGeoTooltip(gridGeo);

         geoGridData.push(gridGeo);
      });

      // Set Ranges
      try
      {
         if (geoGridData != null)
         {
            min = geoGridData.reduce((min, p:FlatGeo) => p['geo.hhc'] < min ? (p['geo.hhc'] != "" ? p['geo.hhc'] : 0) : min, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
            max = geoGridData.reduce((max, p:FlatGeo) => p['geo.hhc'] > max ? (p['geo.hhc'] != "" ? p['geo.hhc'] : 0) : max, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['geo.hhc'] : 0);
            this.hhcRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p:FlatGeo) => p['investment'] < min ? p['investment'] : min, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
            max = geoGridData.reduce((max, p:FlatGeo) => p['investment'] > max ? p['investment'] : max, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['investment'] : 0);
            this.investmentRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p:FlatGeo) => roundTo(p['geo.distance'], 2) < min ? roundTo(p['geo.distance'], 2) : min, (geoGridData != null && geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
            max = geoGridData.reduce((max, p:FlatGeo) => roundTo(p['geo.distance'], 2) > max ? roundTo(p['geo.distance'], 2) : max, (geoGridData != null && geoGridData.length > 0) ? roundTo(geoGridData[0]['geo.distance'], 2) : 0);
            this.distanceRanges = [min, max, min, max];

            min = geoGridData.reduce((min, p:FlatGeo) => p['cpm'] < min ? p['cpm'] : min, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
            max = geoGridData.reduce((max, p:FlatGeo) => p['cpm'] > max ? p['cpm'] : max, (geoGridData != null && geoGridData.length > 0) ? geoGridData[0]['cpm'] : 0);
            this.cpmRanges = [min, max, min, max];
         }
      }
      catch(e)
      {
         console.error("Error setting range: ", e);
      }
      // console.debug("distanceRanges: ", this.distanceRanges);

      // Sort the geo variable columns
      this.sortFlatGeoGridExtraColumns();

      // Update geo grid total columns
      this.setGridTotals();

      //console.log("createComposite - returning geoGridData: ", geoGridData);
      return geoGridData;
   }

   public sortFlatGeoGridExtraColumns() {
      this.variableColOrder = new Map<string, number>();
      for ( const audience of this.targetAudienceService.getAudiences()) {
        if (audience.audienceSourceType === 'Online') {
          if (audience.audienceSourceName === 'Interest') {
            this.variableColOrder.set(audience.audienceName + ' (Interest)', audience.audienceCounter);    
          } else if (audience.audienceSourceName === 'VLH') { 
            this.variableColOrder.set(audience.audienceName + ' (VLH)', audience.audienceCounter);
          } else if (audience.audienceSourceName === 'Pixel') { 
            this.variableColOrder.set(audience.audienceName + ' (Pixel)', audience.audienceCounter);
          } else if (audience.audienceSourceName === 'Audience-TA') { 
            this.variableColOrder.set(audience.secondaryId, audience.audienceCounter);
          } else {
            this.variableColOrder.set(audience.audienceName + ' (In-Market)', audience.audienceCounter);    
          }
        } else {
          this.variableColOrder.set(audience.audienceName, audience.audienceCounter);
        }
      }

      // Add the sort order to the object
      this.flatGeoGridExtraColumns.forEach(col => col['sortOrder'] = (this.variableColOrder != null && this.variableColOrder.has(col.header)) ? this.variableColOrder.get(col.header) : 0);

      // Sort the array of columns
      this.flatGeoGridExtraColumns.sort((a, b) => this.sortVarColumns(a, b));
   }

   public sortVarColumns (a, b) : number
   {
      let aValue: number = a['sortOrder'];
      let bValue: number = b['sortOrder'];

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

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
   public onZoomToGeo(flatGeo: FlatGeo)
   {
      if (flatGeo != null && flatGeo.geo != null) {
         this.esriMapService.zoomOnMap({ min: flatGeo.geo.xcoord, max: flatGeo.geo.xcoord }, { min: flatGeo.geo.ycoord, max: flatGeo.geo.ycoord }, 1);
      }
   }

   public onClickDeleteGeo(flatGeo: FlatGeo)
   {
      if (flatGeo != null && flatGeo.geo != null)
      {
         console.log('onClickDeleteGeo - Fired - Geocode: ' + flatGeo.geo.geocode);

         this.confirmationService.confirm({
            message: 'Do you want to delete geocode: ' + flatGeo.geo.geocode + '?',
            header: 'Delete Geography Confirmation',
            icon: 'ui-icon-trash',
            accept: () => {
               //this.removeLocationHierarchy(row);
               //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
               //                                         target: 'single-' + this.selectedListType.toLowerCase(), action: 'delete' });
               // this.usageService.createCounterMetric(usageMetricName, metricText, 1);
               this.impGeofootprintGeoService.addDbRemove(flatGeo.geo);  // For database removal
//               flatGeo.geo.impGeofootprintTradeArea.impGeofootprintGeos = flatGeo.geo.impGeofootprintTradeArea.impGeofootprintGeos.filter(geo => geo != flatGeo.geo);
               this.impGeofootprintGeoService.remove(flatGeo.geo);
               console.log('remove successful');
            },
            reject: () => {
               console.log('cancelled remove');
            }
          });
      }
      else
         console.log('onClickDeleteGeo - Fired - Geocode: null');
   }

   onSelectGeocode(event: any, isSelected: boolean)
   {      
      const geo: ImpGeofootprintGeo = (event.data.geo as ImpGeofootprintGeo);

      const currentProject = this.appStateService.currentProject$.getValue();
      const geoDeselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'deselected' });
      const geoselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'selected' });
      //console.log('onSelectGeocode - Setting geocode: ', geo.geocode, ' to isActive = ' + isSelected + ", geo: ", geo);
      if (geo.isActive != isSelected)
      {
         geo.isActive = isSelected;

         //This change to update Datastore to fire toggleGeoSelection DE1933
         //this.impGeofootprintGeoService.update(null, null);
         this.impGeofootprintGeoService.makeDirty();
         this.impGeofootprintGeoAttribService.makeDirty();

         let metricText = null;
         const cpm = currentProject.estimatedBlendedCpm != null ? currentProject.estimatedBlendedCpm : 0;
         const amount: number = geo.hhc * cpm / 1000;
         metricText = `${geo.geocode}~${geo.hhc}~${cpm}~${amount}~ui=geoGridCheckbox`;
         if (geo.isActive){
             this.usageService.createCounterMetric(geoselected, metricText, null);
         }
         else{
           this.usageService.createCounterMetric(geoDeselected, metricText, null);
         }
      }

      // Update geo grid total columns
      this.setGridTotals();
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
      console.log("gridToggleRowWithCheckbox - rowData: ", rowData);
      this._geoGrid.selection = this._geoGrid.selection||[];
      let selected = this._geoGrid.isSelected(rowData);
      let dataKeyValue = this._geoGrid.dataKey ? String(this._geoGrid.objectUtils.resolveFieldData(rowData, this._geoGrid.dataKey)) : null;
      this._geoGrid.preventSelectionSetterPropagation = true;

      if (selected) {
          let selectionIndex = this._geoGrid.findIndexInSelection(rowData);
          this._geoGrid._selection = this._geoGrid.selection.filter((val, i) => i != selectionIndex);
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
      console.log("syncGridSelection - fired ");

      let diffCount: number = 0;
      let matchCount: number = 0;

      // Initialize the selection array
      this._geoGrid.selection = this._geoGrid.selection||[];

      // Loop through the grid values, looking at isActive to determine if selected or not
      this._geoGrid.value.forEach (geo => {

         // Determine if the row provided is selected
         let selected = this._geoGrid.isSelected(geo);

         // If there is a difference between what the grid has selected and what the data indicates
         if (selected != (geo.isActive === 1) ? true : false)
         {
            console.log("grid and data mismatch: grid: ", selected ? "selected" : "unselected", ", data: ", (geo.isActive === 1) ? "selected" : "unselected");
            diffCount++;

            // Get the dataKeyValue of the row provided
            let dataKeyValue = this._geoGrid.dataKey ? String(this._geoGrid.objectUtils.resolveFieldData(geo, this._geoGrid.dataKey)) : null;
            this._geoGrid.preventSelectionSetterPropagation = true;

            // If that row is selected, filter it out of selection
            if (geo.isActive === 1) {
               console.log("setting unselected row to selected");
               let selectionIndex = this._geoGrid.findIndexInSelection(geo);
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
               console.log("setting selected row to unselected");
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

         console.log("slicing");
         let newSelection = this._geoGrid.selection.map(x => Object.assign({}, x));
         this._geoGrid._selection = newSelection;

         this._geoGrid.value = this._geoGrid.value.map(x => Object.assign({}, x));
// Works, but overkill         this.impGeofootprintGeoService.makeDirty();         
      console.log("sync finished - matches: ", matchCount, ", differences: ", diffCount);
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
         console.log("onToggleFilteredGeocodes - All Geos isActive set to: ", checked);
         let toggleCount: number = 0;
         //this.impGeofootprintGeoService.setActive(this.impGeofootprintGeoService.get(), event.checked);
         if (this._geoGrid != null)
         {
            if (this._geoGrid.filteredValue != null)
            {
               this._geoGrid.toggleRowsWithCheckbox(null, true);
               this._geoGrid.filteredValue.forEach(geo => {
                  toggleCount++;
                  geo.isActive = (checked) ? 1 : 0
                  this._geoGrid.toggleRowWithCheckbox(event, geo);
               });
               console.log("filtered set " + toggleCount + " geos");
            }
            else
            {
               // this._geoGrid.value.forEach(geo => geo.isActive = (checked) ? 1 : 0);
               this._geoGrid.value.forEach(geo => {
                  toggleCount++;
                  geo.isActive = (checked) ? 1 : 0
                  this._geoGrid.toggleRowWithCheckbox(event, geo);
               });
               console.log("all set " + toggleCount + " geos");
            }
         }
         else
            console.log("No geos to set");            
   }

   onSelectAllGeocodes(event: any)
   {
      console.log("All Geos isActive set to: ", event.checked, ", event: ", event);
      //this.impGeofootprintGeoService.setActive(this.impGeofootprintGeoService.get(), event.checked);
      if (this._geoGrid != null)
      {
         if (this._geoGrid.filteredValue != null)
            this._geoGrid.filteredValue.forEach(geo => geo.isActive = (event.checked) ? 1 : 0);
         else
            this._geoGrid.value.forEach(geo => geo.isActive = (event.checked) ? 1 : 0);
      }
   }

   onDedupeToggle(event: any, geoGrid)
   {
      console.log('event.checked: ', event.checked, ', event: ', event, ', geoGrid: ', geoGrid);

      // Downside to this is that it refreshes the grid data
      this.impGeofootprintGeoService.makeDirty();  // Works, but is only pinky forward.  A 6:30pm on a Friday decision

      // Downside of this is that it doesnt work, but if it did, the grid would just filter itself
      //if (event.checked === true)
      //   geoGrid.filter(1, 'isDeduped', 'equals');
   }

   onFilter(event: any)
   {
      this.setGridTotals();
   }

   /**
    * Utility method used by setGridTotals to reduce the complexity of it.
    * @param totalStr The key of the map to update
    * @param newValue The value to store in the map
    */
   setGridTotal(totalStr: string, newValue: number) {
      this.gridTotals.set(totalStr, {tot: this.gridTotals.get(totalStr).tot + newValue
                                    ,min: (newValue < this.gridTotals.get(totalStr).min) ? newValue : this.gridTotals.get(totalStr).min
                                    ,max: (newValue > this.gridTotals.get(totalStr).max) ? newValue : this.gridTotals.get(totalStr).max
                                    });
   }

   /**
    * Looks at the filtered and unfiltered arrays of the grid and computes totals for display at the 
    * bottom of the column.
    */
   setGridTotals() {
      if (this._geoGrid == null || this._geoGrid._value == null || this._geoGrid._value.length === 0)
         return;

      // Initialize totals
      this.initializeGridTotals();

      let numRows: number = 0;

      try
      {
         if (this._geoGrid.filteredValue != null)
         {
            numRows = this._geoGrid.filteredValue.length;

            this._geoGrid.filteredValue.forEach(element => {
               if ((element.geo.isDeduped === 1 || this.dedupeGrid === false) && element.geo.isActive)
               {
                  this.setGridTotal('hhc',        element.geo.hhc);
                  this.setGridTotal('cpm',        element.cpm);
                  this.setGridTotal('investment', element.investment);
                  this.setGridTotal('distance',   element.geo.distance);
               }
            });
         }
         else
         {
            numRows = this._geoGrid._value.length;

            this._geoGrid._value.forEach(element => {
               if ((element.geo.isDeduped === 1 || this.dedupeGrid === false) && element.geo.isActive)
               {
                  this.setGridTotal('hhc',        element.geo.hhc);
                  this.setGridTotal('cpm',        element.cpm);
                  this.setGridTotal('investment', element.investment);
                  this.setGridTotal('distance',   element.geo.distance);
               }
            });
         }

         // Calculated grid totals
         this.gridTotals.set('cpm', {tot: this.gridTotals.get('cpm').tot
                                    ,cnt: this.gridTotals.get('cpm').cnt
                                    ,min: this.gridTotals.get('cpm').min
                                    ,max: this.gridTotals.get('cpm').max
                                    ,avg: this.gridTotals.get('cpm').tot / numRows});
         this.gridTotals.set('distance', {tot: this.gridTotals.get('distance').tot
                                       ,cnt: this.gridTotals.get('distance').cnt
                                       ,min: this.gridTotals.get('distance').min
                                       ,max: this.gridTotals.get('distance').max
                                       ,avg: this.gridTotals.get('distance').tot / numRows});
      }
      catch(e) 
      {
         console.error("EXCEPTION: ", e);
         console.error("this._geoGrid", this._geoGrid);
         this.debugLogGridTotals();
      }
   }

   /**
    * Used to toggle the gizmo icon and styles used to turn word wrapping on and off in the grid
    */
   public onToggleTableWrap() {
      if (this.tableWrapStyle === this.tableWrapOn) 
      {
         this.tableWrapStyle = this.tableWrapOff
         this.tableWrapIcon = "fa fa-minus";
         this.tableHdrSlice = true;
      }
      else
      {
         this.tableWrapStyle = this.tableWrapOn;
         this.tableWrapIcon = "fa fa-bars";
         this.tableHdrSlice = false;
      }
   }

   debugPrintGrid() {
      console.log("Grid: ", this._geoGrid);
   }
}
