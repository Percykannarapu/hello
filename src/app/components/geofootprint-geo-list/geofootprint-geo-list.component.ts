import { MapService } from './../../services/map.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, ISubscription } from 'rxjs/Subscription';

// Import UI Components
import { SelectItem } from 'primeng/components/common/selectitem';

// Import Custom Models
import { AppState } from '../../app.state';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';

// Import Data Services
import { ImpGeofootprintLocationService } from './../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from './../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Console } from '@angular/core/src/console';
import { AppConfig } from '../../app.config';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private siteSubscription: ISubscription;
   private geosSubscription: ISubscription;
   private attributeSubscription: ISubscription;

   public  impGeofootprintLocations: ImpGeofootprintLocation[];
   public  selectedImpGeofootprintLocations: ImpGeofootprintLocation[];

   public  impGeofootprintGeos: ImpGeofootprintGeo[];
   public  selectedImpGeofootprintGeos: ImpGeofootprintGeo[];

   public impGeofootprintGeoAttributes: ImpGeofootprintGeoAttrib[];


  public myStyles = {
      'background-color': 'lime',
      'text-align': 'right'
      };

   public rAlign = 'right';

   public  locGridColumns: SelectItem[] = [{label: 'locationName', value: {field: 'locationName', header: 'Location',     width: '30%', style: '{\'width\':\'60%\'}'}},
                                           {label: 'homeGeocode',  value: {field: 'homeGeocode',  header: 'Home Geocode', width: '20%', style: '{\'width\':\'20%\'}'}},
                                           {label: 'ycoord',       value: {field: 'ycoord',       header: 'Lat',          width: '15%', style: '{\'width\':\'10%\'}'}},
                                           {label: 'xcoord',       value: {field: 'xcoord',       header: 'Long',         width: '15%', style: '{\'width\':\'10%\'}'}},
                                          ];

    public  geoGridColumns: SelectItem[] = [/*{label: 'ggId',     value: {field: 'ggId',     header: 'ggId', width: '5%', styleClass: ''}, styleClass: ''},*/
                                           /*{label: 'controls', value: {field: 'controls', header: '', width: '5%', styleClass: ''}, styleClass: ''},*/
                                           /*{label: 'site',     value: {field: 'impGeofootprintLocation.locationName', header: 'Site', width: '29%', styleClass: ''}},*/
                                           {label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  width: '30%', styleClass: ''}},
                                           {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      width: '20%', styleClass: 'val-text-right'}},
                                           {label: 'distance', value: {field: 'distance', header: 'Distance', width: '20%', styleClass: 'val-text-right'}}
                                          ];

   // public  geoGridColumns: SelectItem[] = [{label: 'site',     value: {field: 'impGeofootprintLocation.locationName', header: 'Site', width: '60%', style: '{\'width\':\'60%\'}'}, styleClass: ''},
   //                                         {label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  width: '25%', style: '{\'width\':\'25%\'}'}, styleClass: ''},
   //                                         {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      width: '5%', style: '{\'width\':\'5%\'}'}, styleClass: ''},
   //                                         {label: 'distance', value: {field: 'distance', header: 'Distance', width: '5%', style: '{\'width\':\'5%\'}'}, styleClass: ''}
   //                                        ];

   public  selectAllGeos: boolean;

   public geoGridAdditionalColumns: string[] = [];
   public geoGridCache: Map<ImpGeofootprintLocation, any[]> = new Map();

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public  config: AppConfig,
               private impGeofootprintGeoService: ImpGeofootprintGeoService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService,
               public  mapService: MapService,
               private appState: AppState) { }

   ngOnInit()
   {
      // Subscribe to the sites data store
      this.siteSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(storeData => this.onChangeLocation(storeData));

      // Subscribe to the geos data store
      this.geosSubscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.onChangeGeos(storeData));

      this.attributeSubscription = this.impGeofootprintGeoAttribService.storeObservable.subscribe(storeData => this.onChangeGeoAttributes(storeData));

      // For now, sub out some data
      //this.stubLocations();
      //this.stubGeos();

      //console.log('filtered geos: ', this.filterGeosBySite(202193));
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
      console.log('onChangeGeos fired', impGeofootprintGeos);
      this.impGeofootprintGeos = Array.from(impGeofootprintGeos);
      this.assignSite();
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
      // const ary: number[];
      // console.log('Ternary in log with braces: '    + ((ary) ? 'Ternary (with braces) think it has entries' : 'Ternary (with braces) thinks its null'));
      // console.log('Ternary in log without braces: ' +  (ary) ? 'Ternary (without braces) think it has entries' : 'Ternary (without braces) thinks its null');

      console.log('----------------------------------------------------------------------------------------');
      console.log('onChangeLocation - Before: ', this.impGeofootprintLocations);
      this.impGeofootprintLocations = Array.from(impGeofootprintLocation);
      this.geoGridCache.clear();
      console.log('onChangeLocation - After:  ', this.impGeofootprintLocations);
      console.log('----------------------------------------------------------------------------------------');
      this.assignSite();
   }

   private onChangeGeoAttributes(geoAttributes: ImpGeofootprintGeoAttrib[]) : void
   {
      console.log('----------------------------------------------------------------------------------------');
      console.log('onChangeGeoAttributes - Before: ', this.impGeofootprintGeoAttributes);
      this.impGeofootprintGeoAttributes = Array.from(geoAttributes);
      this.geoGridCache.clear();
      console.log('onChangeGeoAttributes - After:  ', this.impGeofootprintGeoAttributes);
      console.log('----------------------------------------------------------------------------------------');
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
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
            dist = this.mapService.getDistanceBetween(geo.xCoord, geo.yCoord, this.impGeofootprintLocations[s].xcoord, this.impGeofootprintLocations[s].ycoord);

            // If closer to this location, record the lat / lon
            if (dist < closestDistance)
            {
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
   assignSite()
   {
      let idx: number = 0;
      if (this.impGeofootprintGeos != null)
      {
         const unassignedGeos = this.impGeofootprintGeos.filter(geo => geo.impGeofootprintLocation == null);
         console.log('assignSite fired - processing ' + unassignedGeos.length + ' geos');
          for (const geo of unassignedGeos)
             this.setClosestLocation(geo, idx++);
      }
      else
         console.log('assignSite - no geos to process');
   }

   /**
    * Returns a sub-set of the ImpGeofootprintGeos belonging to the
    * provided parent location, via glId.
    *
    * @param location The parent location to filter on
    */
   filterGeosBySite(location: ImpGeofootprintLocation) : any[]
   {
     if (!this.geoGridCache.has(location)) {
       const geos = this.impGeofootprintGeos.filter(geo => geo.impGeofootprintLocation === location);
       const geoSet = new Set(geos);
       const attributes = this.impGeofootprintGeoAttributes.filter(attribute => attribute.attributeType === 'Geofootprint Variable' && geoSet.has(attribute.impGeofootprintGeo));
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
       });
       this.geoGridCache.set(location, result);
     }
     return this.geoGridCache.get(location);
   }

   compare(compareTo: ImpGeofootprintGeo) : boolean
   {
      console.log('comparing to: ', compareTo);
      return true;
   }


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
      let searchGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo({geocode: '48080'});
      const foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      console.log('foundGeo', foundGeo);

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
      const getByGeosC: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'BUDDY\'S PIZZA - GRAND RAPIDS', this.compare);
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

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
   public async onZoomToGeo(geo: ImpGeofootprintGeo)
   {
      // console.log('onZoomToGeo - geo: ', geo);
      if (geo != null)
      {
         const color = {a: 1, r: 35, g: 93, b: 186}; // Because the darn map service requires it
         await this.mapService.createGraphic(geo.yCoord, geo.xCoord, color, null).then(graphic => {
            this.mapService.zoomOnMap([graphic]);
         });
      }
   }

   toggleGeocode(geo: ImpGeofootprintGeo)
   {
      console.log('toggling geocode');
      console.log(geo);
      if (this.selectedImpGeofootprintGeos != null)
         console.log('Selected: ' + this.selectedImpGeofootprintGeos.length + ',  Total: ' + this.impGeofootprintGeos.length);
      else
         console.log('toggleGeocode: No geocodes selected');
   }

   // -----------------------------------------------------------
   // DEBUG METHODS
   // -----------------------------------------------------------
   private stubLocations()
   {
      const sites: ImpGeofootprintLocation[] =
          [new ImpGeofootprintLocation({glId: 202193, locationName: 'Masons',           xcoord: -83.37270100, ycoord: 42.38179900}),
           new ImpGeofootprintLocation({glId: 202194, locationName: 'The Looney Baker', xcoord: -83.373658,   ycoord: 42.383524})];

      this.impGeofootprintLocationService.add(sites);
   }

   public addAnotherLocation()
   {
      this.impGeofootprintLocationService.add([new ImpGeofootprintLocation({glId: 202195, locationName: 'Potbelly Livonia', xcoord: -83.33519700, ycoord: 42.36897800})]);
   }

   private stubGeos()
   {
      const geos: ImpGeofootprintGeo[] = [
         {ggId: 7378344, geocode: '48375C1',  geoSortOrder:  1, hhc: 3894, distance:  7.98, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378345, geocode: '48168B1',  geoSortOrder:  2, hhc: 3718, distance:  5.00, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378346, geocode: '48167B1',  geoSortOrder:  3, hhc: 4581, distance:  5.46, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378347, geocode: '48168C1',  geoSortOrder:  4, hhc: 5003, distance:  9.65, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378348, geocode: '48167C1',  geoSortOrder:  5, hhc: 2479, distance: 10.48, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378349, geocode: '48167D1',  geoSortOrder:  6, hhc: 3453, distance:  7.15, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378350, geocode: '48393B1',  geoSortOrder:  7, hhc: 4692, distance: 13.79, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378351, geocode: '48375B1',  geoSortOrder:  8, hhc: 5294, distance:  6.50, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378352, geocode: '48170B1',  geoSortOrder:  9, hhc: 3430, distance:  6.26, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378353, geocode: '48170C1',  geoSortOrder: 10, hhc: 4234, distance:  4.91, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378354, geocode: '48393C1',  geoSortOrder: 11, hhc: 3347, distance: 12.53, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378355, geocode: '48170D1',  geoSortOrder: 12, hhc: 3048, distance:  5.03, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378356, geocode: '48170F1',  geoSortOrder: 13, hhc: 4283, distance: 10.10, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1},
         {ggId: 7378357, geocode: '48170G1',  geoSortOrder: 14, hhc: 3352, distance:  3.62, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null, xCoord: null, yCoord: null, isActive: 1}
      ];

      this.impGeofootprintGeoService.add(geos);
   }
}
