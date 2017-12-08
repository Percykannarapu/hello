import {Component, OnInit} from '@angular/core';
import {CarService} from '../service/carservice';
import {EventService} from '../service/eventservice';
import {Car} from '../domain/car';
import {SelectItem} from 'primeng/primeng';
import {StepsModule, MenuItem} from 'primeng/primeng';
import { MapService } from '../../services/map.service';
import { Points } from '../../Models/Points';
//import { AmSite } from '../../Models/AmSite';

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

    //public amSite: AmSite = new AmSite();

    public tradeAreaMergeTypes: SelectItem[];
    public selectedMergeTypes: string;
    ta1Miles : number;
    ta2Miles : number;
    ta3Miles : number;
    milesList : number[];

    constructor(private carService: CarService, private eventService: EventService, private mapService: MapService) { }

    ngOnInit() {
        this.fakeItems = [
            {label: 'Step 1'},
            {label: 'Step 2'},
            {label: 'Step 3'}
        ];

       /* this.amSite = new AmSite();
        this.amSite.pk = 1000;
        this.amSite.name = 'Test Site';
        console.log('amSite.pk = ' + this.amSite.pk);
        console.log('amSite: ' + this.amSite.toString());*/

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
        console.log("under construction")
        console.log("ta1miles::"+this.ta1Miles + "ta2miles::"+this.ta2Miles + " ta3Miles"+this.ta3Miles);
        this.milesList = [];
        if(this.ta1Miles!=null)
            this.milesList.push(this.ta1Miles);
        if(this.ta2Miles!=null)    
            this.milesList.push(this.ta2Miles);
        if(this.ta3Miles!=null)    
            this.milesList.push(this.ta3Miles);
            
        var latitude : number;
        var longitude: number;
        try {  
            this.mapView = this.mapService.getMapView();
            var pointsArray: Points[] = [];
            this.mapView.graphics.forEach(function(current : any) {
                let points = new Points();
                points.latitude =  current.geometry.latitude;
                points.longitude = current.geometry.longitude; 
                pointsArray.push(points);  
            });

            const color = {
                a: 0,
                r: 0,
                g: 0,
                b: 255
            }

            for(let point of pointsArray){
                for(let miles1 of this.milesList){
                    console.log("miles:::"+miles1)
                    await this.mapService.bufferMergeEach(point.latitude,point.longitude,color,miles1);
                }
            }
           
            //await this.mapService.drawCircle(latitude,longitude,color,this.miles);
          }
          catch (ex) {
            console.error(ex);
          }
        console.log("test end of drawbuffer")
        
    }
}
