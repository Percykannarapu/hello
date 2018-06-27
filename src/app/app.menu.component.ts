import { Component, Input, OnInit } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { MenuItem } from 'primeng/primeng';
import { AppComponent } from './app.component';
import { ImpGeofootprintMaster } from './val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintGeoService, EXPORT_FORMAT_IMPGEOFOOTPRINTGEO } from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION } from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpMetricName } from './val-modules/metrics/models/ImpMetricName';
import { UsageService } from './services/usage.service';
import { TargetAudienceService } from './services/target-audience.service';
import { ImpDiscoveryService } from './services/ImpDiscoveryUI.service';
import { MetricService } from './val-modules/common/services/metric.service';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { Subject } from 'rxjs';
import { AppStateService } from './services/app-state.service';
import { withLatestFrom } from 'rxjs/operators';
import { ImpProject } from './val-modules/targeting/models/ImpProject';
import { DAOBaseStatus } from './val-modules/api/models/BaseModel';
import { UserService } from './services/user.service';
import { ImpGeofootprintGeoAttribService } from './val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintLocAttribService } from './val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintTradeAreaService } from './val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppMessagingService } from './services/app-messaging.service';
import { AppProjectService } from './services/app-project.service';
import { ImpProjectService } from './val-modules/targeting/services/ImpProject.service';
import { AppConfig } from './app.config';
import { EsriMapService } from './esri-modules/core/esri-map.service';


@Component({
    /* tslint:disable:component-selector */
    selector: 'app-menu',
    /* tslint:enable:component-selector */
    template: `
        <ul app-submenu [item]="model" root="true" class="ultima-menu ultima-main-menu clearfix" [reset]="reset" visible="true"></ul>
    `
})
export class AppMenuComponent implements OnInit {

    private nationalExtractClick$: Subject<any> = new Subject<any>();

    @Input() reset: boolean;

    model: any[];
    public environmentName = this.appConfig.environmentName;


    constructor(public app: AppComponent,
        public impGeofootprintGeoService: ImpGeofootprintGeoService,
        public impGeofootprintLocationService: ImpGeofootprintLocationService,
        private audienceService: TargetAudienceService,
        public usageService: UsageService,
        public impDiscoveryService: ImpDiscoveryService,
        public metricService: MetricService,
        private appStateService: AppStateService,
        private confirmationService: ConfirmationService,
        public userService: UserService,
        private attributeService: ImpGeofootprintGeoAttribService,
        private impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
        private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
        private impProjectService: ImpProjectService,
        private appProjectService: AppProjectService,
        private messageService: AppMessagingService,
        private appConfig: AppConfig,
        private esriMapService: EsriMapService) { }

    ngOnInit() {
        // sets up a subscription for the menu click event on the National Export.
        // doing it this way means I don't have to create a local copy of the analysisLevel or projectId
        this.nationalExtractClick$.pipe(
           withLatestFrom(this.appStateService.analysisLevel$, this.appStateService.projectId$),
        ).subscribe(([c, al, pid]) => this.audienceService.exportNationalExtract(al, pid));

        this.model = [
            { label: 'Dashboard', icon: 'dashboard', routerLink: ['/'] },
            /*          {
                label: 'Themes', icon: 'palette', badge: '6',
                items: [
                    {label: 'Valassis - Blue', icon: 'brush', command: (event) => {this.changeTheme('valassis-blue'); }},
                    {label: 'Indigo - Pink', icon: 'brush', command: (event) => {this.changeTheme('indigo'); }},
                    {label: 'Brown - Green', icon: 'brush', command: (event) => {this.changeTheme('brown'); }},
                    {label: 'Blue - Amber', icon: 'brush', command: (event) => {this.changeTheme('blue'); }},
                    {label: 'Blue Grey - Green', icon: 'brush', command: (event) => {this.changeTheme('blue-grey'); }},
                    {label: 'Dark - Blue', icon: 'brush', command: (event) => {this.changeTheme('dark-blue'); }},
                    {label: 'Dark - Green', icon: 'brush', command: (event) => {this.changeTheme('dark-green'); }},
                    {label: 'Green - Yellow', icon: 'brush', command: (event) => {this.changeTheme('green'); }},
                    {label: 'Purple - Cyan', icon: 'brush', command: (event) => {this.changeTheme('purple-cyan'); }},
                    {label: 'Purple - Amber', icon: 'brush', command: (event) => {this.changeTheme('purple-amber'); }},
                    {label: 'Teal - Lime', icon: 'brush', command: (event) => {this.changeTheme('teal'); }},
                    {label: 'Cyan - Amber', icon: 'brush', command: (event) => {this.changeTheme('cyan'); }},
                    {label: 'Grey - Deep Orange', icon: 'brush', command: (event) => {this.changeTheme('grey'); }}
                ]
            },*/
            // {label: 'Export Sites', value: 'Site', icon: 'store', command: () => this.impGeofootprintLocationService.exportStore(null, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, loc => loc.clientLocationTypeCode === 'Site', 'SITES')},
            {
                label: 'Projects', icon: 'storage',
                items: [
                    {label: 'Create New', command: () =>  this.createNewProject()}, //this.createNewProject()
                    {label: 'Open Existing', icon: 'grid-on', command: () => this.openExisting() }

                ]
            },
            {
                label: 'Export', icon: 'file_download',
                items: [
                    { label: 'Export Geofootprint - All', icon: 'map', command: () => this.getGeofootprintAll() },
                    { label: 'Export Geofootprint - Selected Only', icon: 'map', command: () => this.getGeofootprintSelected() },
                    { label: 'Export Sites', value: 'Site', icon: 'store', command: () => this.getSites() },
                    { label: 'Export Competitors', value: 'Competitor', icon: 'store', command: () => this.getCompetitor() },
                    { label: 'Export Valassis Apio™ National Data', value: 'National', icon: 'group', command: () => this.nationalExtractClick$.next(null) },
                    { label: 'Send Custom Sites to Valassis Digital', value: 'National', icon: 'group', command: () => this.getCustomSites() }
                ]
            },
            /*{


            Removing the demo content
            We need to keep this content for enhancements,
            if we want to use the additional functionality : US6650 nallana

                label: 'Customization', icon: 'settings_application',
                items: [
                    {label: 'Compact Size', icon: 'fiber_manual_record', command: () => this.app.layoutCompact = true},
                    {label: 'Material Size', icon: 'fiber_smart_record',  command: () => this.app.layoutCompact = false},
                    {label: 'Static Menu', icon: 'menu',  command: () => this.app.changeToStaticMenu()},
                    {label: 'Overlay Menu', icon: 'exit_to_app',  command: () => this.app.changeToOverlayMenu()},
                    {label: 'Slim Menu', icon: 'more_vert',  command: () => this.app.changeToSlimMenu()},
                    {label: 'Horizontal Menu', icon: 'border_horizontal',  command: () => this.app.changeToHorizontalMenu()},
                /*  {label: 'Light Menu', icon: 'label_outline',  command: () => this.app.darkMenu = false},
                    {label: 'Dark Menu', icon: 'label',  command: () => this.app.darkMenu = true},
                    {label: 'Inline Profile', icon: 'contacts',  command: () => this.app.profileMode = 'inline'},
                    {label: 'Top Profile', icon: 'person_pin',  command: () => this.app.profileMode = 'top'},*/
            /*{
             label: 'Themes', icon: 'palette',
             items: [
                {label: 'Valassis - Blue', icon: 'brush', command: (event) => {this.changeTheme('valassis-blue'); }},
                {label: 'Indigo - Pink', icon: 'brush', command: (event) => {this.changeTheme('indigo'); }},
                {label: 'Brown - Green', icon: 'brush', command: (event) => {this.changeTheme('brown'); }},
                {label: 'Blue - Amber', icon: 'brush', command: (event) => {this.changeTheme('blue'); }},
                {label: 'Blue Grey - Green', icon: 'brush', command: (event) => {this.changeTheme('blue-grey'); }},
                {label: 'Dark - Blue', icon: 'brush', command: (event) => {this.changeTheme('dark-blue'); }},
                {label: 'Dark - Green', icon: 'brush', command: (event) => {this.changeTheme('dark-green'); }},
                {label: 'Green - Yellow', icon: 'brush', command: (event) => {this.changeTheme('green'); }},
                {label: 'Purple - Cyan', icon: 'brush', command: (event) => {this.changeTheme('purple-cyan'); }},
                {label: 'Purple - Amber', icon: 'brush', command: (event) => {this.changeTheme('purple-amber'); }},
                {label: 'Teal - Lime', icon: 'brush', command: (event) => {this.changeTheme('teal'); }},
                {label: 'Cyan - Amber', icon: 'brush', command: (event) => {this.changeTheme('cyan'); }},
                {label: 'Grey - Deep Orange', icon: 'brush', command: (event) => {this.changeTheme('grey'); }}
                ]
             },
             {
                label: 'Developer Pages', icon: 'list',
                items: [
                   {label: 'PoC Page', icon: 'build', routerLink: ['poc']},
                   {label: 'PoC Map Page', icon: 'build', routerLink: ['poc map']},
                   {label: 'Parked Components', icon: 'build', routerLink: ['parked']},
                ]
             },
             {
                label: 'Components', icon: 'list', badge: '2', badgeStyleClass: 'teal-badge',
                items: [
                    {label: 'Sample Page', icon: 'desktop_mac', routerLink: ['/sample']},
                    {label: 'Forms', icon: 'input', routerLink: ['/forms']},
                    {label: 'Data', icon: 'grid_on', routerLink: ['/data']},
                    {label: 'Panels', icon: 'content_paste', routerLink: ['/panels']},
                    {label: 'Overlays', icon: 'content_copy', routerLink: ['/overlays']},
                    {label: 'Menus', icon: 'menu', routerLink: ['/menus']},
                    {label: 'Messages', icon: 'message', routerLink: ['/messages']},
                    {label: 'Charts', icon: 'insert_chart', routerLink: ['/charts']},
                    {label: 'File', icon: 'attach_file', routerLink: ['/file']},
                    {label: 'Misc', icon: 'toys', routerLink: ['/misc']}
                ]
            }
        ]
    },
    {
        label: 'Components', icon: 'list', badge: '2', badgeStyleClass: 'teal-badge',
        items: [
            {label: 'Sample Page', icon: 'desktop_mac', routerLink: ['/sample']},
            {label: 'Forms', icon: 'input', routerLink: ['/forms']},
            {label: 'Data', icon: 'grid_on', routerLink: ['/data']},
            {label: 'Panels', icon: 'content_paste', routerLink: ['/panels']},
            {label: 'Overlays', icon: 'content_copy', routerLink: ['/overlays']},
            {label: 'Menus', icon: 'menu', routerLink: ['/menus']},
            {label: 'Messages', icon: 'message', routerLink: ['/messages']},
            {label: 'Charts', icon: 'insert_chart', routerLink: ['/charts']},
            {label: 'File', icon: 'attach_file', routerLink: ['/file']},
            {label: 'Misc', icon: 'toys', routerLink: ['/misc']}
        ]
    },
    {
        label: 'Template Pages', icon: 'get_app',
        items: [
            {label: 'Empty Page', icon: 'hourglass_empty', routerLink: ['/empty']},
            {label: 'Landing Page', icon: 'flight_land', url: 'assets/pages/landing.html', target: '_blank'},
            {label: 'Login Page', icon: 'verified_user', url: 'assets/pages/login.html', target: '_blank'},
            {label: 'Error Page', icon: 'error', url: 'assets/pages/error.html', target: '_blank'},
            {label: '404 Page', icon: 'error_outline', url: 'assets/pages/404.html', target: '_blank'},
            {label: 'Access Denied Page', icon: 'security', url: 'assets/pages/access.html', target: '_blank'}
        ]
    },
    {
        label: 'Menu Hierarchy', icon: 'menu',
        items: [
            {
                label: 'Submenu 1', icon: 'subject',
                items: [
                    {
                        label: 'Submenu 1.1', icon: 'subject',
                        items: [
                            {label: 'Submenu 1.1.1', icon: 'subject'},
                            {label: 'Submenu 1.1.2', icon: 'subject'},
                            {label: 'Submenu 1.1.3', icon: 'subject'},
                        ]
                    },
                    {
                        label: 'Submenu 1.2', icon: 'subject',
                        items: [
                            {label: 'Submenu 1.2.1', icon: 'subject'},
                            {label: 'Submenu 1.2.2', icon: 'subject'}
                        ]
                    },
                ]
            },
            {
                label: 'Submenu 2', icon: 'subject',
                items: [
                    {
                        label: 'Submenu 2.1', icon: 'subject',
                        items: [
                            {label: 'Submenu 2.1.1', icon: 'subject'},
                            {label: 'Submenu 2.1.2', icon: 'subject'},
                            {label: 'Submenu 2.1.3', icon: 'subject'},
                        ]
                    },
                    {
                        label: 'Submenu 2.2', icon: 'subject',
                        items: [
                            {label: 'Submenu 2.2.1', icon: 'subject'},
                            {label: 'Submenu 2.2.2', icon: 'subject'}
                        ]
                    },
                ]
            }
        ]
    },
    {label: 'Utils', icon: 'build', routerLink: ['/utils']},
    {label: 'Documentation', icon: 'find_in_page', routerLink: ['/documentation']}*/
        ];
    }

    changeTheme(theme) {
        const themeLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('theme-css');
        const layoutLink: HTMLLinkElement = <HTMLLinkElement>document.getElementById('layout-css');

        themeLink.href = 'assets/theme/theme-' + theme + '.css';
        layoutLink.href = 'assets/layout/css/layout-' + theme + '.css';
    }

    public getSites() {
        const impProject = this.appStateService.currentProject$.getValue();
        this.impGeofootprintLocationService.exportStore(this.impGeofootprintLocationService.getFileName(impProject.projectId, 'Sites'),
                EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, impProject, false, loc => loc.clientLocationTypeCode === 'Site', 'SITES');
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'site-list', action: 'export' });
        this.usageService.createCounterMetric(usageMetricName, null, this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Site').length);
    }
    public getCompetitor() {
        const impProject = this.appStateService.currentProject$.getValue();
        this.impGeofootprintLocationService.exportStore(this.impGeofootprintLocationService.getFileName(impProject.projectId, 'Competitors'),
                EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, impProject, false, loc => loc.clientLocationTypeCode === 'Competitor', 'COMPETITORS');
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'competitor-list', action: 'export' });
        this.usageService.createCounterMetric(usageMetricName, null, this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Competitor').length);
    }
    public getGeofootprintAll() {
        const impProject = this.appStateService.currentProject$.getValue();
        const impAnalysis = impProject.methAnalysis;
        this.impGeofootprintGeoService.exportStore(this.impGeofootprintGeoService.getFileName(impAnalysis, impProject.projectId), EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx, impAnalysis);
        // update the metric count when export geos
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'geofootprint', action: 'export' });
        this.usageService.createCounterMetric(usageMetricName, 'includeAllGeography ', this.impGeofootprintGeoService.get().length);

        //this.discoveryUseageMetricService.createDiscoveryMetric('location-geofootprint-export');
        //this.discoveryUseageMetricService.createColorBoxMetrics('location-geofootprint-export');

        const counterMetricsDiscover = this.impDiscoveryService.discoveryUsageMetricsCreate('location-geofootprint-export');
        const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate('location-geofootprint-export');
        // console.log('counterMetricsColorBox:::', counterMetricsColorBox);

        this.usageService.creategaugeMetrics(counterMetricsDiscover);
        this.usageService.creategaugeMetrics(counterMetricsColorBox);
        //this.usageService.createCounterMetrics(counterMetricsDiscover);
        //this.usageService.createCounterMetrics(counterMetricsColorBox);


    }
    public getGeofootprintSelected() {
        const impProject = this.appStateService.currentProject$.getValue();
        const impProjectId = impProject.projectId;
        const analysisLevel = this.appStateService.analysisLevel$.getValue();
        this.impGeofootprintGeoService.exportStore(this.impGeofootprintGeoService.getFileName(analysisLevel, impProjectId), EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx, analysisLevel, geo => geo.isActive === true);
        // update the metric count when export geos
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'geofootprint', action: 'export' });
        this.usageService.createCounterMetric(usageMetricName, 'includeSelectedGeography', this.impGeofootprintGeoService.get().length);

        //this.discoveryUseageMetricService.createDiscoveryMetric('location-geofootprint-export');
        //this.discoveryUseageMetricService.createColorBoxMetrics('location-geofootprint-export');
        const counterMetricsDiscover = this.impDiscoveryService.discoveryUsageMetricsCreate('location-geofootprint-export');
        const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate('location-geofootprint-export');

        // console.log('counterMetricsColorBox:::', counterMetricsColorBox);

        this.usageService.creategaugeMetrics(counterMetricsDiscover);
        this.usageService.creategaugeMetrics(counterMetricsColorBox);
        //this.usageService.createCounterMetrics(counterMetricsDiscover);
        //this.usageService.createCounterMetrics(counterMetricsColorBox);


    }

    public getCustomSites() {
        const impProject = this.appStateService.currentProject$.getValue();
        if (impProject.projectId == null) {
            this.messageService.showGrowlError('Send Custom Sites', `The project must be saved before sending the custom site list to Valassis Digital.`);
        } else {
            if (impProject.projectTrackerId != null) {
                const fmtDate: string = new Date().toISOString().replace(/\D/g, '').slice(0, 13);
                const fileName = 'visit_locations_' + impProject.projectId + '_' + this.environmentName + '_' + fmtDate + '.csv';
                this.impGeofootprintLocationService.exportStore(fileName, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.digital, impProject, true, loc => loc.clientLocationTypeCode === 'Site', 'SITES');
                const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'vlh-site-list', action: 'send' });
                const usageMetricText = 'clientName=' + impProject.clientIdentifierName.trim() + '~' + 'projectTrackerId=' + impProject.projectTrackerId + '~' + 'fileName=' + fileName;
                this.usageService.createCounterMetric(usageMetricName, usageMetricText, this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Site').length);
            } else {
                this.messageService.showGrowlError('Send Custom Sites', `A valid Project Tracker ID must be specified before sending custom sites to Valassis Digital.`);
            }
        }
    }

    public openExisting(){
      const impProject = this.appStateService.currentProject$.getValue();
      if ( this.impGeofootprintLocationService.get().length > 0 || this.impGeofootprintGeoService.get().length > 0){
            this.confirmationService.confirm({
                message: 'Would you like to save your work before proceeding?',
                header: 'Save Work',
                icon: 'ui-icon-save',
                accept: () => {
                    // check for required fields
                 let errorString = null;
                if (impProject.projectName == null || impProject.projectName == '')
                     errorString = 'imPower Project Name is required<br>';
                if (impProject.methAnalysis == null || impProject.methAnalysis == '')
                     errorString += 'Analysis level is required';
                if (errorString != null) {
                    this.messageService.showGrowlError('Error Saving Project', errorString);
                    return;
                }
                        this.impProjectService.saveProject();
                        this.appProjectService.ngDialog.next(true);
                },
                reject: () => {
                    this.clearProject();
                    this.appProjectService.ngDialog.next(true);
                }
            });
        }
        else {
             this.appProjectService.ngDialog.next(true);
        }

    }

    public createNewProject(){
        let usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: '', target: 'project', action: 'new' });
        if ( this.impGeofootprintLocationService.get().length > 0 || this.impGeofootprintGeoService.get().length > 0){
            this.confirmationService.confirm({
                message: 'Your project may have unsaved changes. Do you wish to save your current project?',
                header: 'Save Confirmation',
                icon: 'ui-icon-project',
                accept: () => {
                    const impProjects: ImpProject[] = [];
                    const impProject = this.appStateService.currentProject$.getValue();
                    
                    //~
                    this.usageService.createCounterMetric(usageMetricName, 'SaveExisting=Yes', null);
                    usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'create' });
                    this.usageService.createCounterMetric(usageMetricName, null, null);
                    this.appStateService.projectId$.getValue();
                    let errorString = null;
                    if (impProject.projectName == null || impProject.projectName == '')
                         errorString = 'imPower Project Name is required<br>';
                    if (impProject.methAnalysis == null || impProject.methAnalysis == '')
                         errorString += 'Analysis level is required';
                    if (errorString != null) {
                        this.messageService.showGrowlError('Error Saving Project', errorString);
                        return;
                    }
                    this.impProjectService.saveProject();
                    this.clearProject();
                },
                reject: () => {
                  this.usageService.createCounterMetric(usageMetricName, 'SaveExisting=No', null);
                  this.clearProject();
                }
            });
        }
        
    }

    public clearProject(){

       this.esriMapService.map.layers.forEach(lyr => {
            //console.log('layers to remove:::', lyr.title, '/n dtls::::: ', lyr);
            if (lyr.title === 'Sites'){
                this.esriMapService.map.layers.remove(lyr);
            }
       });
        this.impGeofootprintGeoService.clearAll();
        this.attributeService.clearAll();
        this.impGeofootprintTradeAreaService.clearAll(); //this is not working
        this.impGeofootprintLocationService.clearAll();
        this.impGeofootprintLocAttribService.clearAll();
        
        this.impProjectService.clearAll();
        this.appProjectService.clearAll();
       

        const newProject = new ImpProject();
        newProject.impGeofootprintMasters.push(new ImpGeofootprintMaster());
        this.impProjectService.add([newProject]);

        //console.log('color box values:::', this.metricService.metrics.entries());
        //I trided to clear the map, but it didnt work, need to get back later
        this.metricService.metrics.clear();
        this.metricService.add('CAMPAIGN', 'Household Count', '0');
        this.metricService.add('CAMPAIGN', 'IP Address Count', '0');
        this.metricService.add('CAMPAIGN', 'Est. Total Investment', '0');
        this.metricService.add('CAMPAIGN', 'Progress to Budget', '0');

        this.metricService.add('AUDIENCE', 'Median Household Income', '0');
        this.metricService.add('AUDIENCE', '% \'17 HHs Families with Related Children < 18 Yrs', '0');
        this.metricService.add('AUDIENCE', '% \'17 Pop Hispanic or Latino', '0');
        this.metricService.add('AUDIENCE', 'Casual Dining: 10+ Times Past 30 Days', '0');

        this.metricService.add('PERFORMANCE', 'Predicted Response', '0');
        this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', '$0');
        this.metricService.add('PERFORMANCE', 'Cost per Response', '$0');
        //remove('CAMPAIGN', 'Household Count');
    }
}

@Component({
    /* tslint:disable:component-selector */
    selector: '[app-submenu]',
    /* tslint:enable:component-selector */
    template: `
        <ng-template ngFor let-child let-i="index" [ngForOf]="(root ? item : item.items)">
            <li [ngClass]="{'active-menuitem': isActive(i)}" [class]="child.badgeStyleClass" *ngIf="child.visible === false ? false : true">
                <a [href]="child.url||'#'" (click)="itemClick($event,child,i)" (mouseenter)="onMouseEnter(i)"
                   class="ripplelink" *ngIf="!child.routerLink"
                    [attr.tabindex]="!visible ? '-1' : null" [attr.target]="child.target">
                    <i class="material-icons">{{child.icon}}</i>
                    <span>{{child.label}}</span>
                    <span class="menuitem-badge" *ngIf="child.badge">{{child.badge}}</span>
                    <i class="material-icons submenu-icon" *ngIf="child.items">keyboard_arrow_down</i>
                </a>

                <a (click)="itemClick($event,child,i)" (mouseenter)="onMouseEnter(i)" class="ripplelink" *ngIf="child.routerLink"
                    [routerLink]="child.routerLink" routerLinkActive="active-menuitem-routerlink"
                   [routerLinkActiveOptions]="{exact: true}" [attr.tabindex]="!visible ? '-1' : null" [attr.target]="child.target">
                    <i class="material-icons">{{child.icon}}</i>
                    <span>{{child.label}}</span>
                    <span class="menuitem-badge" *ngIf="child.badge">{{child.badge}}</span>
                    <i class="material-icons submenu-icon" *ngIf="child.items">keyboard_arrow_down</i>
                </a>
                <div class="layout-menu-tooltip">
                    <div class="layout-menu-tooltip-arrow"></div>
                    <div class="layout-menu-tooltip-text" [innerHTML]="child.label"></div>
                </div>
                <ul app-submenu [item]="child" *ngIf="child.items" [visible]="isActive(i)" [reset]="reset"
                    [@children]="(app.isSlim()||app.isHorizontal())&&root ? isActive(i) ?
                    'visible' : 'hidden' : isActive(i) ? 'visibleAnimated' : 'hiddenAnimated'"></ul>
            </li>
        </ng-template>
    `,
    animations: [
        trigger('children', [
            state('hiddenAnimated', style({
                height: '0px'
            })),
            state('visibleAnimated', style({
                height: '*'
            })),
            state('visible', style({
                height: '*'
            })),
            state('hidden', style({
                height: '0px'
            })),
            transition('visibleAnimated => hiddenAnimated', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)')),
            transition('hiddenAnimated => visibleAnimated', animate('400ms cubic-bezier(0.86, 0, 0.07, 1)'))
        ])
    ]
})
export class AppSubMenuComponent {

    @Input() item: MenuItem;

    @Input() root: boolean;

    @Input() visible: boolean;

    _reset: boolean;

    activeIndex: number;

    constructor(public app: AppComponent) { }

    itemClick(event: Event, item: MenuItem, index: number)  {
        if (this.root) {
            this.app.menuHoverActive = !this.app.menuHoverActive;
        }

        // avoid processing disabled items
        if (item.disabled) {
            event.preventDefault();
            return true;
        }

        // activate current item and deactivate active sibling if any
        this.activeIndex = (this.activeIndex === index) ? null : index;

        // execute command
        if (item.command) {
            item.command({ originalEvent: event, item: item });
        }

        // prevent hash change
        if (item.items || (!item.url && !item.routerLink)) {
            event.preventDefault();
        }

        // hide menu
        if (!item.items) {
            this.app.resetMenu = this.app.isHorizontal() || this.app.isSlim();
            this.app.overlayMenuActive = false;
            this.app.staticMenuMobileActive = false;
            this.app.menuHoverActive = !this.app.menuHoverActive;
        }
    }

    onMouseEnter(index: number) {
        if (this.root && this.app.menuHoverActive && (this.app.isHorizontal() || this.app.isSlim())) {
            this.activeIndex = index;
        }
    }

    isActive(index: number) : boolean {
        return this.activeIndex === index;
    }

    @Input() get reset() : boolean {
        return this._reset;
    }

    set reset(val: boolean) {
        this._reset = val;

        if (this._reset && (this.app.isHorizontal() ||  this.app.isSlim())) {
            this.activeIndex = null;
        }
    }


}
