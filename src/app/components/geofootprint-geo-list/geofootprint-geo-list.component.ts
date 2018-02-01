import { ImpGeofootprintGeoService } from './../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription, ISubscription } from 'rxjs/Subscription';

// Import Core Modules
// import { CONFIG, MessageService } from '../../core';

// Import Custom Components
import { GeofootprintGeo } from './../../models/geofootprintGeo.model';
// import { GeofootprintGeoService } from './../../Models/geofootprintGeo.service';
import { GfGeoService } from './../../models/gf-geo/gf-geo.service';
import { AppState } from '../../app.state';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy
{
   private subscription: ISubscription;
   
   impGeofootprintGeos: ImpGeofootprintGeo[];

   anInt: number = 1;
   selectAllGeos: boolean;
   testGeocode: ImpGeofootprintGeo = new ImpGeofootprintGeo();

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService, private appState: AppState) { }

   ngOnInit()
   {
      // Subscribe to the data store
      this.subscription = this.impGeofootprintGeoService.storeObservable.subscribe(storeData => this.impGeofootprintGeos = storeData);
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

}