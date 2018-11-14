import { Component, OnInit, ViewChild } from '@angular/core';
import {  MenuItem } from 'primeng/primeng';
import { Observable } from 'rxjs';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ColorBoxComponent } from '../color-box/color-box.component';
import { MetricService, MetricOperations } from '../../val-modules/common/services/metric.service';
import { RadService } from '../../services/rad.service';
import { UserService } from '../../services/user.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../state/app.interfaces';
import { CreateNewProject } from '../../state/data-shim/data-shim.actions';

@Component({
    templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
    chartData: any;
    events: any[];

    display: boolean;

    fakeItems: MenuItem[];
    public miles: number;

    public metricMapGreen: Map<string, string>;
    public flagMapGreen: Map<string, boolean>;
    public metricMapBlue: Map<string, string>;
    public flagMapBlue: Map<string, boolean>;
    public metricMapPurple: Map<string, string>;
    public flagMapPurple: Map<string, boolean>;
    public metricMapTeal: Map<string, string>;
    public flagMapTeal: Map<string, boolean>;

    @ViewChild('locationsColorBox')
    private locationsColorBox: ColorBoxComponent;

    @ViewChild('campaignColorBox')
    private campaignColorBox: ColorBoxComponent;

    @ViewChild('audienceColorBox')
    private audienceColorBox: ColorBoxComponent;

    @ViewChild('performanceColorBox')
    private performanceColorBox: ColorBoxComponent;

    private colorBoxesByGroup: Map<string, ColorBoxComponent> = new Map<string, ColorBoxComponent>();

    public locations$: Observable<ImpGeofootprintLocation[]>;
    public geos$: Observable<ImpGeofootprintGeo[]>;

    // note about "unused" services:
    // This is the only place these services are being injected, so leave them.
    // They need to be injected somewhere so they can run properly
    constructor(private metricService: MetricService,
                private radService: RadService,
                private userService: UserService,
                private impLocationService: ImpGeofootprintLocationService,
                private impGeoService: ImpGeofootprintGeoService,
                private store$: Store<AppState>) { }

    ngOnInit() {
        this.store$.dispatch(new CreateNewProject());

        // Load models
        this.metricMapGreen = new Map([
            ['# of Sites', '0'],
            ['# of Competitors', '0']
        ]);
        this.flagMapGreen = new Map<string, boolean>();

        this.metricMapBlue = new Map([
            ['Household Count', '0'],
            ['IP Address Count', '0'],
            ['Est. Total Investment', '0'],
            ['Progress to Budget', '0']
        ]);
        this.flagMapBlue = new Map<string, boolean>();

        this.metricMapPurple = new Map([
            ['Median Household Income', '0'],
            ['% \'17 HHs Families with Related Children < 18 Yrs', '0'],
            ['% \'17 Pop Hispanic or Latino', '0'],
            ['Casual Dining: 10+ Times Past 30 Days', '0']
        ]);
        this.flagMapPurple = new Map<string, boolean>();

        this.metricMapTeal = new Map([
            ['Predicted Response', '0'],
            ['Predicted Topline Sales Generated', '$0'],
            ['Cost per Response', '$0']
        ]);
        this.flagMapTeal = new Map<string, boolean>();

        this.colorBoxesByGroup.set('LOCATIONS', this.locationsColorBox);
        this.colorBoxesByGroup.set('CAMPAIGN', this.campaignColorBox);
        this.colorBoxesByGroup.set('AUDIENCE', this.audienceColorBox);
        this.colorBoxesByGroup.set('PERFORMANCE', this.performanceColorBox);

        this.fakeItems = [
            { label: 'Step 1' },
            { label: 'Step 2' },
            { label: 'Step 3' }
        ];

        // Observe the metricsService
        this.metricService.observeMetrics().subscribe(metricMessage => {
          const currentColorBox = this.colorBoxesByGroup.get(metricMessage.group.toUpperCase());
          switch (metricMessage.operation)
          {
            case MetricOperations.ADD:
               currentColorBox.set(metricMessage.key, metricMessage.value, metricMessage.flag);
               break;
            case MetricOperations.REMOVE:
               currentColorBox.delete(metricMessage.key);
               break;
            case MetricOperations.UPDATE:
               currentColorBox.set(metricMessage.key, metricMessage.value, metricMessage.flag);
               break;
            case MetricOperations.COPY:
               break;
         }
      });

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

        this.locations$ = this.impLocationService.storeObservable;
        this.geos$ = this.impGeoService.storeObservable;
    }

    showSideBar($event) {
        this.display = $event;
        //this.mapService.plotMarker($event.x, $event.y);
    }
}
