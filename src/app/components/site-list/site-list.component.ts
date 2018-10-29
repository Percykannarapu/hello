import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AppLocationService } from '../../services/app-location.service';
import { Observable } from 'rxjs';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { map } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { ConfirmationService, SelectItem } from 'primeng/primeng';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { EsriMapService } from '../../esri/services/esri-map.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';
import { resolveFieldData } from '../../val-modules/common/common.utils';
import { distinctArray, mapArray, filterArray } from '../../val-modules/common/common.rxjs';
import { ImpClientLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';

export class FlatSite {
  fgId: number;
  loc: ImpGeofootprintLocation;
  totalHHC: number;
  totalAllocatedHHC: number;
}

@Component({
  selector: 'val-site-list',
  templateUrl: './site-list.component.html',
  styleUrls: ['./site-list.component.css']
})
export class SiteListComponent implements OnInit {

  public selectedListType: 'Site' | 'Competitor';
  public currentAllSites$: Observable<ImpGeofootprintLocation[]>;
  public currentActiveSites$: Observable<ImpGeofootprintLocation[]>;
  public allSiteCount$: Observable<number>;
  public activeSiteCount$: Observable<number>;

  public currentAllAttributes$: Observable<ImpGeofootprintLocAttrib[]>;
  public currentActiveAttributes$: Observable<ImpGeofootprintLocAttrib[]>;

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
     {field: 'Home ZIP',             header: 'Home ZIP',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home ATZ',             header: 'Home ATZ',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home Digital ATZ',     header: 'Home Digital ATZ',    width: '11em',  styleClass: '',                filterMatchMode: 'contains' },
     {field: 'Home PCR',             header: 'Home PCR',            width: '8em',   styleClass: '',                filterMatchMode: 'contains' },
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
  @ViewChild('locGrid') public _locGrid: Table;

  constructor(private siteListService: AppLocationService,
    private locationService: ImpGeofootprintLocationService,
    private attributeService: ImpGeofootprintLocAttribService,
    private confirmationService: ConfirmationService,
    private tradeAreaService: ImpGeofootprintTradeAreaService,
    private geoService: ImpGeofootprintGeoService,
    private geoAttributeService: ImpGeofootprintGeoAttribService,
    private appStateService: AppStateService,
    private esriMapService: EsriMapService,
    private usageService: UsageService) { }

  ngOnInit() {
    this.onListTypeChange('Site');
    for (const column of this.flatSiteGridColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }

    this.geoService.getStoreData()
    .subscribe((geos) => {
      if (geos != null && geos.length > 0) {
        setTimeout(() => {
          const geoData = this.geoService.get();
          this.fnCalcHHC(geoData);
        }, 0);
      }
    });
  }

  public fnCalcHHC(geoData) {
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

    this.flatAllSites$ = this.flatAllSites$.pipe(
      map(function(site, i) {
        if (!site) return;
        for ( let k = 0; k < site.length; k++ ) {
          site[k].totalHHC = hhc[k];
          site[k].totalAllocatedHHC = allocHHC[k];
        }
        return site;
      })
    );
  }
  
  public onListTypeChange(data: 'Site' | 'Competitor') {
    this.selectedListType = data;
    if (this.selectedListType === 'Site') {
      this.currentAllSites$ = this.siteListService.allClientLocations$;
      this.currentActiveSites$ = this.siteListService.activeClientLocations$;
    }
    else {
      this.currentAllSites$ = this.siteListService.allCompetitorLocations$;
      this.currentActiveSites$ = this.siteListService.activeCompetitorLocations$;
    }

    // Rollup attributes into flat location lines
    this.flatAllSites$ = this.currentAllSites$.pipe(map(locs => this.createComposite(locs)));
    this.flatActiveSites$ = this.flatAllSites$.pipe(filterArray(flatLoc => flatLoc.loc.isActive === true));

    // this.flatAllAttribSites$ = this.attributeService.storeObservable.pipe(map(attribs => this.createCompositeFromAttribs(attribs)));

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

  public onRowDelete(row: ImpGeofootprintLocation) {
    const metricText = AppLocationService.createMetricTextForLocation(row);
    this.confirmationService.confirm({
      message: 'Do you want to delete this record?',
      header: 'Delete Confirmation',
      icon: 'ui-icon-trash',
      accept: () => {
        this.siteListService.deleteLocations([row]);
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
                                                  target: 'single-' + this.selectedListType.toLowerCase(), action: 'delete' });
        this.usageService.createCounterMetric(usageMetricName, metricText, null);
        console.log('remove successful');
      },
      reject: () => {
        console.log('cancelled remove');
      }
    });
  }

  public onDelete() {
    this.confirmationService.confirm({
      message: 'Do you want to delete all ' + this.selectedListType + 's ?',
      header: 'Delete Confirmation',
      accept: () => {
        const allLocations = this.locationService.get().filter(a => a.clientLocationTypeCode === this.selectedListType || a.clientLocationTypeCode === `Failed ${this.selectedListType}`);
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location',
        target: this.selectedListType.toLowerCase() + '-list', action: 'delete' });
        this.siteListService.deleteLocations(allLocations);
        this.usageService.createCounterMetric(usageMetricName, null, allLocations.length);
        this.appStateService.clearUserInterface();
        const siteCode = ImpClientLocationTypeCodes.markSuccessful(ImpClientLocationTypeCodes.parse(this.selectedListType));
        this.appStateService.setProvidedTradeAreas(false, siteCode );
        this.flatSiteGridColumns.splice(this.flatSiteGridColumnsLength, Number(this.selectedColumns.length - this.flatSiteGridColumnsLength));
        this.selectedColumns.splice(this.flatSiteGridColumnsLength, Number(this.selectedColumns.length - this.flatSiteGridColumnsLength));
      }
    });
  }

  public onRowZoom(row: ImpGeofootprintLocation) {
    this.esriMapService.zoomOnMap({ min: row.xcoord, max: row.xcoord }, { min: row.ycoord, max: row.ycoord }, 1);
    this.appStateService.closeOverlays();
  }

  public setLocationHierarchyActiveFlag(location: FlatSite, isActive: boolean) {
    console.log('setLocationHierarchyActiveFlag - location:', location, ', isActive: ', isActive);
    if (location == null) {
      console.log('setLocationHierarchyActive flag called with null location');
      return;
    }

    location.loc.getImpGeofootprintGeos().forEach(geo => {
      geo.impGeofootprintGeoAttribs.forEach(attr => attr.isActive = isActive);
      geo.isActive = isActive;
    });
    location.loc.impGeofootprintTradeAreas.forEach(ta => ta.isActive = isActive);
    location.loc.impGeofootprintLocAttribs.forEach(attr => attr.isActive = isActive);
    location.loc.isActive = isActive;
    this.geoAttributeService.makeDirty();
    this.geoService.makeDirty();
    this.tradeAreaService.makeDirty();
    this.attributeService.makeDirty();
    this.locationService.makeDirty();
  }

  private setCounts() {
    // every time we change the ref to the current observable, we have to reset the mapping
    this.allSiteCount$ = this.currentAllSites$.pipe(map(s => s.length));
    this.activeSiteCount$ = this.currentActiveSites$.pipe(map(s => s.length));
  }

  public resolveFieldData(data: any, field: any) : any 
  {
    return resolveFieldData(data, field);
  }

  createComposite(locs: ImpGeofootprintLocation[]) : FlatSite[] 
  {
    const UnselLocCount: number = locs.filter(loc => loc.isActive === false).length;
    //console.log("-".padEnd(80, "-"));
    //console.log('createComposite: locs: ', (locs != null) ? locs.length : null, ', Unselected Locs', UnselLocCount/*, ', attributes: ', (locAttributes != null) ? locAttributes.length : null*/);
    //console.log("-".padEnd(80, "-"));
    // This shows that at the time this fires, the new "Home" location attributes are not on the location
    //console.log("locs", locs.toString());

    let fgId = 0;
    const siteGridData: FlatSite[] = [];
    const attributeCols: any[] = [];

    locs.forEach(loc => {
      const gridSite: FlatSite = new FlatSite();
      gridSite.fgId = fgId++;
      gridSite.loc = loc;

      // Grid doesn't work well with child values.  Can use resolveFieldData in the template, but then filtering doesn't work
      this.flatSiteGridColumns.forEach(col => {
        gridSite[col.field] = resolveFieldData(loc, col.field) || '';
      });

      //console.log("createComposite - adding loc: " + loc.locationName);
      loc.impGeofootprintLocAttribs.forEach(attribute => {
        // console.log("createComposite attribute:", attribute);
        gridSite[attribute.attributeCode] = attribute.attributeValue;

        const column = {'field': attribute.attributeCode, 'header': attribute.attributeCode, 'width': '10em', 'styleClass': ''};

        // If the column isn't already in the list, add it
        if (!this.flatSiteGridColumns.some(c => c.field === attribute.attributeCode)) 
        {
          attributeCols.push(column);
          this.flatSiteGridColumns.push(column);
          this.columnOptions.push({ label: column.header, value: column });
          this.selectedColumns.push(column);
        }
      });

      gridSite['totalHHC'] = null;
      gridSite['totalAllocatedHHC'] = null;

      //console.log("gridSite: ", gridSite);
      siteGridData.push(gridSite);
    });

    //console.log("createComposite - returning siteGridData: ", siteGridData);
    //console.log("-".padEnd(80, "-"));
    return siteGridData;
  }

  // createCompositeFromAttribs (attribs: ImpGeofootprintLocAttrib[]) : FlatSite[]
  // {
  //    console.log("-------------------------------------------------------------------------");
  //    console.log("createCompositeFromAttribs - fired")
  //    console.log("-------------------------------------------------------------------------");
  //    let flatSites: FlatSite[] = [];

  //    attribs.forEach(attrib => {
  //       console.log("createCompositeFromAttribs - attribute:", attrib);
  //    });
  //    console.log("-------------------------------------------------------------------------");

  //    return flatSites;
  // }

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
}
