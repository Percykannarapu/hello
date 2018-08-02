import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ConfirmationService } from 'primeng/primeng';
import { SelectItem } from 'primeng/components/common/selectitem';
import { AppStateService } from '../../services/app-state.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppConfig } from '../../app.config';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { EsriUtils } from '../../esri-modules/core/esri-utils.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { ImpGeofootprintVarService } from '../../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintVar } from '../../val-modules/targeting/models/ImpGeofootprintVar';
import { AppDiscoveryService } from '../../services/app-discovery.service';
import { MenuItem } from 'primeng/components/common/menuitem';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { ImpProjectVarService } from '../../val-modules/targeting/services/ImpProjectVar.service';
import { groupBy } from '../../val-modules/common/common.utils';
/*
import { ImpProjectPrefService } from '../../val-modules/targeting/services/ImpProjectPref.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintMaster } from '../../val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeAreaService } from './../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintMasterService } from '../../val-modules/targeting/services/ImpGeofootprintMaster.service';*/

export interface FlatGeo {
   fgId: number;
   geo: ImpGeofootprintGeo;
}

// combineLatest(geos$, vars$).pipe(map(([geos, vars]) => createMyNewUIModel(geos, vars)))

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private discoverySubscription: Subscription;
   private siteSubscription: Subscription;
   private geosSubscription: Subscription;
   private attributeSubscription: Subscription;
   private varSubscription: Subscription;
   private gridSubscription: Subscription;

   private allGeos$: Observable<ImpGeofootprintGeo[]>;
   private allAttributes$: Observable<ImpGeofootprintGeoAttrib[]>;
   private allVars$: Observable<ImpGeofootprintVar[]>;

   public  impGeofootprintLocations: ImpGeofootprintLocation[];
   public  selectedImpGeofootprintLocations: ImpGeofootprintLocation[];

//   public  impGeofootprintGeos: ImpGeofootprintGeo[];
//   public  selectedImpGeofootprintGeos: ImpGeofootprintGeo[];

   public  allImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  displayedImpGeofootprintGeos$: Observable<FlatGeo[]>;
   public  selectedImpGeofootprintGeos$: Observable<FlatGeo[]>;

   public  impGeofootprintGeoAttributes: ImpGeofootprintGeoAttrib[];
   private impGeofootprintVars: ImpGeofootprintVar[];

   public  numGeosActive: number = 0;
   public  numGeosInactive: number = 0;

   public  selectedGeo: FlatGeo;
   public  geoInfoMenuItems: MenuItem[];

   public  dedupeGrid: boolean = false;

   public myStyles = {
      'background-color': 'lime',
      'text-align': 'right'
   };

   public rAlign = 'right';

   public  locGridColumns: SelectItem[] = [{label: 'locationName', value: {field: 'locationName', header: 'Location',     width: '30%', style: '{\'width\':\'60%\'}'}},
                                           {label: 'homeGeocode',  value: {field: 'home_geo',     header: 'Home Geocode', width: '20%', style: '{\'width\':\'20%\'}'}},
                                           {label: 'ycoord',       value: {field: 'ycoord',       header: 'Lat',          width: '15%', style: '{\'width\':\'10%\'}'}},
                                           {label: 'xcoord',       value: {field: 'xcoord',       header: 'Long',         width: '15%', style: '{\'width\':\'10%\'}'}},
                                          ];

   public  geoGridColumns: SelectItem[] = [{label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  width: '30%', styleClass: ''}},
                                           {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      width: '20%', styleClass: 'val-text-right'}},
                                           {label: 'distance', value: {field: 'distance', header: 'Distance', width: '20%', styleClass: 'val-text-right'}}
                                          ];

   public  flatGeoGridColumns: SelectItem[] =
                                         [{label: 'Location Number',      value: {field: 'geo.impGeofootprintLocation.locationNumber',  header: 'Number',               width: '7em',   styleClass: ''}},
                                          {label: 'Location Name',        value: {field: 'geo.impGeofootprintLocation.locationName',    header: 'Name',                 width: '16em',  styleClass: ''}},
                                          {label: 'In Market',            value: {field: 'geo.impGeofootprintLocation.marketName',      header: 'Market',               width: '12em',  styleClass: ''}},
                                          {label: 'Location Address',     value: {field: 'geo.impGeofootprintLocation.locAddress',      header: 'Address',              width: '14em',  styleClass: ''}},
                                          {label: 'Location City',        value: {field: 'geo.impGeofootprintLocation.locCity',         header: 'City',                 width: '9em',   styleClass: ''}},
                                          {label: 'Location State',       value: {field: 'geo.impGeofootprintLocation.locState',        header: 'State',                width: '7em',   styleClass: ''}},
                                          {label: 'Location Zip',         value: {field: 'geo.impGeofootprintLocation.locZip',          header: 'ZIP',                  width: '6.5em', styleClass: ''}},
                                          {label: 'Location HomeGeocode', value: {field: 'home_geo',                                    header: 'Home Geo Ind',         width: '8.5em', styleClass: ''}},
                                          {label: 'distance',             value: {field: 'geo.distance',                                header: 'Distance',             width: '7em',   styleClass: 'val-text-right'}},
                                          {label: 'geocode',              value: {field: 'geo.geocode',                                 header: 'Geocode',              width: '8em',   styleClass: ''}},
                                          {label: 'City/State',           value: {field: 'city_name',                                   header: 'Geo City, State',      width: '15em',  styleClass: ''}},
                                          {label: 'hhc',                  value: {field: 'geo.hhc',                                     header: 'HHC',                  width: '6em',   styleClass: 'val-text-right'}},
                                          {label: 'cpm',                  value: {field: 'cpm',                                         header: 'CPM',                  width: '5em',   styleClass: 'val-text-right'}},
                                          {label: 'investment',           value: {field: 'investment',                                  header: 'Investment',           width: '8em',   styleClass: 'val-text-right'}},
                                          {label: 'Owner Group',          value: {field: 'ownergroup',                                  header: 'Owner Group',          width: '9em',   styleClass: ''}},
                                          {label: 'Coverage Description', value: {field: 'coveragedescription',                         header: 'Coverage Description', width: '12em',  styleClass: ''}},
                                          {label: 'POB',                  value: {field: 'pob',                                         header: 'POB',                  width: '4em',   styleClass: 'val-text-center'}},
                                          {label: 'DMA',                  value: {field: 'dma',                                         header: 'DMA',                  width: '12em',  styleClass: ''}},
                                          {label: 'isDeduped',            value: {field: 'geo.isDeduped',                               header: 'In Deduped',           width: '7em',   styleClass: ''}},
                                         ];

   public  flatGeoGridExtraColumns: SelectItem[];
   public  selectedColumns: any[] = [];
   public  columnOptions: SelectItem[] = [];

   public  selectAllGeos: boolean;

   public  geoGridAdditionalColumns: string[] = [];
   public  geoGridCache: Map<ImpGeofootprintLocation, any[]> = new Map();

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public  config: AppConfig,
               public  impProjectService: ImpProjectService,
/*             public  impProjectPrefService: ImpProjectPrefService,
               public  impGeofootprintMasterService: ImpGeofootprintMasterService,
               public  impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,*/
               public  impGeofootprintGeoService: ImpGeofootprintGeoService,
               public  impGeofootprintLocationService: ImpGeofootprintLocationService,
               private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService,
               private impGeofootprintVarService: ImpGeofootprintVarService,
               private impDiscoveryService: AppDiscoveryService,
               private appStateService: AppStateService,
               private esriMapService: EsriMapService,
               private confirmationService: ConfirmationService,
               private impProjectVarService: ImpProjectVarService,
               private usageService: UsageService) { }

   ngOnInit()
   {
      // Subscribe to the discovery data store
//      this.discoverySubscription = this.impDiscoveryService.storeObservable.subscribe(storeData => this.onChangeDiscovery(storeData[0]));

      // Subscribe to the sites data store
      this.siteSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(storeData => this.onChangeLocation(storeData));

      // Subscribe to the geos data store
      //this.geosSubscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.onChangeGeos(storeData));

      //this.attributeSubscription = this.impGeofootprintGeoAttribService.storeObservable.subscribe(storeData => this.onChangeGeoAttributes(storeData));

      //this.varSubscription = this.impGeofootprintVarService.storeObservable.subscribe(storeData => this.onChangeGeoVars(storeData));

      this.allGeos$ = this.impGeofootprintGeoService.storeObservable;
      this.allAttributes$ = this.impGeofootprintGeoAttribService.storeObservable;
      this.allVars$ = this.impGeofootprintVarService.storeObservable;

      this.geosSubscription = this.allGeos$.subscribe(geos => {
         //console.log('geofootprint-geo-list.component - geosSubscription fired. Geos: ', geos);
         this.onChangeGeos(geos);
      });

      this.attributeSubscription = this.allAttributes$.subscribe(attributes => {
         //console.log('geofootprint-geo-list.component - attributeSubscription fired. Attributes: ', attributes);
         this.onChangeGeoAttributes(attributes);
      });

      this.varSubscription = this.allVars$.subscribe(vars => {
         //console.log('geofootprint-geo-list.component - varSubscription fired. Vars: ', vars);
         this.onChangeGeoVars(vars);
      });

      // setGridData(geos: ImpGeofootprintGeo[], geoAttributes: ImpGeofootprintGeoAttrib[], vars: ImpGeofootprintVar[])

      const nonNullProject$ = this.appStateService.currentProject$.pipe(filter(project => project != null));
      this.allImpGeofootprintGeos$ = combineLatest(nonNullProject$,this.allGeos$,this.allAttributes$, this.allVars$)
                                    .pipe(map(([discovery, geos, vars, attributes]) => this.createComposite(discovery, geos, vars, attributes)));

      // Original good
      // this.allImpGeofootprintGeos$ = combineLatest(nonNullProject$, this.allGeos$, this.allAttributes$, this.allVars$)
      //                               .pipe(map(([discovery, geos, vars, attributes]) => this.createComposite(discovery, geos, vars, attributes)));

      this.displayedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$
                                               .pipe(map((AllGeos) => {
                                                  return AllGeos.filter(flatGeo => flatGeo.geo.isDeduped === 1 || this.dedupeGrid === false); }));

      this.selectedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$
                                              .pipe(map((AllGeos) => {
                                                 this.numGeosActive   = AllGeos.filter(flatGeo => flatGeo.geo.isActive === true  && (flatGeo.geo.isDeduped === 1 || this.dedupeGrid === false)).length;
                                                 this.numGeosInactive = AllGeos.filter(flatGeo => flatGeo.geo.isActive === false && (flatGeo.geo.isDeduped === 1 || this.dedupeGrid === false)).length;
                                                 return AllGeos.filter(flatGeo => flatGeo.geo.isActive === true); }));

      // Good - Just doesn't have the console log
      //this.selectedImpGeofootprintGeos$ = this.allImpGeofootprintGeos$.pipe(
      //   map(geos => geos.filter(flatGeo => flatGeo.geo.isActive === true))
      //);

      // Column Picker Model
      for (const column of this.flatGeoGridColumns) {
         this.columnOptions.push({ label: column.value.header, value: column });
         this.selectedColumns.push(column);
      }
   }

   ngOnDestroy()
   {
//      this.geosSubscription.unsubscribe();
      //this.siteSubscription.unsubscribe();
   }

   // -----------------------------------------------------------
   // SUBSCRIPTION CALLBACK METHODS
   // -----------------------------------------------------------
   /**
    * Assigns the local cache of geos from the subscription and
    * assigns the closest sites.
    *
    * @param impGeofootprintGeos The array of geos received from the observable
    */
   onChangeGeos(impGeofootprintGeos: ImpGeofootprintGeo[])
   {
//    console.log('onChangeGeos fired', impGeofootprintGeos);
//      this.impGeofootprintGeos = Array.from(impGeofootprintGeos);
//      this.selectedImpGeofootprintGeos = impGeofootprintGeos.filter(geo => geo.isActive);
//      this.assignSite();

      //console.log('onChangeGeos fired - #Geos: ', impGeofootprintGeos.length, ', Selected: ', this.selectedImpGeofootprintGeos.length);
   //   this.assignExtra();
   }

   /**
    * Assigns the local cache of locations from the subscription.
    * Since a new site may have been added, assign the geos to the closest
    * site again.
    *
    * @param impGeofootprintLocation The array of locations received from the observable
    */
   onChangeLocation(impGeofootprintLocation: ImpGeofootprintLocation[])
   {
//    console.log('----------------------------------------------------------------------------------------');
//    console.log('onChangeLocation - Before: ', this.impGeofootprintLocations);
      this.impGeofootprintLocations = Array.from(impGeofootprintLocation);
      this.geoGridCache.clear();
//    console.log('onChangeLocation - After:  ', this.impGeofootprintLocations);
//    console.log('----------------------------------------------------------------------------------------');
//      this.assignSite();
   }

   private onChangeGeoAttributes(geoAttributes: ImpGeofootprintGeoAttrib[]) : void
   {
    //console.log('----------------------------------------------------------------------------------------');
    //console.log('onChangeGeoAttributes - Before: ', this.impGeofootprintGeoAttributes);
      this.impGeofootprintGeoAttributes = Array.from(geoAttributes);
      this.geoGridCache.clear();
//      this.assignExtra();
//    console.log('onChangeGeoAttributes - After:  ', this.impGeofootprintGeoAttributes);

         // Debug log attributes
         // this.impGeofootprintGeoAttributes.forEach(attribute => {
         //    console.log("attribute: ", attribute);
         // });

    //console.log('----------------------------------------------------------------------------------------');
   }

   private onChangeGeoVars(geoVars: ImpGeofootprintVar[]) : void {
      this.impGeofootprintVars = Array.from(geoVars);
      this.geoGridCache.clear();

      // Calculate distinct list of var pks
      // this.impGeofootprintVars.forEach(geoVar => {
      //    if (!this.varPks.find(v => v === geoVar.varPk))
      //       this.varPks.push(geoVar.varPk);
      // });

//      if (geoVars.length > 0)
//         this.assignExtra();
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
   public getGeoTooltip(flatGeo: FlatGeo)
   {
      //console.log('getGeoTooltip: flatGeo: ', flatGeo.geo.geocode, ', filterReasons: ', flatGeo['filterReasons'], ', geo.filterReasons: ', flatGeo.geo['filterReasons']);      if (flatGeo.geo.isActive === false && flatGeo.geo['filterReasons'] == null)
     if (flatGeo.geo.isActive === false && flatGeo.geo['filterReasons'] == null)
       return 'Filtered manually';

    if (flatGeo.geo.isActive === true && flatGeo.geo['filterReasons'] != null && flatGeo.geo['filterReasons'].length > 0)
         return '*** Manual Override ***\n' + flatGeo.geo['filterReasons'];

      return flatGeo.geo['filterReasons'];
   }
   /**
    * The geo passed in will be compared to the list of locations
    * and the closest will be recorded on the geo as well as the distance.
    */
   // TODO: changed to selectedImpGeofootprintLocations - currently locations are not getting initially added to the selected list. (They should)
   setClosestLocation(geo: ImpGeofootprintGeo, index: number)
   {
      if (this.impGeofootprintLocations == null)
      {
         console.log('setClosestLocation exiting; no sites', this.impGeofootprintLocations);
         return;
      }

      if (geo == null)
      {
         console.log('setClosestLocation exiting; provided geo was null');
         return;
      }

      // TODO: This really needs to be from selectedImpGeofootprintLocations
      if (this.impGeofootprintLocations != null)
      {
         let closestSiteIdx: number = -1;
         const closestCoord: number[] = [];
         let closestDistance: number = 99999999;
         let dist = closestDistance;

         // Comparing each site to the geo parameter
         for (let s = 0; s < this.impGeofootprintLocations.length; s++)
         {
            dist = EsriUtils.getDistance(geo.xcoord, geo.ycoord, this.impGeofootprintLocations[s].xcoord, this.impGeofootprintLocations[s].ycoord);

            if (geo.geocode === '48168')
               console.log('GEOCODE: ', geo.geocode, ' distance to site[' + s + '] = ', dist);

            // If closer to this location, record the lat / lon
            if (dist < closestDistance)
            {
               if (geo.geocode === '48168')
                  console.log('GEOCODE: 48168 - setting new closest distance @ ', dist);
               closestDistance = dist;
               closestSiteIdx = s;
//             console.log('Compared ', geo.geocode, 'against sitesLayer.items[' + s + ']', this.impGeofootprintLocations[s], ', Distance: ' + dist + ' - NEW CLOSEST');
            }
//          else
//             console.log('Compared ', geo.geocode, 'against sitesLayer.items[' + s + ']', this.impGeofootprintLocations[s], ', Distance: ' + dist);
         }

         geo.distance = closestDistance;
         geo.impGeofootprintLocation =  this.impGeofootprintLocations[closestSiteIdx];
      }
   }

   /**
    * Each geo in the list is assigned the closest site returned by
    * the method getClosestSite.
    * This happens automatically in the onChangeGeos subscription callback method.
    */
   assignGeoSite(impGeofootprintGeos: ImpGeofootprintGeo[])
   {
      let idx: number = 0;
      if (impGeofootprintGeos != null)
      {
         const unassignedGeos = impGeofootprintGeos.filter(geo => geo.impGeofootprintLocation == null);
         if (unassignedGeos.length > 0)
         {
            console.log('assignSite fired - processing ' + unassignedGeos.length + ' geos');
            for (const geo of unassignedGeos)
               this.setClosestLocation(geo, idx++);
         }
         else
            console.log('assignSite - no geos to process');
      }
   }

   createComposite(project: ImpProject, geos: ImpGeofootprintGeo[], geoAttributes: ImpGeofootprintGeoAttrib[], vars: ImpGeofootprintVar[]) : FlatGeo[]
   {
      const UnselGeoCount: number = geos.filter(geo => geo.isActive === false).length;
      console.log('createComposite: geos: ', (geos != null) ? geos.length : null, ', Unselected Geos', UnselGeoCount, ', attributes: ', (geoAttributes != null) ? geoAttributes.length : null, ', vars: ', (vars != null) ? vars.length : null);

      let fgId = 0;
      const geoGridData: FlatGeo[] = [];
      this.flatGeoGridExtraColumns = [];

      const  attributeMap = new Map<string, ImpGeofootprintGeoAttrib[]>();
      geoAttributes.forEach(attribute => {if (attribute.attributeCode === 'pob'
                                          ||  attribute.attributeCode === 'owner_group_primary'
                                          ||  attribute.attributeCode === 'cov_frequency'
                                          ||  attribute.attributeCode === 'cov_desc'
                                          ||  attribute.attributeCode === 'dma_name'
                                          ||  attribute.attributeCode === 'city_name')
                                             // There has got to be a prettier way than this
                                             if (attributeMap[attribute.impGeofootprintGeo.geocode] == null)
                                             {
                                                attributeMap[attribute.impGeofootprintGeo.geocode] = [];
                                                attributeMap[attribute.impGeofootprintGeo.geocode].push(attribute);
                                             }
                                             else
                                                attributeMap[attribute.impGeofootprintGeo.geocode].push(attribute);
                                         });

      // Rank the geos by distance
      this.impGeofootprintGeoService.calculateGeoRanks();

      // Sort the geos
      this.impGeofootprintGeoService.sort(this.impGeofootprintGeoService.defaultSort);

//      geos.filter(geo => geo.isDeduped === 1 || this.dedupeGrid === false).forEach(geo => {
      geos.forEach(geo => {
         const gridGeo: FlatGeo = new Object() as FlatGeo; // any = new Object();
         gridGeo.geo = geo;
         gridGeo.fgId = fgId++;

         if (gridGeo.geo.impGeofootprintLocation.locZip != null)
         gridGeo.geo.impGeofootprintLocation.locZip= gridGeo.geo.impGeofootprintLocation.locZip.slice(0, 5) ;
          else
           ' ';

         // Assign all variable properties to the geo
//       vars.forEach(v => gridGeo[v] = null);

         // Get all of the attributes for the geo
/*good         const attributes = geoAttributes.filter(attribute => (attribute.attributeCode === 'pob'
                                                           ||  attribute.attributeCode === 'owner_group_primary'
                                                           ||  attribute.attributeCode === 'cov_frequency'
                                                           ||  attribute.attributeCode === 'cov_desc'
                                                           ||  attribute.attributeCode === 'dma_name')
                                                           &&  attribute.impGeofootprintGeo.geocode === geo.geocode);*/

         // Add attributes the grid is interested in and massage them where needed
//       attributes.forEach(attribute => {
        // let attribs: ImpGeofootprintGeoAttrib[] = attributeMap[geo.geocode];
         if (attributeMap[geo.geocode] != null)
         {
            attributeMap[geo.geocode].forEach(attribute => {
               if (attribute.attributeCode === 'pob')
               gridGeo['pob'] = (attribute.attributeValue === 'B') ? 'Y' : 'N';

               if (attribute.attributeCode === 'city_name' && attribute.attributeValue != null)
                  gridGeo['city_name'] = attribute.attributeValue.substring(0,1).toUpperCase() + attribute.attributeValue.substring(1, attribute.attributeValue.length-3).toLowerCase() + ' ' + attribute.attributeValue.substring(attribute.attributeValue.length-2);

               if (attribute.attributeCode === 'owner_group_primary')
               {
                  //  console.log('this.impDiscoveryUI.selectCpmType = ' + this.impDiscoveryUI.selectCpmType);
                  //  console.log('this.impDiscoveryUI.isCpmBlended  = ' + this.impDiscoveryUI.isCpmBlended);
                  //  console.log('this.impDiscoveryUI.cpm           = ' + this.impDiscoveryUI.cpm);
                  //  console.log('this.impDiscoveryUI.valassisCPM   = ' + this.impDiscoveryUI.valassisCPM);
                  //  console.log('this.impDiscoveryUI.anneCPM       = ' + this.impDiscoveryUI.anneCPM);
                  //  console.log('this.impDiscoveryUI.soloCPM       = ' + this.impDiscoveryUI.soloCPM);
                  //  console.log('attribute.attributeValue          = ' + attribute.attributeValue);
                  //  console.log(gridGeo.geo.geocode + ", isActive: ", gridGeo.geo.isActive, ', filterReasons: ', gridGeo.geo['filterReasons']);

                  gridGeo['ownergroup'] = attribute.attributeValue;
                  if (project.estimatedBlendedCpm != null)
                     gridGeo['cpm'] = project.estimatedBlendedCpm;
                  else
                     switch (attribute.attributeValue)
                     {
                        case 'VALASSIS':
                           //console.log('Assigning VALASSIS CPM - ' + discovery[0].valassisCPM);
                           gridGeo['cpm'] = project.smValassisCpm;
                           break;

                        case 'ANNE':
                           //console.log('Assigning ANNE CPM - ' + discovery[0].anneCPM);
                           gridGeo['cpm'] = project.smAnneCpm;
                           break;

                        default:
                           //console.log('Assigning SOLO CPM - ' + discovery[0].soloCPM);
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
         
         // Get all of the variables for this geo
          const usableVars = new Set(this.impProjectVarService.get()
                               .filter(pv => pv.isIncludedInGeoGrid)
                               .map(pv => pv.fieldname));
          const geovars = this.impGeofootprintVarService.get().filter(gv => usableVars.has(gv.customVarExprDisplay));
          const varCache = groupBy(geovars, 'geocode');
          (geovars || []).forEach(geovar => {
            if (geovar.isString)
               gridGeo[geovar.varPk.toString()] = geovar.valueString;
            else
            {
               // Format them
               switch (geovar.fieldconte) {
                  case 'COUNT':
                  case 'MEDIAN':
                  case 'INDEX':
                     gridGeo[geovar.varPk.toString()] = Math.round(geovar.valueNumber); // .toFixed(14);
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
            // console.log("geovar.name: " + geovar.fieldname + ", fieldconte: " + geovar.fieldconte + ", geovar: ", geovar);

            // Create grid columns for the variables
            if (!this.flatGeoGridExtraColumns.find(f => f.label === geovar.varPk.toString()))
            {
               //console.log("---------------------------------------------------------------------------------------");
               const colWidth: number = Math.max(80, (geovar.customVarExprDisplay.length * 8));
               const colStyleClass: string = (geovar.isNumber) ? 'val-text-right' : '';
               //console.log("this.flatGeoGridExtraColumns adding ", geovar.varPk + ", colWidth: " + colWidth + 'px, styleClass: ' + colStyleClass + ", isNumbeR: " + geovar.isNumber);
               this.flatGeoGridExtraColumns.push({label: geovar.varPk.toString(), value: {field: geovar.varPk.toString(), header: geovar.customVarExprDisplay, width: colWidth + 'px', styleClass: colStyleClass}});
               //console.log("---------------------------------------------------------------------------------------");
            }
         });

         geoGridData.push(gridGeo);
      });

      //console.log("createComposite - returning geoGridData: ", geoGridData);
      return geoGridData;
   }

   // Add additional data to the geo array
   /*
   assignExtra()
   {
      console.log('assignExtra fired - Hawkman - ' + this.impGeofootprintGeos.length + ' geos');
      console.log('  this.impGeofootprintGeoAttributes: ', this.impGeofootprintGeoAttributes);

      this.flatGeoGridExtraColumns = [];
      this.geoGridData = [];
      this.impGeofootprintGeos.forEach(geo => {
         let gridGeo: any = new Object();
         gridGeo.geo = geo;

         // Assign all variable properties to the geo
         this.varPks.forEach(v => gridGeo[v] = null);

         const attributes = this.impGeofootprintGeoAttributes.filter(attribute => (attribute.attributeCode === 'pob'
                                                                               ||  attribute.attributeCode === 'owner_group_primary'
                                                                               ||  attribute.attributeCode === 'cov_frequency'
                                                                               ||  attribute.attributeCode === 'cov_desc'
                                                                               ||  attribute.attributeCode === 'dma_name')
                                                                               &&  attribute.impGeofootprintGeo.geocode === geo.geocode);

         attributes.forEach(attribute => {
            if (attribute.attributeCode === 'pob')
               gridGeo['pob'] = (attribute.attributeValue === 'B') ? 'Y' : 'N';

            if (attribute.attributeCode === 'owner_group_primary')
               gridGeo['ownergroup'] = attribute.attributeValue;

            if (attribute.attributeCode === 'cov_frequency')
               gridGeo['coveragefrequency'] = attribute.attributeValue;

            if (attribute.attributeCode === 'cov_desc')
               gridGeo['coveragedescription'] = attribute.attributeValue;

            if (attribute.attributeCode === 'dma_name')
               gridGeo['dma'] = attribute.attributeValue;

            // console.log("attribute: " + attribute.attributeCode + " = " + attribute.attributeValue + ", type: " + attribute.attributeType);
//               {label: 'investment',           value: {field: 'investment',                                         header: 'Investment',           width: '5%', styleClass: 'val-text-right'}},
         });

//       if (!this.flatGeoGridExtraColumns.find(f => f.label === "Hawkman!!!"))
//          this.flatGeoGridExtraColumns.push({label: 'Hawkman!!!', value: {field: 'Hawkman', header: 'Hawkman!', width: '120px', styleClass: ''}});

         //   CPM
         //   Investment  ($ 999.99)

//         gridGeo['Hawkman'] = 42;

         const geovars = this.impGeofootprintVars.filter(geovar => geovar.geocode === geo.geocode);
         (geovars||[]).forEach(geovar => {

            switch(geovar.fieldconte) {
               case "COUNT":
               case "MEDIAN":
               case "INDEX":
                  gridGeo[geovar.varPk.toString()] = Math.round(geovar.valueNumber); // .toFixed(14);
                  break;

               case "PERCENT":
               case "RATIO":
                  gridGeo[geovar.varPk.toString()] = geovar.valueNumber.toFixed(2);
                  break;

               default:
               gridGeo[geovar.varPk.toString()] = geovar.valueNumber.toFixed(14);
                  break;
            };
            // console.log("geovar.name: " + geovar.fieldname + ", fieldconte: " + geovar.fieldconte + ", geovar: ", geovar);
            if (!this.flatGeoGridExtraColumns.find(f => f.label === geovar.varPk.toString()))
            {
               console.log("---------------------------------------------------------------------------------------");
               let colWidth: number = Math.max(80, (geovar.customVarExprDisplay.length * 8));
               let colStyleClass: string = (geovar.isNumber) ? 'val-text-right' : '';
               console.log("this.flatGeoGridExtraColumns adding ", geovar.varPk + ", colWidth: " + colWidth + 'px, styleClass: ' + colStyleClass + ", isNumbeR: " + geovar.isNumber);
               this.flatGeoGridExtraColumns.push({label: geovar.varPk.toString(), value: {field: geovar.varPk.toString(), header: geovar.customVarExprDisplay, width: colWidth+'px', styleClass: colStyleClass}});
               console.log("---------------------------------------------------------------------------------------");
            }
         });

         this.geoGridData.push(gridGeo);
      });

      console.log('flatGeoGridExtraColumns: ', this.flatGeoGridExtraColumns);
      console.log('this.geoGridData: ', this.geoGridData);
   }
*/

   /**
    * Returns a sub-set of the ImpGeofootprintGeos belonging to the
    * provided parent location, via glId.
    *
    * @param location The parent location to filter on
    */
/*
   filterGeosBySite(location: ImpGeofootprintLocation) : any[]
   {
     if (!this.geoGridCache.has(location)) {
       const geos = this.impGeofootprintGeos.filter(geo => geo.impGeofootprintLocation === location);
       const geoSet = new Set(geos.map(g => g.geocode));
       const attributes = this.impGeofootprintGeoAttributes.filter(attribute => attribute.attributeType === 'Geofootprint Variable' && geoSet.has(attribute.impGeofootprintGeo.geocode));
       const vars = this.impGeofootprintVars.filter(gv => geoSet.has(gv.geocode));
       const result = geos.map(geo => Object.assign({}, geo));
       const attributeSet = new Set(this.geoGridAdditionalColumns);
       result.forEach(geo => {
         const currentAttrs = attributes.filter(att => att.impGeofootprintGeo.geocode === geo.geocode);
         if (currentAttrs.length > 0) {
           currentAttrs.forEach(att => {
             geo[att.attributeCode] = att.attributeValue;
             if (!attributeSet.has(att.attributeCode)) {
               this.geoGridAdditionalColumns.push(att.attributeCode);
               attributeSet.add(att.attributeCode);
             }
           });
         }
         const currentVars = vars.filter(v => v.geocode === geo.geocode);
         if (currentVars.length > 0) {
           currentVars.forEach(gv => {
             geo[gv.customVarExprDisplay] = gv.isNumber ? gv.valueNumber : gv.valueString;
             if (!attributeSet.has(gv.customVarExprDisplay)) {
               this.geoGridAdditionalColumns.push(gv.customVarExprDisplay);
               attributeSet.add(gv.customVarExprDisplay);
             }
           });
         }
       });
       this.geoGridCache.set(location, result);
     }
     return this.geoGridCache.get(location);
   }

   compare(compareTo: ImpGeofootprintGeo) : boolean
   {
      console.log('comparing to: ', compareTo);
      return true;
   }*/


   testFind() {
      console.log('--------------------------------------------------');
      console.log('testFind');
      console.log('--------------------------------------------------');
//      const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.impGeofootprintLocation.glId === 1)];
//const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.geocode === '48375C1')];
      const storeGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.get();
      console.log ('Working with geos: ', storeGeos);
//      let  foundGeo = this.impGeofootprintGeoService.find(storeGeos[10]);
//      console.log('foundGeo', foundGeo);

      console.log('');
      console.log('Looking for geo: 48080');
      let searchGeo = new ImpGeofootprintGeo({geocode: '48080'});
      let foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      console.log('foundGeo', foundGeo);

      // console.log('');
      // console.log('Looking for geos that belong to Grand Rapids');
      // let searchGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo({isActive: 0; impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'BUDDY\'S PIZZA - GRAND RAPIDS'})});
      // let foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      // console.log('foundGeo', foundGeo);

      console.log('');
      console.log('Looking for geos for location: BUDDY\'S PIZZA - GRAND RAPIDS');
      searchGeo = new ImpGeofootprintGeo({impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'BUDDY\'S PIZZA - GRAND RAPIDS'})});
      const foundGeos: ImpGeofootprintGeo[] = [this.impGeofootprintGeoService.find(searchGeo)];
      console.log('foundGeos', foundGeos);

      console.log('');
      const site: ImpGeofootprintLocation = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation', null);
      console.log ('site: ', site);

      console.log('');
      const siteName: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName', null);
      console.log ('siteName: ', siteName);

      console.log('');
      console.log ('Test returning a default value when search is not found');
      const testDefault: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName.cocopuffs', 'A default Value');
      console.log ('defaulted: ', testDefault);

      console.log('');
      console.log('Test getting a list of objects by a relationship property');
      const getByGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS');
      console.log ('findBy: ', getByGeos);

      console.log('');
      console.log('Test getting a list of objects by a relationship property using a comparator');
      //const getByGeosC: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS', this.compare);
      console.log ('findBy: ', getByGeos);

      let foundIdx = -1;
      for (let i = 0; i < storeGeos.length; i++)
      {
         foundIdx = this.impGeofootprintGeoService.findIndex(storeGeos[i]);
         console.log('found geo(' + i + ') at index', foundIdx);
      }
   }

   testRank()
   {
      console.log('--------------------------------------------------');
      console.log('testRank');
      console.log('--------------------------------------------------');
      this.impGeofootprintGeoService.assignGeocodeRank();
   }

   testRemove()
   {
      console.log('--------------------------------------------------');
      console.log('testRemove - Database Removes');
      console.log('--------------------------------------------------');
      
//      this.impProjectService.removeGeosFromHierarchy(this.impGeofootprintGeoService.get().filter(geo => [220258, 220264, 220265].includes(geo.ggId)));
/*      
      console.log('--# TEST FILTERBY')
      let aLocation: ImpGeofootprintLocation = this.impGeofootprintLocationService.get().filter(location => location.glId = 17193)[0];
      
      console.log("A) TAs for glid: " + aLocation.glId, this.impGeofootprintTradeAreaService.filterByGlId(aLocation.glId, true));
      console.log("B) TAs for projectid: " + aLocation.projectId, this.impGeofootprintTradeAreaService.filterByProjectId(aLocation.projectId, true));
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 3 geos");
      console.log("--------------------------------------------");
      // Stage Geos removal
      let ggIds: number[] = [217729, 217730, 217731];

      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",geoRemoves.length,"Geos");

      this.impGeofootprintGeoService.performDBRemoves(geoRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintGeoService.dbRemoves.filter(geo => removesLeft += (ggIds.includes(geo.ggId)) ? 1:0);
         this.impGeofootprintGeoService.get().filter    (geo => inStore     += (ggIds.includes(geo.ggId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 2 Trade Areas");
      console.log("--------------------------------------------");
      // Stage a trade area removal
      let gtaIds: number[] = [37369, 37370];
      let taRemoves: ImpGeofootprintTradeArea[] = [];
      gtaIds.forEach(gtaId => {
         this.impGeofootprintTradeAreaService.remove(this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => ta.gtaId === gtaId).forEach(ta => taRemoves.push(ta));
      });

      this.impGeofootprintTradeAreaService.performDBRemoves(taRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => removesLeft += (gtaIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta => inStore     += (gtaIds.includes(ta.gtaId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });
*/
/*
      console.log("--------------------------------------------");
      console.log("Remove 2 Locations");
      console.log("--------------------------------------------");
      // Stage locations removal
      let glIds: number[] = [17194, 17196];
      let locRemoves: ImpGeofootprintLocation[] = [];
      glIds.forEach(glId => {
         this.impGeofootprintLocationService.remove(this.impGeofootprintLocationService.get().filter(loc => loc.glId === glId));
         this.impGeofootprintLocationService.dbRemoves.filter(loc => loc.glId === glId).forEach(loc => locRemoves.push(loc));
      });
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",locRemoves.length,"locations");

      this.impGeofootprintLocationService.performDBRemoves(locRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");

         let locRemovesLeft: number = 0;
         let locInStore:     number = 0;
         let taRemovesLeft:  number = 0;
         let taInStore:      number = 0;  
         this.impGeofootprintLocationService.dbRemoves.filter (loc => locRemovesLeft += (glIds.includes(loc.glId)) ? 1:0);
         this.impGeofootprintLocationService.get().filter     (loc => locInStore     += (glIds.includes(loc.glId)) ? 1:0);
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta  => taRemovesLeft  += (glIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta  => taInStore      += (glIds.includes(ta.gtaId)) ? 1:0);

         console.log("loc db removes: ", locRemovesLeft);
         console.log("loc data store: ", locInStore);
         console.log("ta  db removes: ", taRemovesLeft);
         console.log("ta  data store: ", taInStore);
      });
*/
/*
      // Stage a master removal
      let cgmId: number = 2859;
      this.impGeofootprintMasterService.remove(this.impGeofootprintMasterService.get().filter(ma => ma.cgmId === cgmId));
      let masterRemoves: ImpGeofootprintMaster[] = this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.cgmId === cgmId)
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ", masterRemoves.length,"Geofootprint Master");

      this.impGeofootprintMasterService.performDBRemoves(masterRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Master db removes: ", this.impGeofootprintMasterService.dbRemoves.filter(ma => ma.cgmId === cgmId));
         console.log("Master data store: ", this.impGeofootprintMasterService.get().filter(ma => ma.cgmId === cgmId));
         console.log("Loc    db removes: ", this.impGeofootprintLocationService.dbRemoves.filter(loc => loc.cgmId === cgmId));
         console.log("Loc    data store: ", this.impGeofootprintLocationService.get().filter(loc => loc.cgmId === cgmId));         
      });
*/
/*
      // Stage a project removal
      let projectId: number = 3033;
      
      this.impProjectService.remove(this.impProjectService.get().filter(project => project.projectId === projectId));
      let projectRemoves: ImpProject[] = this.impProjectService.dbRemoves.filter(project => project.projectId === projectId)

      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",projectRemoves.length,"Project");

      this.impProjectService.performDBRemoves(projectRemoves).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Project db removes: ", this.impProjectService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Project data store: ", this.impProjectService.get().filter(project => project.projectId === projectId));
         console.log("Pref    db removes: ", this.impProjectPrefService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Pref    data store: ", this.impProjectPrefService.get().filter(project => project.projectId === projectId));
      });
*/

// AND NOW FOR THE WEIRD STUFF

      // Test staging geo removes and calling performDBRemoves on project
      // Stage Geos removal
      let ggIds: number[] = [220264, 220265];

      console.log("BEFORE project total removes: ", this.impProjectService.getTreeRemoveCount(this.impProjectService.get()));

      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });
     
      console.log("AFTER project total removes: ", this.impProjectService.getTreeRemoveCount(this.impProjectService.get()));
      
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",geoRemoves.length,"locations");

      this.impProjectService.performDBRemoves([this.impProjectService.get()[0]]).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintGeoService.dbRemoves.filter(geo => removesLeft += (ggIds.includes(geo.ggId)) ? 1:0);
         this.impGeofootprintGeoService.get().filter    (geo => inStore     += (ggIds.includes(geo.ggId)) ? 1:0);
         
         console.log("geo db removes: ", removesLeft);
         console.log("geo data store: ", inStore);
         console.log("--------------------------------------------");
      });

/*
      console.log('Remove geos, but not the TA & specifically remove some TAs');
      console.log('----------------------------------------------------------');

      // Stage some geos not in a TA that is being removed
      let ggIds: number[] = [217774, 217775];
      let geoRemoves: ImpGeofootprintGeo[] = [];
      ggIds.forEach(ggId => {
         this.impGeofootprintGeoService.remove(this.impGeofootprintGeoService.get().filter(geo => geo.ggId === ggId));
         this.impGeofootprintGeoService.dbRemoves.filter(geo => geo.ggId === ggId).forEach(geo => geoRemoves.push(geo));
      });

      // Stage trade area removals
      let gtaIds: number[] = [37375, 37376];
      let taRemoves: ImpGeofootprintTradeArea[] = [];
      gtaIds.forEach(gtaId => {
         this.impGeofootprintTradeAreaService.remove(this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
      });
      // Pickup any trade areas that have deletes
      taRemoves = this.impGeofootprintTradeAreaService.filterBy ((ta, b) => ta.gtaId === b, (ta) => this.impGeofootprintTradeAreaService.getTreeRemoveCount(ta), false, true, true);

      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",taRemoves.length,"trade areas");
      console.log("staged: ",geoRemoves.length,"geos");

      this.impGeofootprintTradeAreaService.performDBRemoves(taRemoves).subscribe(responseCode => {
         console.log("geofootprint-geo-list received responseCode: ", responseCode);
         console.log("If below are still here, we need to remove them from datastore");
         let removesLeft: number = 0;
         let inStore: number = 0;
         this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => removesLeft += (gtaIds.includes(ta.gtaId)) ? 1:0);
         this.impGeofootprintTradeAreaService.get().filter    (ta => inStore     += (gtaIds.includes(ta.gtaId)) ? 1:0);
         
         console.log("ta db removes: ", removesLeft);
         console.log("ta data store: ", inStore);
//       console.log("ta db removes: ", this.impGeofootprintTradeAreaService.dbRemoves.filter(ta => ta.gtaId === gtaId));
//       console.log("ta data store: ", this.impGeofootprintTradeAreaService.get().filter(ta => ta.gtaId === gtaId));
         console.log("--------------------------------------------");
      });
*/
/*
      // Stage a project with children to remove (Nothing should happen)
      let projectId: number = 3033;
      let removes: ImpProject[] = this.impProjectService.get().filter(project => project.projectId === projectId)
      console.log("Staging Done");
      console.log("--------------------------------------------");
      console.log("staged: ",removes.length,"Project");

      this.impProjectService.performDBRemoves(removes).subscribe(responseCode => {
         console.log("responseCode: ", responseCode);
         console.log("If below are still here, delete didn't work");
         console.log("Project db removes: ", this.impProjectService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Project data store: ", this.impProjectService.get().filter(project => project.projectId === projectId));
         console.log("Pref    db removes: ", this.impProjectPrefService.dbRemoves.filter(project => project.projectId === projectId));
         console.log("Pref    data store: ", this.impProjectPrefService.get().filter(project => project.projectId === projectId));
      });
*/
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

   onRowClick(event: any)
   {
      console.log('Click');
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
         //this.impGeofootprintGeoService.update(null, null);
         this.impGeofootprintGeoService.makeDirty();

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
   }

   onSelectAllGeocodes(event: any)
   {
      console.log("All Geos isActive set to: ", event.checked);
      //this.impGeofootprintGeoService.setActive(this.impGeofootprintGeoService.get(), event.checked);
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

   testDeleteProject()
   {
      this.impProjectService.postDelete(this.impProjectService.get()[0].projectId).subscribe(restResponse => {
         console.log ("testDeleteProject - response: ", restResponse);
      });
   }
}
