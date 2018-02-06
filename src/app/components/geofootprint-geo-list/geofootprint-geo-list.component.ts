import { ImpGeofootprintGeo } from './../../val-modules/targeting/models/ImpGeofootprintGeo';
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

   public  locGridColumns: SelectItem[] = [{label: 'locationName', value: {field: 'locationName', header: 'location',     width: '30%', style: '{\'width\':\'60%\'}'}, styleClass: ''},
                                           {label: 'homeGeocode',  value: {field: 'homeGeocode',  header: 'Home Geocode', width: '20%', style: '{\'width\':\'20%\'}'}, styleClass: ''},
                                           {label: 'ycoord',       value: {field: 'ycoord',       header: 'Lat',          width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''},
                                           {label: 'xcoord',       value: {field: 'xcoord',       header: 'Long',         width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''},
                                          ];

   public  geoGridColumns: SelectItem[] = [{label: 'site',     value: {field: 'impGeofootprintLocation.locationName', header: 'Site', width: '30%', style: '{\'width\':\'60%\'}'}, styleClass: ''},
                                           {label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  width: '20%', style: '{\'width\':\'20%\'}'}, styleClass: ''},
                                           {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''},
                                           {label: 'distance', value: {field: 'distance', header: 'Distance', width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''}
                                          ];

   public  selectAllGeos: boolean;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService,
               private impGeofootprintLocationService: ImpGeofootprintLocationService,
               private appState: AppState) { }

   ngOnInit()
   {
      // console.log('gridColumns', this.gridColumns);

      // Subscribe to the sites data store
      this.siteSubscription = this.impGeofootprintLocationService.storeObservable.subscribe(storeData => this.onChangeLocation(storeData));

      // Subscribe to the geos data store
      this.geosSubscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.onChangeGeos(storeData));

      // For now, sub out some data
      this.stubLocations();
      this.stubGeos();

      console.log('filtered geos: ', this.filterGeosBySite(202193));
   }

   ngOnDestroy()
   {
      this.geosSubscription.unsubscribe();
      this.siteSubscription.unsubscribe();
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
      this.impGeofootprintGeos = impGeofootprintGeos;
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

      console.log('onChangeLocation - Before: ', this.impGeofootprintLocations);
      this.impGeofootprintLocations = impGeofootprintLocation;
      console.log('onChangeLocation - After:  ', this.impGeofootprintLocations);
      this.assignSite();
   }

   // -----------------------------------------------------------
   // COMPONENT METHODS
   // -----------------------------------------------------------
   /**
    * The geo passed in will be compared to the list of locations
    * and the closest will be recorded on the geo as well as the distance.
    */
   setClosestLocation(geo: ImpGeofootprintGeo, index: number)
   {
      if (this.impGeofootprintLocations == null)
      {
         console.log('setClosestLocation exiting; no sites', this.impGeofootprintLocations);
         return;
      }

      // TODO: This will be replaced with a distance to site calculation
      geo.impGeofootprintLocation = this.impGeofootprintLocations[(index % this.impGeofootprintLocations.length)];
      console.log('Determining closest site to: ' + geo.geocode + ', sites: ' + this.impGeofootprintLocations.length + 
                  ', index: ' + index + ',  mod: ' + (index % this.impGeofootprintLocations.length) + ', stubbed: ' + geo.impGeofootprintLocation.locationName);
   }

   /**
    * Each geo in the list is assigned the closest site returned by
    * the method getClosestSite.
    * This happens automatically in the onChangeGeos subscription callback method.
    */
   assignSite()
   {
      console.log('assignSite fired');
      let idx: number = 0;
      if (this.impGeofootprintGeos != null)
         for (const geo of this.impGeofootprintGeos)
            this.setClosestLocation(geo, idx++);
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
         geo => geo.impGeofootprintLocation.glId === locationId);
   }

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
   toggleGeocode(geo: ImpGeofootprintGeo)
   {
      console.log('toggling geocode');
      console.log(geo);
      console.log('Selected: ' + this.selectedImpGeofootprintGeos.length + ',  Total: ' + this.impGeofootprintGeos.length);
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
      this.impGeofootprintLocationService.add([new ImpGeofootprintLocation({glId: 202193, locationName: 'Potbelly Livonia', xcoord: -83.33519700, ycoord: 42.36897800})]);
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