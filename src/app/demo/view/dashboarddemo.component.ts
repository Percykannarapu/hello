import {Component, OnInit} from '@angular/core';
import {CarService} from '../service/carservice';
import {EventService} from '../service/eventservice';
import {Car} from '../domain/car';
import {SelectItem} from 'primeng/primeng';
import {StepsModule, MenuItem} from 'primeng/primeng';
import { MapService } from '../../services/map.service';
import { Points } from '../../Models/Points';
import { AmSite } from '../../Models/targeting/AmSite';
import { AmProfile } from '../../Models/targeting/AmProfile';

@Component({
    templateUrl: './dashboard.component.html',
    providers: [MapService],
})
export class DashboardDemoComponent implements OnInit {

   cities: SelectItem[];
   cars: Car[];
   chartData: any;
   events: any[];
   selectedCity: any;
   display: boolean;
   mapView: __esri.MapView;

   fakeItems: MenuItem[];
   public miles: number;

   public amSite: AmSite = new AmSite();

   public tradeAreaMergeTypes: SelectItem[];
   public selectedMergeTypes: string;

   public metricMapGreen:  Map<string, string>;
   public metricMapBlue:   Map<string, string>;
   public metricMapPurple: Map<string, string>;
   public metricMapTeal:   Map<string, string>;
    
   constructor(private carService: CarService, private eventService: EventService, private mapService: MapService) { }

   ngOnInit() {
      // Load models
      this.metricMapGreen = new Map([
         ['#Sites', '5'],
         ['Metric #2', 'Metric Value #2'],
         ['Metric #3', 'Metric Value #3']
      ]);

      this.metricMapBlue = new Map([
         ['Household Count', '1200'],
         ['Blue Metric #2', 'Metric Value #2'],
         ['Blue Metric #3', 'Metric Value #3']
      ]);

      this.metricMapPurple = new Map([
         ['Progress To Budget', '22'],
         ['Purple Metric #2', 'Metric Value #2'],
         ['Purple Metric #3', 'Metric Value #3']
      ]);

      this.metricMapTeal = new Map([
         ['Messages', '10'],
         ['Teal Metric #2', 'Metric Value #2'],
         ['Teal Metric #3', 'Metric Value #3']
      ]);

      this.fakeItems = [
         {label: 'Step 1'},
         {label: 'Step 2'},
         {label: 'Step 3'}
      ];

      this.amSite = new AmSite();
      this.amSite.pk = 1000;
      this.amSite.name = 'Test Site';
      console.log('amSite.pk = ' + this.amSite.pk);
      console.log('amSite: ' + this.amSite.toString());

      this.carService.getCarsSmall().then(cars => this.cars = cars);
      this.eventService.getEvents().then(events => {this.events = events; });

      this.tradeAreaMergeTypes = [];
      this.tradeAreaMergeTypes.push({label: 'No Merge', value: 'No Merge'});
      this.tradeAreaMergeTypes.push({label: 'Merge Each', value: 'Merge Each'});
      this.tradeAreaMergeTypes.push({label: 'Merge All', value: 'Merge All'});
      this.selectedMergeTypes = 'Merge Each';

      this.cities = [];
      this.cities.push({label: 'Select City', value: null});
      this.cities.push({label: 'New York', value: {id: 1, name: 'New York', code: 'NY'}});
      this.cities.push({label: 'Rome', value: {id: 2, name: 'Rome', code: 'RM'}});
      this.cities.push({label: 'London', value: {id: 3, name: 'London', code: 'LDN'}});
      this.cities.push({label: 'Istanbul', value: {id: 4, name: 'Istanbul', code: 'IST'}});
      this.cities.push({label: 'Paris', value: {id: 5, name: 'Paris', code: 'PRS'}});

      this.chartData = {
         labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
         datasets: [
               {
                  label: 'First Dataset',
                  data: [65, 59, 80, 81, 56, 55, 40],
                  fill: false,
                  borderColor: '#FFC107'
               },
               {
                  label: 'Second Dataset',
                  data: [28, 48, 40, 19, 86, 27, 90],
                  fill: false,
                  borderColor: '#03A9F4'
               }
         ]
      };
   }
   showSideBar($event){
      this.display = $event;
      //this.mapService.plotMarker($event.x, $event.y);
   }

   public async drawBuffer(){
      console.log('under construction');
      console.log('miles' + this.miles);
      var latitude: number;
      var longitude: number;
      try {  
         this.mapView = this.mapService.getMapView();
         var pointsArray: Points[] = [];
         this.mapView.graphics.forEach(function(current: any) {
               let points = new Points();
               points.latitude =  current.geometry.latitude;
               points.longitude = current.geometry.longitude; 
               pointsArray.push(points);  
         });

         const color = {
               a: 0.5,
               r: 35,
               g: 93,
               b: 186
         };

         for (let point of pointsArray){
               await this.mapService.drawCircle(point.latitude,point.longitude,color,this.miles);
         }
         
         //await this.mapService.drawCircle(latitude,longitude,color,this.miles);
         }
         catch (ex) {
         console.error(ex);
         }
      console.log('test end of drawbuffer')
      
   }
}