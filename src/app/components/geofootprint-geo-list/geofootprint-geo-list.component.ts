import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';

// Import Core Modules
// import { CONFIG, MessageService } from '../../core';

// Import Custom Components
import { GeofootprintGeo } from './../../Models/geofootprintGeo.model';
// import { GeofootprintGeoService } from './../../Models/geofootprintGeo.service';
import { GfGeoService } from './../../Models/gf-geo/gf-geo.service';

@Component({
  selector: 'val-geofootprint-geo-list',
  templateUrl: './geofootprint-geo-list.component.html',
  styleUrls: ['./geofootprint-geo-list.component.css']
})
export class GeofootprintGeoListComponent implements OnInit, OnDestroy {
  private dbResetSubscription: Subscription;

  anInt: number = 1;
  selectAllGeos: boolean;
  testGeocode: GeofootprintGeo = new GeofootprintGeo();

  geofootprintGeos: GeofootprintGeo[] = [];

  constructor(// private geofootprintGeosService: GeofootprintGeoService,
              private gfGeoService: GfGeoService) { }

  getGeofootprintGeos() {
    console.debug('called getGeofootprintGeos');
    this.testGeocode.geocode = '46038';
    console.debug('geocode: ' + this.testGeocode.geocode);
/*
    this.geofootprintGeosService.getGeofootprintGeos().subscribe(geofootprintGeos => {
        console.log('geofootprintGeos.length: ' + geofootprintGeos.length);
        this.geofootprintGeos = geofootprintGeos;
      });*/
//      this.geofootprintGeos = [ this.testGeocode ];  // Test to see if template shows anything
    }

  ngOnInit() {
//  componentHandler.upgradeDom();
/*    this.getGeofootprintGeos();
    this.dbResetSubscription = this.geofootprintGeosService.onDbReset
                                   .subscribe(() => this.getGeofootprintGeos());*/

    this.gfGeoService.getGeos().subscribe((data) => { // use methods in our service
    this.geofootprintGeos = data; // data.quotes[0].quote;
    console.log('subscription.data = ' + data);
  }, (err) => {
    this.geofootprintGeos = err;
  });
  }

  ngOnDestroy() {
    this.dbResetSubscription.unsubscribe();
  }

  toggleGeocode(geo: GeofootprintGeo) {
    console.log('toggling geoccode');
    console.log(geo);
    //geo.isSelected = !geo.isSelected;
  }

  printGeocode(geo: GeofootprintGeo) {
     console.log(geo);
  }

  setAllGeocodesIsSelected(value: boolean) {
    console.log ('setAllGeocodesIsSelected to ' + value);
    for (const geo of this.geofootprintGeos) {
      //geo.isSelected = value;
    }
  }

}
