import { InMemoryStubService } from './../../api/in-memory-stub.service';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
// import {CarService} from '../service/carservice';
//import {EventService} from '../service/eventservice';
//import {Car} from '../domain/car';
import { SelectItem } from 'primeng/primeng';
import { StepsModule, MenuItem } from 'primeng/primeng';
import { MapService } from '../../services/map.service';

import { AmSite } from '../../val-modules/targeting/models/AmSite';
import { AmProfile } from '../../val-modules/targeting/models/AmProfile';
import { AmSiteService } from '../../val-modules/targeting/services/AmSite.service';
//import { AmSiteListComponent } from '../../val-modules/targeting/components/AmSiteList.component';
import { MessageService } from '../../val-modules/common/services/message.service';
import { Message } from '../../val-modules/common/models/Message';
import { ColorBoxComponent } from '../../components/color-box/color-box.component';
import { AppService } from '../../services/app.service';
import { MetricService, MetricOperations } from './../../val-modules/common/services/metric.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

@Component({
    templateUrl: './dashboard.component.html'
    //providers: [MapService, AppService] //
})
export class DashboardDemoComponent implements OnInit {
    msgs: Message[] = [];
    public displayRADInputs: boolean = false;

    chartData: any;
    events: any[];

    display: boolean;

    fakeItems: MenuItem[];
    public miles: number;
    public amSite: AmSite = new AmSite();

    public metricMapGreen: Map<string, string>;
    public metricMapBlue: Map<string, string>;
    public metricMapPurple: Map<string, string>;
    public metricMapTeal: Map<string, string>;

    competitorsMap: Map<string, string> = new Map<string, string>();
    sitesMap: Map<string, string> = new Map<string, string>();

    @ViewChild('locationsColorBox')
    private locationsColorBox: ColorBoxComponent;

    @ViewChild('campaignColorBox')
    private campaignColorBox: ColorBoxComponent;

    @ViewChild('audienceColorBox')
    private audienceColorBox: ColorBoxComponent;

    @ViewChild('performanceColorBox')
    private performanceColorBox: ColorBoxComponent;

    constructor(private mapService: MapService,
                private messageService: MessageService,
                private amSiteService: AmSiteService,
                private appService: AppService,
                private metricService: MetricService,
                public  impGeofootprintGeoService: ImpGeofootprintGeoService,
                public  impGeofootprintLocationService: ImpGeofootprintLocationService) { }

    ngOnInit() {

        // Load models
        this.metricMapGreen = new Map([
            ['# of Sites', this.amSiteService.sitesList.length.toString()],
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
            ['Median Household Income', MapService.medianHHIncome.toString()],
            ['Households with Children', MapService.hhChildren.toString()],
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
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' }
        ];

        // this.amSiteService.createDb();

  /*      // observe when new sites are added
        this.amSiteService.observeSites().subscribe(site => {
            console.log('Dashboard component detected new site');
//            this.locationsColorBox.set('# of Sites', this.amSiteService.amSites.length.toString());
        });*/

        // Observe the metricsService
        this.metricService.observeMetrics().subscribe(metricMessage => {
         console.log('Dashboard component detected change in metrics');

         switch (metricMessage.operation)
         {
            case MetricOperations.ADD:
               switch (metricMessage.group.toUpperCase())
               {
                  case 'LOCATIONS':
                     this.locationsColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'CAMPAIGN':
                     this.campaignColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'AUDIENCE':
                     this.audienceColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'PERFORMANCE':
                  this.performanceColorBox.set(metricMessage.key, metricMessage.value);
                  break;
               }
            break;

            case MetricOperations.REMOVE:
               switch (metricMessage.group.toUpperCase())
               {
                  case 'LOCATIONS':
                     this.locationsColorBox.delete(metricMessage.key);
                  break;

                  case 'CAMPAIGN':
                     this.campaignColorBox.delete(metricMessage.key);
                  break;

                  case 'AUDIENCE':
                     this.audienceColorBox.delete(metricMessage.key);
                  break;

                  case 'PERFORMANCE':
                     this.performanceColorBox.delete(metricMessage.key);
                  break;
               }
            break;

            case MetricOperations.UPDATE:
               switch (metricMessage.group.toUpperCase())
               {
                  case 'LOCATIONS':
                     this.locationsColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'CAMPAIGN':
                     this.campaignColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'AUDIENCE':
                     this.audienceColorBox.set(metricMessage.key, metricMessage.value);
                  break;

                  case 'PERFORMANCE':
                     this.performanceColorBox.set(metricMessage.key, metricMessage.value);
                  break;
               }
            break;

            case MetricOperations.COPY:
               switch (metricMessage.group.toUpperCase())
               {
                  case 'LOCATIONS':
                  break;

                  case 'CAMPAIGN':
                  break;

                  case 'AUDIENCE':
                  break;

                  case 'PERFORMANCE':
                  break;
               }
            break;
         }
         // this.locationsColorBox.set('# of Sites', this.amSiteService.amSites.length.toString());
         // this.campaignColorBox.set('Household Count', MapService.hhDetails.toString());
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
    showSideBar($event) {
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
        this.msgs.push({ severity: 'success', summary: 'Info Message', detail: 'You have received a message from the message fairy.' });
    }
}
