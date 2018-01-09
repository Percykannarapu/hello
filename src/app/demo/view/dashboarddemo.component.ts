import {InMemoryStubService} from './../../api/in-memory-stub.service';
import {Component, OnInit, ViewChild, ElementRef} from '@angular/core';
// import {CarService} from '../service/carservice';
//import {EventService} from '../service/eventservice';
//import {Car} from '../domain/car';
import {SelectItem} from 'primeng/primeng';
import {StepsModule, MenuItem} from 'primeng/primeng';
import {MapService} from '../../services/map.service';
import {Points} from '../../Models/Points';
import {AmSite} from '../../val-modules/targeting/models/AmSite';
import {AmProfile} from '../../val-modules/targeting/models/AmProfile';
import {AmSiteService} from '../../val-modules/targeting/services/AmSite.service';
import {AmSiteListComponent} from '../../val-modules/targeting/components/AmSiteList.component';
import {MessageService} from '../../val-modules/common/services/message.service';
import {Message} from '../../val-modules/common/models/Message';
import { ColorBoxComponent } from '../../components/color-box/color-box.component';
import { AppService } from '../../services/app.service';

@Component({
    templateUrl: './dashboard.component.html',
    providers: [MapService, AppService] //
})
export class DashboardDemoComponent implements OnInit {
   msgs: Message[] = [];
   public displayRADInputs: boolean = false;
//   cities: SelectItem[];
//   cars: Car[];
   chartData: any;
   events: any[];
//   selectedCity: any;
   display: boolean;
   mapView: __esri.MapView;

   fakeItems: MenuItem[];
   public miles: number;

   public amSite: AmSite = new AmSite();

   public tradeAreaMergeTypes: SelectItem[];
   public selectedMergeTypes: string;
   public displayDBSpinner: boolean = false;

   ta1Miles: number;
   ta2Miles: number;
   ta3Miles: number;
   milesList: number[];
   selectedValue: String = 'Sites';
   checked2: boolean = false;
   checked1: boolean  = false;
   checked3: boolean = false;
   kms: number;

   kmsList: number[] = [];
   editedta1: boolean = false;
   editedta2: boolean = false;
   editedta3: boolean = false;

   public metricMapGreen:  Map<string, string>;
   public metricMapBlue:   Map<string, string>;
   public metricMapPurple: Map<string, string>;
   public metricMapTeal:   Map<string, string>;

   competitorsMap: Map<string, string> = new Map<string, string>();
   sitesMap: Map<string, string> = new Map<string, string>();

   @ViewChild('greenColorBox')
   private greenColorBox: ColorBoxComponent;


   @ViewChild('campaineDetailsBox')
   private campaignDetailsBox: ColorBoxComponent;

    
   constructor(// private carService: CarService,
//               private eventService: EventService,
               private mapService: MapService,
               private messageService: MessageService,
               private amSiteService: AmSiteService,
               private appService: AppService) { }

   ngOnInit() {

      // Load models
      this.metricMapGreen = new Map([
         ['# of Sites', this.amSiteService.amSites.length.toString()],
         ['# of Competitors', '0'],
         ['# of Markets', '3']
      ]);

      this.metricMapBlue = new Map([
         ['Household Count', MapService.hhDetails.toString()],
         ['IP Address Count', MapService.hhIpAddress.toString()],
         ['Total Investment', '$7,476'],
         ['Progress to Budget', '83%']
      ]);

      this.metricMapPurple = new Map([
         ['Median Household Income', '$50,678'],
         ['Households with Children', '67%'],
         ['Valassis Apio Index', '121'],
         ['Sporting Good TAP Index', '108'],
         ['Average Sales per HH', '115']
      ]);

      this.metricMapTeal = new Map([
         ['Predicted Response', '0.25%'],
         ['Estimated Top Line Sales Generation', '$15,000'],
         ['Predicted ROI $', '$1,524 (20%)'],
         ['Targeting Index', '130']
      ]);

      this.fakeItems = [
         {label: 'Step 1'},
         {label: 'Step 2'},
         {label: 'Step 3'}
      ];

      // this.amSiteService.createDb();

      // observe when new sites are added
      this.amSiteService.observeSites().subscribe(site => {
         console.log('Dashboard component detected new site');
         this.greenColorBox.set('# of Sites', this.amSiteService.amSites.length.toString());
      });





      // this.amSiteService.getAmSites().subscribe(geofootprintGeos => {
      //    console.log('geofootprintGeos.length: ' + geofootprintGeos.length);
      //    this.geofootprintGeos = geofootprintGeos;
      //  });

   /* this.amSite = new AmSite();
      this.amSite.pk = 1000;
      this.amSite.name = 'Test Site';
      console.log('amSite.pk = ' + this.amSite.pk);
      console.log('amSite: ' + this.amSite.toString());*/

//      this.carService.getCarsSmall().then(cars => this.cars = cars);
//      this.eventService.getEvents().then(events => {this.events = events; });

      this.tradeAreaMergeTypes = [];
      this.tradeAreaMergeTypes.push({label: 'No Merge', value: 'No Merge'});
      this.tradeAreaMergeTypes.push({label: 'Merge Each', value: 'Merge Each'});
      this.tradeAreaMergeTypes.push({label: 'Merge All', value: 'Merge All'});
      this.selectedMergeTypes = 'Merge Each';

      // this.cities = [];
      // this.cities.push({label: 'Select City', value: null});
      // this.cities.push({label: 'New York', value: {id: 1, name: 'New York', code: 'NY'}});
      // this.cities.push({label: 'Rome', value: {id: 2, name: 'Rome', code: 'RM'}});
      // this.cities.push({label: 'London', value: {id: 3, name: 'London', code: 'LDN'}});
      // this.cities.push({label: 'Istanbul', value: {id: 4, name: 'Istanbul', code: 'IST'}});
      // this.cities.push({label: 'Paris', value: {id: 5, name: 'Paris', code: 'PRS'}});

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

   showViaService() {
      console.log('showViaService fired');
      if (this.messageService == null)
         console.log('messageService not injected');
      else
         console.log('messageService was injected');
//      this.messageService.add({severity: 'success', summary: 'Service Message', detail: 'Via MessageService'});
      console.log(this.messageService);
      this.msgs.push({severity: 'success', summary: 'Info Message', detail: 'You have received a message from the message fairy.'});
   }      
   
   public async drawBuffer(){
    console.log('ta1miles::' + this.ta1Miles + 'ta2miles::' + this.ta2Miles + 'ta3Miles:: ' + this.ta3Miles);
    //show the spinner while we do our work
    this.displayDBSpinner = true;
    const lyrNme: string = ' Mile Trade Area'; 
    let meTitle = 'Site - ';
        if (this.selectedValue === 'Competitors'){ 
            meTitle = 'Competitor - ';
            if (this.checked1){
                this.competitorsMap.set('editedta1', String(this.editedta1));
                this.competitorsMap.set('checked1', String(this.checked1));
                this.competitorsMap.set('ta1Miles', String(this.ta1Miles));  
            }else{
                this.competitorsMap.delete('editedta1');
                this.competitorsMap.delete('checked1');
                this.competitorsMap.delete('ta1Miles');
            }
            
            if (this.checked2){
                this.competitorsMap.set('editedta2', String(this.editedta2));
                this.competitorsMap.set('checked2', String(this.checked2));
                this.competitorsMap.set('ta2Miles', String(this.ta2Miles));
            }else{
                this.competitorsMap.delete('editedta2');
                this.competitorsMap.delete('checked2');
                this.competitorsMap.delete('ta2Miles');
            }
            if (this.checked3){
                this.competitorsMap.set('editedta3', String(this.editedta3));
                this.competitorsMap.set('checked3', String(this.checked3));
                this.competitorsMap.set('ta3Miles', String(this.ta3Miles));   
            }else{
                this.competitorsMap.delete('editedta3');
                this.competitorsMap.delete('checked3');
                this.competitorsMap.delete('ta3Miles');
            }
        }
        if (this.selectedValue === 'Sites'){ 
            if (this.checked1 && this.ta1Miles != null){
                this.sitesMap.set('editedta1', String(this.editedta1));
                this.sitesMap.set('checked1', String(this.checked1));
                this.sitesMap.set('ta1Miles', String(this.ta1Miles));
            }else{
                this.sitesMap.delete('editedta1');
                this.sitesMap.delete('checked1');
                this.sitesMap.delete('ta1Miles');
            }
            if (this.checked2 && this.ta2Miles != null){
                this.sitesMap.set('editedta2', String(this.editedta2));
                this.sitesMap.set('checked2', String(this.checked2));
                this.sitesMap.set('ta2Miles', String(this.ta2Miles));
            }else{
                this.sitesMap.delete('editedta2');
                this.sitesMap.delete('checked2');
                this.sitesMap.delete('ta2Miles');
            }
            if (this.checked3 && this.ta3Miles != null){
                this.sitesMap.set('editedta3', String(this.editedta3));
                this.sitesMap.set('checked3', String(this.checked3));
                this.sitesMap.set('ta3Miles', String(this.ta3Miles));    
            }else{
                this.sitesMap.delete('editedta3');
                this.sitesMap.delete('checked3');
                this.sitesMap.delete('ta3Miles');
            }
        }
    let mergeEachBool: boolean = false;
    let mergeAllBool: boolean  = false;
    
    if (this.selectedMergeTypes.match('Merge Each')){  mergeEachBool = true; }
    if (this.selectedMergeTypes.match('Merge All')){ mergeAllBool = true; }
        
   
     this.milesList = [];
     if (this.ta1Miles != null && this.checked1){
        this.milesList.push(this.ta1Miles);
        this.editedta1 = true;
     }
        
     if (this.ta2Miles != null && this.checked2)   {
        this.milesList.push(this.ta2Miles);
        this.editedta2 = true;
     } 
        
     if (this.ta3Miles != null && this.checked3)   {
        this.milesList.push(this.ta3Miles);
        this.editedta3 = true;
     } 

     if (this.ta3Miles == null){ this.ta3Miles = 0; }
     if (this.ta2Miles == null){this.ta2Miles = 0; }
     if (this.ta1Miles == null){  this.ta1Miles = 0; }
              
     var latitude : number;
     var longitude: number;
     try {  
         this.mapView = this.mapService.getMapView();
         var pointsArray: Points[] = [];
         var existingGraphics: __esri.Collection<__esri.Graphic>;
         let lyrTitle: string;
     await  MapService.layers.forEach(layer => {   
           if (this.selectedValue == 'Sites'){
                if (layer.title.startsWith('Site -') ){
                    this.disableLyr(layer);
                }  
           }
           if (this.selectedValue == 'Competitors'){
                if (layer.title.startsWith('Competitor -') ){
                    this.disableLyr(layer);
                }  
            }
              
             existingGraphics = (<__esri.FeatureLayer>layer).source;
              if (layer.title == this.selectedValue){
                 lyrTitle = layer.title;
                     existingGraphics.forEach(function(current: any){
                         let points = new Points();
                         points.latitude =  current.geometry.latitude;
                         points.longitude = current.geometry.longitude; 
                         pointsArray.push(points);  
                     });
                 }	
        });
         var color = null;
         var outlneColor = null;
        if (lyrTitle == 'Sites' ){
          color = {a: 0, r: 0, g: 0, b: 255 };
          outlneColor = ([0, 0, 255, 2.50]);  
        }else{
          color = {a: 0, r: 255, g: 0, b: 0 };
          outlneColor = ([255, 0, 0, 2.50]);  
        }
         if (mergeAllBool){
             console.log('inside merge All');
             var max = Math.max(this.ta1Miles, this.ta2Miles, this.ta3Miles);
             if (max != null){
                this.kms = max / 0.62137;
                await this.mapService.bufferMergeEach(pointsArray, color, this.kms, meTitle + max + lyrNme, outlneColor);
                this.campaignDetailsBox.set('Household Count', MapService.hhDetails.toString());
                this.campaignDetailsBox.set('IP Address Count', MapService.hhIpAddress.toString());

             }
         }else if (mergeEachBool){
             console.log('inside merge Each');
           //  for(let point of pointsArray){
                 for (let miles1 of this.milesList){
                     var kmsMereEach = miles1 / 0.62137;
                     console.log('Kms in Merge Each:::' + kmsMereEach);
                     await this.mapService.bufferMergeEach(pointsArray, color, kmsMereEach, meTitle + miles1 + lyrNme, outlneColor);
                    this.campaignDetailsBox.set('Household Count', MapService.hhDetails.toString());
                    this.campaignDetailsBox.set('IP Address Count', MapService.hhIpAddress.toString());
                 }
            // }
         }else{
            //var meTitle = 'Trade Area ';
             console.log('inside draw Circle');
             var i: number = 0;
             for (let miles1 of this.milesList){
                 i++;
                var kmsNomerge = miles1 / 0.62137;
                 for (let point of pointsArray){
                     console.log('Kms in No Merge:::' + kmsNomerge);
                     await this.mapService.drawCircle(point.latitude, point.longitude, color, kmsNomerge, meTitle + miles1 + lyrNme, outlneColor);
                     this.campaignDetailsBox.set('Household Count', MapService.hhDetails.toString());
                     this.campaignDetailsBox.set('IP Address Count', MapService.hhIpAddress.toString());
                 }
             }
         }
        //hide the spinner after drawing buffer
        this.displayDBSpinner = false;
        this.appService.closeOverLayPanel.next(true);
       }catch (ex) {
         console.error(ex);
       }
    }

    public async manageIcons(eventVal: string, taType: string){
        console.log('manageIcons fired:: ');
        if (this.editedta1 && taType=='ta1miles'){
            this.editedta1 = false;
            this.checked1  = false;
        }
        if (this.editedta2 && taType=='ta2miles'){
            this.editedta2 = false;
            this.checked2  = false;
        }
        if (this.editedta3 && taType=='ta3miles'){
            this.editedta3 = false;
            this.checked3  = false;
        }
    }

    public async clearFields(eventVal: string, taType: string){
        console.log('clearFields fired:: ');

        this.editedta1 = false;
        this.checked1  = false;
        this.ta1Miles  = null;

        this.editedta2 = false;
        this.checked2  = false;
        this.ta2Miles  = null;

        this.editedta3 = false;
        this.checked3  = false;
        this.ta3Miles  = null;
        if (this.selectedValue == 'Competitors'){
           if (this.competitorsMap.get('ta3Miles') != null){
                this.ta3Miles  = Number(this.competitorsMap.get('ta3Miles'));
                this.checked3 = true;
                this.editedta3 = true;
           }
           if (this.competitorsMap.get('ta2Miles') != null){
                this.ta2Miles  = Number(this.competitorsMap.get('ta2Miles'));
                this.checked2  = true;
                this.editedta2 = true; 
           }
           if (this.competitorsMap.get('ta1Miles') != null){
                this.ta1Miles  = Number(this.competitorsMap.get('ta1Miles'));
                this.checked1  = true;
                this.editedta1 = true; 
            }
        }
        if (this.selectedValue == 'Sites'){
            if (this.sitesMap.get('ta3Miles') != null){
                this.ta3Miles  = Number(this.sitesMap.get('ta3Miles'));
                this.checked3  = true;
                this.editedta3 = true; 
            }
            if (this.sitesMap.get('ta2Miles') != null){
                this.ta2Miles  = Number(this.sitesMap.get('ta2Miles')); 
                this.checked2  = true;
                this.editedta2 = true; 
            }
            if (this.sitesMap.get('ta1Miles') != null){
                this.ta1Miles  = Number(this.sitesMap.get('ta1Miles'));    
                this.checked1  = true;
                this.editedta1 = true;     
            }
        }
    }

    public async disableLyr(layer: __esri.Layer){
        console.log('disable Layer:');
        MapService.layers.delete(layer);
        MapService.layerNames.delete(layer.title);
        this.mapView = this.mapService.getMapView();
        this.mapView.map.remove(layer);
    }
    public async removeBuffer(){
        await this.mapService.removeMapLayers();
    }
}