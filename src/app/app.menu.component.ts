import {Component, Input, OnInit} from '@angular/core';
import {trigger, state, style, transition, animate} from '@angular/animations';
import {MenuItem} from 'primeng/primeng';
import {AppComponent} from './app.component';
import {ImpGeofootprintGeoService, EXPORT_FORMAT_IMPGEOFOOTPRINTGEO} from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION } from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpMetricName } from './val-modules/metrics/models/ImpMetricName';
import { UsageService } from './services/usage.service';
import { ImpDiscoveryService } from './services/ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from './models/ImpDiscoveryUI';
import { MetricService } from './val-modules/common/services/metric.service';

@Component({
    /* tslint:disable:component-selector */
    selector: 'app-menu',
    /* tslint:enable:component-selector */
    template: `
        <ul app-submenu [item]="model" root="true" class="ultima-menu ultima-main-menu clearfix" [reset]="reset" visible="true"></ul>
    `
})
export class AppMenuComponent implements OnInit {

    @Input() reset: boolean;

    model: any[];

    constructor(public app: AppComponent,
               public impGeofootprintGeoService: ImpGeofootprintGeoService,
               public impGeofootprintLocationService: ImpGeofootprintLocationService,
               public usageService: UsageService,
               public impDiscoveryService: ImpDiscoveryService,
               public metricService: MetricService) {}

    ngOnInit() {
        this.model = [
            {label: 'Dashboard', icon: 'dashboard', routerLink: ['/']},
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
                label: 'Export', icon: 'file_download',
                items: [
                    {label: 'Export Geofootprint', icon: 'map', command: () => this.getGeofootprint() },
                    {label: 'Export Sites', value: 'Site', icon: 'store', command: () => {this.getSites(); } },
                    {label: 'Export Competitors', value: 'Competitor', icon: 'store', command: () => {this.getCompetitor(); }}
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
        const themeLink: HTMLLinkElement = <HTMLLinkElement> document.getElementById('theme-css');
        const layoutLink: HTMLLinkElement = <HTMLLinkElement> document.getElementById('layout-css');

        themeLink.href = 'assets/theme/theme-' + theme + '.css';
        layoutLink.href = 'assets/layout/css/layout-' + theme + '.css';
    }

    public getSites(){
        this.impGeofootprintLocationService.exportStore(null, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, loc => loc.clientLocationTypeCode === 'Site', 'SITES');
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'site-list', action: 'export' });
            this.usageService.createCounterMetric(usageMetricName, null, this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Site').length);
    }
    public getCompetitor(){
       this.impGeofootprintLocationService.exportStore(null, EXPORT_FORMAT_IMPGEOFOOTPRINTLOCATION.alteryx, loc => loc.clientLocationTypeCode === 'Competitor', 'COMPETITORS');
       const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'competitor-list', action: 'export' });
       this.usageService.createCounterMetric(usageMetricName, null, this.impGeofootprintLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Competitor').length);
    }
    public getGeofootprint(){
      this.impGeofootprintGeoService.exportStore(null, EXPORT_FORMAT_IMPGEOFOOTPRINTGEO.alteryx);
        // update the metric count when export geos
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'geofootprint', action: 'export' });
      this.usageService.createCounterMetric(usageMetricName, null, this.impGeofootprintGeoService.get().length);

      //this.discoveryUseageMetricService.createDiscoveryMetric('location-geofootprint-export');
      //this.discoveryUseageMetricService.createColorBoxMetrics('location-geofootprint-export');
      const counterMetricsDiscover = this.impDiscoveryService.discoveryUsageMetricsCreate('location-geofootprint-export');
      const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate('location-geofootprint-export');

     // console.log('counterMetricsColorBox:::', counterMetricsColorBox);

      this.usageService.createCounterMetrics(counterMetricsDiscover);
      this.usageService.createCounterMetrics(counterMetricsColorBox);


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
                    <div class="layout-menu-tooltip-text">{{child.label}}</div>
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

    constructor(public app: AppComponent) {}

    itemClick(event: Event, item: MenuItem, index: number) {
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
            item.command({originalEvent: event, item: item});
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

        if (this._reset && (this.app.isHorizontal() || this.app.isSlim())) {
            this.activeIndex = null;
        }
    }

    
}
