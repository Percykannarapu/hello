/* tslint:disable:component-selector */
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ConfirmationPayload, ErrorNotification, ShowConfirmation } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { CreateMapExportUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { MenuItem } from 'primeng/api';
import { filter, take } from 'rxjs/operators';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../../state/app.interfaces';
import { OpenBatchMapDialog } from '../../state/batch-map/batch-map.actions';
import { DiscardAndCreateNew, ExportApioNationalData, ExportGeofootprint, ExportLocations, ExportToValassisDigital, OpenExistingProjectDialog, OpenPrintViewDialog, SaveAndCreateNew, SaveAndReloadProject } from '../../state/menu/menu.actions';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { ImpowerMainComponent } from '../impower-main/impower-main.component';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { BatchMapService } from 'app/services/batch-map.service';

@Component({
    selector: 'app-menu',
    template: `<ul app-submenu [item]="model" [root]="true" class="ultima-menu ultima-main-menu clearfix" [reset]="reset" [visible]="isLoggedIn"></ul>`
})
export class AppMenuComponent implements OnInit {
    @Input() reset: boolean;
    model: MenuItem[];
    isLoggedIn: boolean = false;

    constructor(private store$: Store<LocalAppState>,
                private userService: UserService,
                private stateService: AppStateService,
                private locationService: ImpGeofootprintLocationService,
                private batchService: BatchMapService) { }

    ngOnInit() {
        this.userService.userObservable.pipe(
          filter(user => user != null && user.username != null && user.username.length > 0),
          take(1)
        ).subscribe(() => this.isLoggedIn = true);

        this.model = [
            { label: 'Dashboard', icon: 'ui-icon-dashboard', routerLink: ['/'] },
            { label: 'Save', id: 'saveProject', icon: 'ui-icon-save', command: () => this.saveProject() },
            { label: 'Projects', icon: 'ui-icon-storage',
              items: [
                  { label: 'Create New', icon: 'fa fa-files-o', command: () =>  this.createNewProject() },
                  { label: 'Open Existing', icon: 'fa fa-folder-open-o', command: () => this.store$.dispatch(new OpenExistingProjectDialog()) },
                  { label: 'Save', icon: 'fa fa-floppy-o', command: () => this.saveProject() }
              ]
            },
            { label: 'Export', icon: 'ui-icon-file-download',
              items: [
                  { label: 'Export Geofootprint - All', icon: 'ui-icon-map', command: () => this.store$.dispatch(new ExportGeofootprint({ selectedOnly: false })) },
                  { label: 'Export Geofootprint - Selected Only', icon: 'ui-icon-map', command: () => this.store$.dispatch(new ExportGeofootprint({ selectedOnly: true })) },
                  { label: 'Export Sites', icon: 'ui-icon-store', command: () => this.exportLocations(ImpClientLocationTypeCodes.Site) },
                  { label: 'Export Competitors', icon: 'ui-icon-store', command: () => this.exportLocations(ImpClientLocationTypeCodes.Competitor) },
                  { label: 'Export Online Audience National Data', icon: 'ui-icon-group', command: () => this.store$.dispatch(new ExportApioNationalData()) },
                  { label: 'Send Custom Sites to Valassis Digital', icon: 'ui-icon-group', command: () => this.store$.dispatch(new ExportToValassisDigital()) },
                  { label: 'Export Current Map View', icon: 'pi pi-print', command: () => this.exportCurrentView() },
                  { label: 'Create Site Maps', icon: 'fa fa-book', command: () => this.createBatchMap() }
              ]
            }
        ];
    }

    private saveProject(){
        this.stateService.closeOverlays();
        setTimeout(() => {
            this.store$.dispatch(new SaveAndReloadProject());
        }, 500);
    }

    private exportLocations(locationType: SuccessfulLocationTypeCodes) : void {
      this.store$.dispatch(new ExportLocations({ locationType }));
    }

    private exportCurrentView(){
      const analysisLevel = this.stateService.analysisLevel$.getValue();
      if (analysisLevel != null && analysisLevel.length > 0){
        this.store$.dispatch(new CreateMapExportUsageMetric('targeting', 'map' , 'current~view~map~export', 1));
        this.store$.dispatch(new OpenPrintViewDialog());
      }
      else
        this.store$.dispatch(new ErrorNotification({message: 'Analysis Level is required to print Current view'}));
    }

    private createBatchMap(){
      const currentProject = this.stateService.currentProject$.getValue();
      const isProjectSaved = this.batchService.validateProjectReadiness(currentProject);
      if (isProjectSaved) {
        this.store$.dispatch(new CreateMapExportUsageMetric('targeting', 'map' , 'batch~map', this.locationService.get().length));
        this.store$.dispatch(new OpenBatchMapDialog());
      }
    }

    public createNewProject() {
      const payload: ConfirmationPayload = {
        title: 'Save Work',
        message: 'Would you like to save your work before proceeding?',
        canBeClosed: false,
        accept: {
          result: new SaveAndCreateNew()
        },
        reject: {
          result: new DiscardAndCreateNew()
        }
      };
      this.store$.dispatch(new ShowConfirmation(payload));
    }
}

@Component({
    selector: '[app-submenu]',
    template: `
      <ng-template ngFor let-child let-i="index" [ngForOf]="(root ? item : item.items)">
        <li [ngClass]="{'active-menuitem': isActive(i)}" [class]="child.badgeStyleClass" *ngIf="child.visible !== false">
          <a [href]="child.url||'#'" (click)="itemClick($event,child,i)" (mouseenter)="onMouseEnter(i)"
             class="ripplelink" *ngIf="!child.routerLink"
             [attr.tabindex]="!visible ? '-1' : null" [attr.target]="child.target">
            <i class="{{child.icon}}"></i>
            <span>{{child.label}}</span>
            <span class="menuitem-badge" *ngIf="child.badge">{{child.badge}}</span>
            <i class="material-icons submenu-icon" *ngIf="child.items">keyboard_arrow_down</i>
          </a>

          <a (click)="itemClick($event,child,i)" (mouseenter)="onMouseEnter(i)" class="ripplelink" *ngIf="child.routerLink"
             [routerLink]="child.routerLink" routerLinkActive="active-menuitem-routerlink"
             [routerLinkActiveOptions]="{exact: true}" [attr.tabindex]="!visible ? '-1' : null" [attr.target]="child.target">
            <i class="{{child.icon}}"></i>
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

    constructor(public app: ImpowerMainComponent) { }

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
