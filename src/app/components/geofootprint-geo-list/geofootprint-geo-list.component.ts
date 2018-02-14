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

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private siteSubscription: ISubscription;
   private geosSubscription: ISubscription;

   public  impGeofootprintLocations: ImpGeofootprintLocation[];
   public  selectedImpGeofootprintLocations: ImpGeofootprintLocation[];
   
   public  impGeofootprintGeos: ImpGeofootprintGeo[];
   public  selectedImpGeofootprintGeos: ImpGeofootprintGeo[];

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
                                           {label: 'site',     value: {field: 'impGeofootprintLocation.locationName', header: 'Site', width: '29%', styleClass: ''}},
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

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               public  mapService: MapService,
               private appState: AppState) { }

   ngOnInit()
   {
      // console.log('gridColumns', this.gridColumns);

      // Subscribe to the sites data store
      this.siteSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(storeData => this.onChangeLocation(storeData));

      // Subscribe to the geos data store
      this.geosSubscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.onChangeGeos(storeData));

      // For now, sub out some data
      //this.stubLocations();
      //this.stubGeos();

      console.log('filtered geos: ', this.filterGeosBySite(202193));
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
      console.log('onChangeLocation - After:  ', this.impGeofootprintLocations);
      console.log('----------------------------------------------------------------------------------------');
      this.assignSite();
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
   /**
    * The geo passed in will be compared to the list of locations
    * and the closest will be recorded on the geo as well as the distance.
    */
   // TODO: changed to selectedImpGeofootprintLocations
   setClosestLocation(geo: ImpGeofootprintGeo, index: number)
   {
      if (this.impGeofootprintLocations == null)
      {
         console.log('setClosestLocation exiting; no sites', this.impGeofootprintLocations);
         return;
      }

      if (geo == null || geo.impGeofootprintLocation == null)
      {
         console.log('setClosestLocation exiting; either geo or geo.impGeofootprintLocation is null');
         return;
      }

      const foundLocation = this.impGeofootprintLocationService.find(geo.impGeofootprintLocation);
      if (foundLocation != null)
      {
         console.log(geo.geocode  + '(' + geo.distance + ') assigned location:', foundLocation);
         geo.impGeofootprintLocation = foundLocation;
      }
      else
         console.log('Did not find a closest site for ', geo.impGeofootprintLocation);

      // TODO: This will be replaced with a distance to site calculation
//    geo.impGeofootprintLocation = this.impGeofootprintLocations[(index % this.impGeofootprintLocations.length)];

/*
      // At this point, we only know the lat/lon of the closest location, find and assign the ImpGeofootprintLocation
      for (let i = 0; i < this.impGeofootprintLocations.length; i++)
      {
         if (geo.impGeofootprintLocation != null)
            console.log('geo.impGeofootprintLocation', geo.impGeofootprintLocation, ' i: ' + i);
         else
            console.log('geo.impGeofootprintLocation is null');

         if (geo.impGeofootprintLocation != null &&
             this.impGeofootprintLocations[i].xcoord === geo.impGeofootprintLocation.xcoord &&
             this.impGeofootprintLocations[i].ycoord === geo.impGeofootprintLocation.ycoord)
         {
            geo.impGeofootprintLocation = this.impGeofootprintLocations[i];
            console.log('Determining closest site to: ' + geo.geocode + ', sites: ' + this.impGeofootprintLocations.length + 
            ', index: ' + index + ',  mod: ' + (index % this.impGeofootprintLocations.length) + ', assigned: ' + geo.impGeofootprintLocation.locationName +
            ', distance: ' + geo.distance);
            break;
         }
      }*/
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
         console.log('assignSite fired - processing ' + this.impGeofootprintGeos.length + ' geos');
         for (const geo of this.impGeofootprintGeos)
            this.setClosestLocation(geo, idx++);
      }
      else
         console.log('assignSite - no geos to process');
   }

   /**
    * Returns a sub-set of the ImpGeofootprintGeos belonging to the
    * provided parent location, via glId.
    *
    * @param locationId The glId of the parent location to filter on
    */
   filterGeosBySite(locationId: number) : ImpGeofootprintGeo[]
   {      
      return this.impGeofootprintGeos.filter(
         geo => (geo.impGeofootprintLocation != null) ? geo.impGeofootprintLocation.glId === locationId : null);
   }

   testFind() {
      console.log('--------------------------------------------------');
      console.log('testFind');
      console.log('--------------------------------------------------');
//      const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.impGeofootprintLocation.glId === 1)];
//const foundGeos: ImpGeofootprintGeo[] =  [this.impGeofootprintGeoService.find(item => item.geocode === '48375C1')];
      const storeGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.get();
//      let  foundGeo = this.impGeofootprintGeoService.find(storeGeos[10]);
//      console.log('foundGeo', foundGeo);

      let searchGeo: ImpGeofootprintGeo = new ImpGeofootprintGeo({geocode: '48375C1'});
      const foundGeo = this.impGeofootprintGeoService.find(searchGeo);
      console.log('foundGeo', foundGeo);

      searchGeo = new ImpGeofootprintGeo({impGeofootprintLocation: new ImpGeofootprintLocation({locationName: 'Masons'})});
      const foundGeos: ImpGeofootprintGeo[] = [this.impGeofootprintGeoService.find(searchGeo)];
      console.log('foundGeos', foundGeos);

      const site: ImpGeofootprintLocation = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation', null);
      console.log ('site: ', site);

      const siteName: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName', null);
      console.log ('siteName: ', siteName);

      const testDefault: String = this.impGeofootprintGeoService.deepFind (searchGeo, 'impGeofootprintLocation.locationName.cocopuffs', 'A default Value');
      console.log ('defaulted: ', testDefault);

      const getByGeos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.getListBy ('impGeofootprintLocation.locationName', 'Masons');
      console.log ('findBy: ', getByGeos);

      let foundIdx = -1;
      for (let i = 0; i < storeGeos.length; i++)
      {
         foundIdx = this.impGeofootprintGeoService.findIndex(storeGeos[i]);
         console.log('found geo(' + i + ') at index', foundIdx); 
      }
   }
   
   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
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
         {ggId: 7378344, geocode: '48375C1',  geoSortOrder:  1, hhc: 3894, distance:  7.98, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378345, geocode: '48168B1',  geoSortOrder:  2, hhc: 3718, distance:  5.00, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378346, geocode: '48167B1',  geoSortOrder:  3, hhc: 4581, distance:  5.46, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378347, geocode: '48168C1',  geoSortOrder:  4, hhc: 5003, distance:  9.65, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378348, geocode: '48167C1',  geoSortOrder:  5, hhc: 2479, distance: 10.48, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378349, geocode: '48167D1',  geoSortOrder:  6, hhc: 3453, distance:  7.15, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378350, geocode: '48393B1',  geoSortOrder:  7, hhc: 4692, distance: 13.79, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378351, geocode: '48375B1',  geoSortOrder:  8, hhc: 5294, distance:  6.50, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378352, geocode: '48170B1',  geoSortOrder:  9, hhc: 3430, distance:  6.26, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378353, geocode: '48170C1',  geoSortOrder: 10, hhc: 4234, distance:  4.91, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378354, geocode: '48393C1',  geoSortOrder: 11, hhc: 3347, distance: 12.53, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378355, geocode: '48170D1',  geoSortOrder: 12, hhc: 3048, distance:  5.03, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378356, geocode: '48170F1',  geoSortOrder: 13, hhc: 4283, distance: 10.10, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378357, geocode: '48170G1',  geoSortOrder: 14, hhc: 3352, distance:  3.62, impGeofootprintLocation: null, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null}
      ];
         
      this.impGeofootprintGeoService.add(geos);
   }

}