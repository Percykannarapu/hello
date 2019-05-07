import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { map, startWith, filter, take } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { ConfirmationService, MultiSelect, SelectItem } from 'primeng/primeng';
import { Store, select } from '@ngrx/store';
import { LocalAppState, FullAppState } from '../../state/app.interfaces';
import { CreateLocationUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { distinctArray, filterArray, mapArray, resolveFieldData } from '@val/common';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Geocode, HomeGeocode, ReCalcHomeGeos } from '../../state/homeGeocode/homeGeo.actions';
import { ExportHGCIssuesLog } from '../../state/data-shim/data-shim.actions';
import { AppProjectService } from '../../services/app-project.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { selectors } from '@val/esri';

export class FlatSite {
  fgId: number;
  loc: ImpGeofootprintLocation;
  totalHHC: number;
  totalAllocatedHHC: number;
}

@Component({
  selector: 'val-site-list',
  templateUrl: './site-list.component.html',
  styleUrls: ['./site-list.component.css'],
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
//    console.log("SITE-LIST COMPONENT GOT GEOS: ", val);
      this.impGeofootprintGeosBS$.next(val); // || []);
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

   //   public flatAllAttribSites$: Observable<FlatSite[]>;

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
      {field: 'Home Geocode Issue',   header: 'Home Geocode Issue', width: '5em',  styleClass: 'val-text-center', filterMatchMode: 'contains'},
      {field: 'Home Zip Code',        header: 'Home ZIP',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
      {field: 'Home ATZ',             header: 'Home ATZ',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
      {field: 'Home Digital ATZ',     header: 'Home Digital ATZ',    width: '11em',  styleClass: '',                filterMatchMode: 'contains' },
      {field: 'Home Carrier Route',   header: 'Home PCR',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
      {field: 'Home DMA',             header: 'Home DMA',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
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
   @ViewChild('locGrid') public _locGrid: Table;

   public showDialog: boolean = false;

   constructor(
      private appLocationService: AppLocationService,
      private confirmationService: ConfirmationService,
      private appProjectService: AppProjectService,
      private cd: ChangeDetectorRef,
      private impLocationService: ImpGeofootprintLocationService,
      private impLocAttributeService: ImpGeofootprintLocAttribService,
      //private valGeocodingRequest: ValGeocodingRequest,
      private store$: Store<LocalAppState>,
      private fullStateStore$: Store<FullAppState>) {}

   ngOnInit() {
      // Observe the behavior subjects on the input parameters
      this.allGeos$ = this.impGeofootprintGeosBS$.asObservable().pipe(startWith(null));

      this.allLocations$ = this.allLocationsBS$.asObservable();
      this.allLocationAttribs$ = this.allLocationAttribsBS$.asObservable();
      
      this.onListTypeChange('Site');

      this.fullStateStore$.pipe(
        select(selectors.getMapReady),
        filter(ready => ready),
        take(1)
      ).subscribe(() => {
        this.failures$ = combineLatest(this.appLocationService.failedClientLocations$, this.appLocationService.failedCompetitorLocations$).pipe(
          map(([sites, competitors]) => [...sites, ...competitors])
        );
        this.hasFailures$ = this.appLocationService.hasFailures$;
        this.totalCount$ = this.appLocationService.totalCount$;
      });
      
      for (const column of this.flatSiteGridColumns) {
         this.columnOptions.push({ label: column.header, value: column });
         this.selectedColumns.push(column);
      }

      // temp to see if wired up
//      this.allGeos$.subscribe(geos => {console.log("### allGeos$ subscription got ", (geos != null) ? geos.length : null, " geos")});

//      this.flatAllSites$ = this.allGeos$.pipe(withLatestFrom(this.currentAllSites$)
//                                             ,map(([geos, locs]) => this.createComposite(locs, geos)));

/* DPG 11/8/18 - Put back taking out to try rolling into create composite      
      this.allGeos$.subscribe(geos => {
         if (geos != null && geos.length > 0) {
            setTimeout(() => {
               this.fnCalcHHC(geos);
            }, 0);
         }
      });*/

/*      this.geoService.getStoreData()
         .subscribe((geos) => {
            if (geos != null && geos.length > 0) {
               setTimeout(() => {
                  const geoData = this.geoService.get();
                  this.fnCalcHHC(geoData);
               }, 0);
            }
         });*/
   }

/* ROLLED INTO CREATE COMPOSITE   
   public fnCalcHHC(geoData) {
      console.log("-".padEnd(80, "-"));
      console.log("SITE-LIST-COMPONENT - fnCalcHHC", geoData);
      console.log("-".padEnd(80, "-"));
      const hhc = [], allocHHC = [];
      for (let i = 0; i < this._locGrid.value.length; i++) {
         hhc[i] = 0, allocHHC[i] = 0;
         const locationNumber = this._locGrid.value[i].locationNumber;
         geoData.filter(function (row) {
            if (row.impGeofootprintLocation.locationNumber == locationNumber && row.isActive) {
               hhc[i] += row.hhc;
               if (row.rank == 0) {
                  allocHHC[i] += row.hhc;
               }
            }
         });
      }

      // I don't think I want to do this any longer.  createComposite should be watching
      // for changes on the locations and geos and create these summary values whenever they
      // change
      console.log("about to assign flatAllSites");
      this.flatAllSites$ = this.flatAllSites$.pipe(
         map(function(sites: FlatSite[], i) {
            console.log("flatAllSites processing");
            if (!sites)
               return;
            console.log("flatAllSites there are sites to process.  sites.length: ", sites.length);
            let updatedSites: FlatSite[] = [];

            for ( let k = 0; k < sites.length; k++ ) {
               updatedSites.push({...sites[k]
                                 ,totalHHC: hhc[k]
                                 ,totalAllocatedHHC: allocHHC[k]});
               console.log("updatedSites.length: ", updatedSites.length);
//               sites[k].totalHHC = hhc[k];
//               sites[k].totalAllocatedHHC = allocHHC[k];
            }
            console.log("fnCalcHHC returning ", updatedSites.length, " updated sites.  sites === updatedSites: ", (sites === updatedSites));
            return updatedSites;
         })
      );
      console.log("=".padEnd(80, "="));
   }
*/

   remove(site: ImpGeofootprintLocation) {
    this.appLocationService.deleteLocations([site]);
   }

   reSubmit(site: ImpGeofootprintLocation){
    this.resubmitFailedGrid.emit(site);
   }

   accept(site: ImpGeofootprintLocation) {
    site.clientLocationTypeCode = site.clientLocationTypeCode.replace('Failed ', '');
    if (site.recordStatusCode === 'PROVIDED'){
      const homeGeoColumnsSet = new Set(['Home ATZ', 'Home Zip Code', 'Home Carrier Route', 'Home County', 'Home DMA', 'Home Digital ATZ']);
      site.impGeofootprintLocAttribs.forEach(attr => {
        if (homeGeoColumnsSet.has(attr.attributeCode)){
          attr.attributeValue = '';
        }
      });
      site['homeGeoFound'] = null;
      site.impGeofootprintTradeAreas = [];
      const reCalculateHomeGeos = false;
      const isLocationEdit =  false;
      const locations = [site];
      this.store$.dispatch(new HomeGeocode({locations, isLocationEdit, reCalculateHomeGeos}));
    }
    else
      this.appLocationService.notifySiteChanges();
    const metricText = AppLocationService.createMetricTextForLocation(site);
    this.store$.dispatch(new CreateLocationUsageMetric('failure', 'accept', metricText));
   }

   manuallyGeocode(site: ValGeocodingRequest, siteType){  
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

      // Rollup attributes into flat location lines
//      this.flatAllSites$ = this.currentAllSites$.pipe(map(locs => this.createComposite(locs)));

      // this.flatAllSites$ = this.currentAllSites$.pipe(withLatestFrom(this.allGeos$)
      //                                                ,map(([locs, geos]) => this.createComposite(locs, geos)));

      this.flatAllSites$ = combineLatest(this.currentAllSites$, this.allGeos$)
                                        .pipe(map(([locs, geos]) => this.createComposite(locs, geos)));

/*
      this.allImpGeofootprintGeos$ = combineLatest(this.projectBS$, this.allProjectVars$, this.allGeos$, this.allAttributesBS$, this.allVars$, this.varColOrderBS$)
                                    .pipe(tap(x => this.setGridTotals())
                                         ,tap(x => this.syncHeaderFilter())
                                         ,map(([discovery, projectVars, geos, attributes, vars]) => this.createComposite(discovery, projectVars, geos, attributes, vars))
                                          // Share the latest emitted value by creating a new behaviorSubject on the result of createComposite (The previous operator in the pipe)
                                          // Allows the first subscriber to run pipe and all other subscribers get the result of that
                                         ,publishReplay(1)
                                         ,refCount()       // Keeps track of all of the subscribers and tells publishReply to clean itself up
                                         //,tap(geoData => console.log("OBSERVABLE FIRED: allImpGeofootprintGeos$ - Geo Data changed (combineLatest)", geoData))
                                         );*/
/*
      const visibleGeos$ = this.appStateService.uniqueVisibleGeocodes$;
      const newGeos$ = this.newVisibleGeos$.pipe(startWith(null));
      this.shadingSub = combineLatest(this.appStateService.analysisLevel$, newGeos$, visibleGeos$).subscribe(
        ([analysisLevel, newGeos, visibleGeos]) => {
          if (!newGeos) {
            this.getShadingData(analysisLevel, visibleGeos, shadingAudience[0]);
          } else {
            this.getShadingData(analysisLevel, newGeos, shadingAudience[0]);
          }
        }
      );   */                                      

      this.flatActiveSites$ = this.flatAllSites$.pipe(filterArray(flatLoc => flatLoc.loc.isActive === true));

      // this.flatAllAttribSites$ = this.attributeService.storeObservable.pipe(map(attribs => this.createCompositeFromAttribs(attribs)));

      // ----------------------------------------------------------------------
      // Table filter observables
      // ----------------------------------------------------------------------

      // Create an observable for unique cities (By hand method)
      this.uniqueCity$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                   , map(locs => Array.from(new Set(locs.map(loc => loc.locCity)))
                                                   .map(str => new Object({ label: str, value: str}) as SelectItem)));

      // Create an observable for unique states (By helper methods)
      this.uniqueState$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                    , mapArray(loc => loc.locState)
                                                    , distinctArray()
                                                    , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique market names
      this.uniqueMarket$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                     , mapArray(loc => loc.marketName)
                                                     , distinctArray()
                                                     , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique market codes
      this.uniqueMarketCode$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                         , mapArray(loc => loc.marketCode)
                                                         , distinctArray()
                                                         , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique market codes
      this.uniqueRecStatuses$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                          , mapArray(loc => loc.recordStatusCode)
                                                          , distinctArray()
                                                          , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique geocoder match codes
      this.uniqueMatchCodes$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                         , mapArray(loc => loc.geocoderMatchCode)
                                                         , distinctArray()
                                                         , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique geocoder match qualities
      this.uniqueMatchQualities$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                             , mapArray(loc => loc.geocoderLocationCode)
                                                             , distinctArray()
                                                             , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique original cities
      this.uniqueOrigCity$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                       , mapArray(loc => loc.origCity)
                                                       , distinctArray()
                                                       , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      // Create an observable for unique original states
      this.uniqueOrigState$ = this.currentAllSites$.pipe(filterArray(loc => loc.isActive === true)
                                                        , mapArray(loc => loc.origState)
                                                        , distinctArray()
                                                        , mapArray(str => new Object({ label: str, value: str}) as SelectItem));

      this.setCounts();
   }

   public onRowSelect(event: any, isSelected: boolean) {
      this.setLocationHierarchyActiveFlag(event.data, isSelected);
   }

   public onEdit(row: ImpGeofootprintLocation) {
   //  const locAttribs = row['impGeofootprintLocAttribs'];
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
      // homeZip: locAttribs.filter(la => la.attributeCode === 'Home Zip Code').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Zip Code')[0].attributeValue : '',
      // homeAtz: locAttribs.filter(la => la.attributeCode === 'Home ATZ').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home ATZ')[0].attributeValue : '',
      // homeDigitalAtz: locAttribs.filter(la => la.attributeCode === 'Home Digital ATZ').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Digital ATZ')[0].attributeValue : '',
      // homePcr: locAttribs.filter(la => la.attributeCode === 'Home Carrier Route').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home Carrier Route')[0].attributeValue : '',
      // homeDmaCode: locAttribs.filter(la => la.attributeCode === 'Home DMA').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home DMA')[0].attributeValue : '',
      // homeCountyFip: locAttribs.filter(la => la.attributeCode === 'Home County').length === 1 ? locAttribs.filter(la => la.attributeCode === 'Home County')[0].attributeValue : ''
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
   public calcHomeGeocode(){
     if ( this.impLocationService.get().length > 0){
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
     
    const site: SuccessfulLocationTypeCodes = ImpClientLocationTypeCodes.Site;
    //this.confirmationService.confirm({
    //   message: 'Home Geocode Issues Log',
    //   header: 'There are no home geocoding issues to report',
    //   accept: () => {
    //    this.store$.dispatch(new ExportHGCIssuesLog({locationType: site}))
    //    // this.store$.dispatch(new ExportLocations({ locationType }));

    //      }
    //});
    this.store$.dispatch(new ExportHGCIssuesLog({locationType: site}));
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
      //  this.geoAttributeService.makeDirty();
      //  this.geoService.makeDirty();
      //  this.tradeAreaService.makeDirty();
      //  this.attributeService.makeDirty();
      //  this.locationService.makeDirty();
   }

   private setCounts() {
      // every time we change the ref to the current observable, we have to reset the mapping
      this.allSiteCount$ = this.currentAllSites$.pipe(map(s => s.length));
      this.activeSiteCount$ = this.currentActiveSites$.pipe(map(s => s.length));
   }

   createComposite(locs: ImpGeofootprintLocation[], geos?: ImpGeofootprintGeo[]) : FlatSite[] 
   {
      // console.log("-".padEnd(80, "-"));
      // console.log("SITE-LIST - createComposite - Locs: ", (locs != null) ? locs.length : null, ", Geos: ", (geos != null) ? geos.length : null);
      // console.log("-".padEnd(80, "-"));
      // This shows that at the time this fires, the new "Home" location attributes are not on the location
      // console.log("locs", locs.toString());

      let fgId = 0;
      const siteGridData: FlatSite[] = [];

      // Calculate totals per site
      const hhcMap: Map<string, number> = new Map<string, number>();
      const allocHhcMap: Map<string, number> = new Map<string, number>();

      if (geos != null) {
//         console.log("SITE-LIST - createComposite - processing geos: ", geos.length);
         geos.forEach(geo => {
            if (geo.isActive && geo.hhc >= 0) {
// TODO: At least for audience trade areas, the hhc is being counted BEFORE the isActive flag is set to 0, perhaps change that code to mutate the geos
//               let hhc = hhcMap.get(geo.impGeofootprintLocation.locationNumber);
//               hhc = ((hhc != null && hhc != NaN) ? hhc : 0) + geo.hhc;
//               console.log("Loc: ", geo.impGeofootprintLocation.locationNumber, ", geo: ", geo.geocode, " - from: ", hhcMap.get(geo.impGeofootprintLocation.locationNumber), " to: ", hhc, ", added: ", geo.hhc);
//               hhcMap.set(geo.impGeofootprintLocation.locationNumber, hhc);
               hhcMap.set(geo.impGeofootprintLocation.locationNumber, (hhcMap.get(geo.impGeofootprintLocation.locationNumber) || 0) + geo.hhc);
               if (geo.rank === 0) {
//                  let hhc = allocHhcMap.get(geo.impGeofootprintLocation.locationNumber);
//                  hhc = ((hhc != null && hhc != NaN) ? hhc : 0) + geo.hhc;   
                  allocHhcMap.set(geo.impGeofootprintLocation.locationNumber, (allocHhcMap.get(geo.impGeofootprintLocation.locationNumber) || 0) + geo.hhc);
               }
            }
         });
//         console.log("SITE-LIST - createComposite - finished geos: ", hhcMap);
      }

//      console.log("SITE-LIST - createComposite - processing locs: ", (locs != null) ? locs.length : null);
      locs.forEach(loc => {
         const gridSite: FlatSite = new FlatSite();
         gridSite.fgId = fgId++;
         gridSite.loc = loc;

         // Grid doesn't work well with child values.  Can use resolveFieldData in the template, but then filtering doesn't work
         this.flatSiteGridColumns.forEach(col => {
         gridSite[col.field] = resolveFieldData(loc, col.field) || '';
         });

//         console.log("SITE-LIST - createComposite - assigning loc: ", loc.locationNumber, ", HHC: ", hhcMap.get(loc.locationNumber));
         gridSite.totalHHC = hhcMap.get(loc.locationNumber);
         gridSite.totalAllocatedHHC = allocHhcMap.get(loc.locationNumber);

         //console.log("createComposite - adding loc: " + loc.locationName);
         loc.impGeofootprintLocAttribs.forEach(attribute => {
            // console.log("createComposite attribute:", attribute);
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

//       gridSite['totalHHC'] = null;
//       gridSite['totalAllocatedHHC'] = null;
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
         //console.log("gridSite: ", gridSite);
         siteGridData.push(gridSite);
      });

      //console.log("createComposite - returning siteGridData: ", siteGridData);
      //console.log("-".padEnd(80, "-"));
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
