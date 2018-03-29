import { Component, OnInit, ViewChild } from '@angular/core';
import {  MenuItem } from 'primeng/primeng';
import { MapService } from '../../services/map.service';
import { ColorBoxComponent } from '../../components/color-box/color-box.component';
import { AppService } from '../../services/app.service';
import { MetricService, MetricOperations } from '../../val-modules/common/services/metric.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { RadService } from '../../services/rad.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { UserService } from '../../services/user.service';

@Component({
    templateUrl: './dashboard.component.html'
})
export class DashboardDemoComponent implements OnInit {
    chartData: any;
    events: any[];

    display: boolean;

    fakeItems: MenuItem[];
    public miles: number;

    public metricMapGreen: Map<string, string>;
    public metricMapBlue: Map<string, string>;
    public metricMapPurple: Map<string, string>;
    public metricMapTeal: Map<string, string>;

    @ViewChild('locationsColorBox')
    private locationsColorBox: ColorBoxComponent;

    @ViewChild('campaignColorBox')
    private campaignColorBox: ColorBoxComponent;

    @ViewChild('audienceColorBox')
    private audienceColorBox: ColorBoxComponent;

    @ViewChild('performanceColorBox')
    private performanceColorBox: ColorBoxComponent;

    constructor(private mapService: MapService,
                private appService: AppService,
                private metricService: MetricService,
                private radService: RadService,
                private targetAudienceService: TargetAudienceService,
                private userService: UserService,
                public  impGeofootprintGeoService: ImpGeofootprintGeoService,
                public  impGeofootprintLocationService: ImpGeofootprintLocationService) { }

    ngOnInit() {

        // load the RAD data
        this.radService.fetchRadData();

        // Load models
        this.metricMapGreen = new Map([
            ['# of Sites', '0'],
            ['# of Competitors', '0']
        ]);

        this.metricMapBlue = new Map([
            ['Household Count', MapService.hhDetails.toString()],
            ['IP Address Count', MapService.hhIpAddress.toString()],
            ['Total Investment', MapService.totInvestment.toString()],
            ['Progress to Budget', MapService.proBudget.toString()]
        ]);

        this.metricMapPurple = new Map([
            ['Median Household Income', '0'],
            ['% \'17 HHs Families with Related Children < 18 Yrs', '0'],
            ['% \'17 Pop Hispanic or Latino', '0'],
            ['Casual Dining: 10+ Times Past 30 Days', '0']
        ]);

        this.metricMapTeal = new Map([
            ['Predicted Response', '0'],
            ['Predicted Topline Sales Generated', '$0'],
            ['Predicted ROI', '$0']
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
}
