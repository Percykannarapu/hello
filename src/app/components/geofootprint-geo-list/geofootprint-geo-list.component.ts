import { ImpGeofootprintGeoService } from './../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, ISubscription } from 'rxjs/Subscription';

// Import UI Components
import { SelectItem } from 'primeng/components/common/selectitem';

// Import Custom Components
import { GeofootprintGeo } from './../../models/geofootprintGeo.model';
// import { GeofootprintGeoService } from './../../Models/geofootprintGeo.service';
import { GfGeoService } from './../../models/gf-geo/gf-geo.service';
import { AppState } from '../../app.state';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private subscription: ISubscription;

   public paddingStr: string = '0px';
   public  impGeofootprintGeos: ImpGeofootprintGeo[];
   public  gridColumns: SelectItem[] = [{label: 'site',     value: {field: 'impGeofootprintLocation.locationName', header: 'Site', width: '30%', style: '{\'width\':\'60%\'}'}, styleClass: ''},
                                        {label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  width: '20%', style: '{\'width\':\'20%\'}'}, styleClass: ''},
                                        {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''},
                                        {label: 'distance', value: {field: 'distance', header: 'Distance', width: '15%', style: '{\'width\':\'10%\'}'}, styleClass: ''}
                                       ];
   // public  gridColumns: SelectItem[] = [{label: 'site',     value: {field: 'site',     header: 'Site',     style: '{\'width\':\'60%\'}'}, styleClass: ''},
   //                                      {label: 'geocode',  value: {field: 'geocode',  header: 'Geocode',  style: '{\'width\':\'20%\'}'}, styleClass: ''},
   //                                      {label: 'hhc',      value: {field: 'hhc',      header: 'HHC',      style: '{\'width\':\'10%\'}'}, styleClass: ''},
   //                                      {label: 'distance', value: {field: 'distance', header: 'Distance', style: '{\'width\':\'10%\'}'}, styleClass: ''}
   //                                      ];
   public  anInt: number = 1;
   public  selectAllGeos: boolean;
   public  testGeocode: ImpGeofootprintGeo = new ImpGeofootprintGeo();

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService, private appState: AppState) { }

   ngOnInit()
   {
      console.log('gridColumns', this.gridColumns);
      // Subscribe to the data store
      this.subscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.impGeofootprintGeos = storeData);

      this.stubGeos();
   }

   ngOnDestroy()
   {
      this.subscription.unsubscribe();
   }
  
   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   
   getGeofootprintGeos()
   {
      console.log('called getGeofootprintGeos');
      this.testGeocode.geocode = '46038';
      console.log('geocode: ' + this.testGeocode.geocode);
   }

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------

   toggleGeocode(geo: ImpGeofootprintGeo)
   {
      console.log('toggling geoccode');
      console.log(geo);
      //geo.isSelected = !geo.isSelected;
   }

   printGeocode(geo: ImpGeofootprintGeo)
   {
      console.log(geo);
   }

   setAllGeocodesIsSelected(value: boolean)
   {
      console.log ('setAllGeocodesIsSelected to ' + value);
      for (const geo of this.impGeofootprintGeos) {
         //geo.isSelected = value;
      }
   }

   stubGeos()
   {
      const site: ImpGeofootprintLocation = 
         new ImpGeofootprintLocation({glId: 202193, locationName: 'Masons', xcoord: -83.37270100, ycoord: 42.38179900});
         
      const geos: ImpGeofootprintGeo[] = [
         {ggId: 7378344, geocode: '48375C1',  geoSortOrder:  1, hhc: 3894, distance:  7.98, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378345, geocode: '48168B1',  geoSortOrder:  2, hhc: 3718, distance:  5.00, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378346, geocode: '48167B1',  geoSortOrder:  3, hhc: 4581, distance:  5.46, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378347, geocode: '48168C1',  geoSortOrder:  4, hhc: 5003, distance:  9.65, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378348, geocode: '48167C1',  geoSortOrder:  5, hhc: 2479, distance: 10.48, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378349, geocode: '48167D1',  geoSortOrder:  6, hhc: 3453, distance:  7.15, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378350, geocode: '48393B1',  geoSortOrder:  7, hhc: 4692, distance: 13.79, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378351, geocode: '48375B1',  geoSortOrder:  8, hhc: 5294, distance:  6.50, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378352, geocode: '48170B1',  geoSortOrder:  9, hhc: 3430, distance:  6.26, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378353, geocode: '48170C1',  geoSortOrder: 10, hhc: 4234, distance:  4.91, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378354, geocode: '48393C1',  geoSortOrder: 11, hhc: 3347, distance: 12.53, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378355, geocode: '48170D1',  geoSortOrder: 12, hhc: 3048, distance:  5.03, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378356, geocode: '48170F1',  geoSortOrder: 13, hhc: 4283, distance: 10.10, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null},
         {ggId: 7378357, geocode: '48170G1',  geoSortOrder: 14, hhc: 3352, distance:  3.62, impGeofootprintLocation: site, impGeofootprintMaster: null, impGeofootprintTradeArea: null, impProject: null}
      ];
         
      this.impGeofootprintGeoService.add(geos);
   }
}