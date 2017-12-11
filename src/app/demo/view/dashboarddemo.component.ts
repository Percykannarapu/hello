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
    selectedValue : String = 'Sites';
    checked2 : boolean = false;
    checked1 : boolean  = true;
    checked3 : boolean = false;
    kms     : number;
    kmsList : number[] = [];

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
       console.log("toggle box values:::"+this.checked1+" : "+this.checked2+" : "+this.checked3);
       
       let mergeEachBool : boolean = false;
       let mergeAllBool : boolean  = false;
       
       if(this.selectedMergeTypes.match('Merge Each'))
            mergeEachBool = true;
       if(this.selectedMergeTypes.match('Merge All'))
            mergeAllBool = true;
      
        this.milesList = [];
        if(this.ta1Miles!=null && this.checked1)
            this.milesList.push(this.ta1Miles);
        if(this.ta2Miles!=null && this.checked2)    
            this.milesList.push(this.ta2Miles);
        if(this.ta3Miles!=null && this.checked3)    
            this.milesList.push(this.ta3Miles);
            
        var latitude : number;
        var longitude: number;
        try {  
            this.mapView = this.mapService.getMapView();
            var pointsArray: Points[] = [];
            console.log("test points")
           // this.mapService.removeMapLayers();
            var existingGraphics: __esri.Collection<__esri.Graphic>;
        await  MapService.layers.forEach(layer => {   
              console.log("reading the layer::"+ layer.title); 
                existingGraphics = (<__esri.FeatureLayer>layer).source;
                if(layer.title == 'Sites'){
                    existingGraphics.forEach(function(current : any){
                        console.log("inside layer graphic loaded::"+current.geometry.latitude);
                        let points = new Points();
                        points.latitude =  current.geometry.latitude;
                        points.longitude = current.geometry.longitude; 
                        console.log("points loaded::"+points.latitude);
                        pointsArray.push(points);  
                    });
                }
            });

          /*console.log("entring :::graphics::")
            existingGraphics.forEach(function(current : any){
                console.log("inside layer graphic loaded::"+current.geometry.latitude);
                let points = new Points();
                points.latitude =  current.geometry.latitude;
                points.longitude = current.geometry.longitude; 
                console.log("points loaded::"+points.latitude);
                pointsArray.push(points);  
            }); */
            const color = {
                a: 0,
                r: 0,
                g: 0,
                b: 255
            }
            console.log("mergeEachBool::::"+mergeEachBool);
           

            if(mergeAllBool){
                console.log("inside merge All");
                if(this.ta1Miles>this.ta2Miles && this.ta1Miles > this.ta2Miles){
                    console.log("Larger mile is:"+this.ta1Miles);
                    this.kms = this.ta1Miles/0.62137;
                    this.kmsList.push(this.kms);
                    await this.mapService.bufferMergeEach(pointsArray,color,this.kms,'Merge All');
                }
                else if(this.ta2Miles>this.ta1Miles && this.ta2Miles > this.ta3Miles){
                    console.log("Larger mile is:"+this.ta2Miles);
                    this.kms = this.ta2Miles/0.62137;
                    this.kmsList.push(this.kms);
                    await this.mapService.bufferMergeEach(pointsArray,color,this.kms,'Merge All');
                }
                else{
                    console.log("Larger mile is:"+this.ta3Miles);
                    this.kms = this.ta3Miles/0.62137;
                    this.kmsList.push(this.kms);
                    await this.mapService.bufferMergeEach(pointsArray,color,this.kms,'Merge All');
                }
            }
            else if(mergeEachBool){
                console.log("inside merge Each");
              //  for(let point of pointsArray){
                    for(let miles1 of this.milesList){
                         this.kms = miles1/0.62137;
                         this.kmsList.push(this.kms);
                        console.log("miles:::"+miles1)
                        await this.mapService.bufferMergeEach(pointsArray,color,this.kms,'Merge Each');
                    }
               // }
            }
            else{
                console.log("inside draw Circle");
                for(let point of pointsArray){
                    for(let miles1 of this.milesList){
                        console.log("miles:::"+miles1)
                        await this.mapService.drawCircle(point.latitude,point.longitude,color,miles1);
                    }
                }
            }
            //await this.mapService.drawCircle(latitude,longitude,color,this.miles);
          }
          catch (ex) {
            console.error(ex);
          }
        console.log("test end of drawbuffer")
        
    }

    public async removeBuffer(){
        await this.mapService.removeMapLayers();
    }
}
