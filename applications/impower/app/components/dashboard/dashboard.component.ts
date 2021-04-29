import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppLocationService } from 'app/services/app-location.service';
import { AppStateService } from 'app/services/app-state.service';
import { MenuItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { RadService } from '../../services/rad.service';
import { UserService } from '../../services/user.service';
import { FullAppState } from '../../state/app.interfaces';
import { MetricOperations, MetricService } from '../../val-modules/common/services/metric.service';
import { CampaignDetailsComponent } from '../campaign-details/campaign-details.component';
import { ColorBoxComponent } from '../color-box/color-box.component';

@Component({
  selector: 'val-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
    chartData: any;
    events: any[];

    display: boolean;

    fakeItems: MenuItem[];
    public miles: number;
    public index: number = 1;

    public metricMapGreen: Map<string, string>;
    public flagMapGreen: Map<string, boolean>;
    public metricMapBlue: Map<string, string>;
    public flagMapBlue: Map<string, boolean>;
    public metricMapPurple: Map<string, string>;
    public flagMapPurple: Map<string, boolean>;
    public metricMapTeal: Map<string, string>;
    public flagMapTeal: Map<string, boolean>;

    @ViewChild('locationsColorBox', { static: true })
    private locationsColorBox: ColorBoxComponent;

    @ViewChild('campaignColorBox', { static: true })
    private campaignColorBox: ColorBoxComponent;

    @ViewChild('audienceColorBox', { static: true })
    private audienceColorBox: ColorBoxComponent;

    @ViewChild('performanceColorBox', { static: true })
    private performanceColorBox: ColorBoxComponent;

    @ViewChild('campaignDetailsComponent', { static: true })
    private campaignDetailsComponent: CampaignDetailsComponent;

    public hasLocationFailures$: Observable<boolean>;
    private colorBoxesByGroup: Map<string, ColorBoxComponent> = new Map<string, ColorBoxComponent>();

    // note about "unused" services:
    // This is the only place these services are being injected, so leave them.
    // They need to be injected somewhere so they can run properly
    constructor(private metricService: MetricService,
                private radService: RadService,
                private userService: UserService,
                private appLocationService: AppLocationService,
                private appStateService: AppStateService,
                private store$: Store<FullAppState>) { }

    ngOnInit() {
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
            ['% CY HHs Families with Related Children < 18 Yrs', '0'],
            ['% CY Pop Hispanic or Latino', '0'],
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

        // Conditionally show the Failed Locations Tab when there are failures
        this.appStateService.applicationIsReady$.pipe(
          filter(ready => ready),
          take(1)
        ).subscribe(() => {
          this.hasLocationFailures$ = this.appLocationService.hasFailures$;
        });

        this.appStateService.clearUI$.subscribe(() => {
            this.index = 0;
        });
    }

    onCampaignDetailsClose(){
        this.campaignDetailsComponent.onDiscoveryFormClose();
    }

    handleChange(e) {
         this.index = e.index;
    }

    swallowClickEvent(ev: MouseEvent) : void {
      ev.stopPropagation();
      ev.stopImmediatePropagation();
    }
}
