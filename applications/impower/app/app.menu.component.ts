import { Component, Input, OnInit } from '@angular/core';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { MenuItem } from 'primeng/primeng';
import { AppComponent } from './app.component';
import { Store } from '@ngrx/store';
import { ShowConfirmation } from './messaging';
import {
  DiscardAndCreateNew,
  ExportApioNationalData,
  ExportGeofootprint,
  ExportLocations,
  ExportToValassisDigital,
  OpenExistingProjectDialog,
  SaveAndCreateNew,
  SaveAndReloadProject } from './state/menu/menu.actions';
import { ConfirmationPayload } from './messaging/state/confirmation/confirmation.actions';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from './val-modules/targeting/targeting.enums';
import { LocalAppState } from './state/app.interfaces';

@Component({
    /* tslint:disable:component-selector */
    selector: 'app-menu',
    /* tslint:enable:component-selector */
    template: `<ul app-submenu [item]="model" [root]="true" class="ultima-menu ultima-main-menu clearfix" [reset]="reset" [visible]="true"></ul>`
})
export class AppMenuComponent implements OnInit {
    @Input() reset: boolean;
    model: MenuItem[];

    constructor(private store$: Store<LocalAppState>) { }

    ngOnInit() {
        this.model = [
            { label: 'Dashboard', icon: 'dashboard', routerLink: ['/'] },
            { label: 'Save', icon: 'save', command: () => this.store$.dispatch(new SaveAndReloadProject()) },
            { label: 'Projects', icon: 'storage',
              items: [
                  { label: 'Create New', icon: '', command: () =>  this.createNewProject() },
                  { label: 'Open Existing', icon: 'grid-on', command: () => this.store$.dispatch(new OpenExistingProjectDialog()) },
                  { label: 'Save', icon: 'save', command: () => this.store$.dispatch(new SaveAndReloadProject()) }
              ]
            },
            { label: 'Export', icon: 'file_download',
              items: [
                  { label: 'Export Geofootprint - All', icon: 'map', command: () => this.store$.dispatch(new ExportGeofootprint({ selectedOnly: false })) },
                  { label: 'Export Geofootprint - Selected Only', icon: 'map', command: () => this.store$.dispatch(new ExportGeofootprint({ selectedOnly: true })) },
                  { label: 'Export Sites', icon: 'store', command: () => this.exportLocations(ImpClientLocationTypeCodes.Site) },
                  { label: 'Export Competitors', icon: 'store', command: () => this.exportLocations(ImpClientLocationTypeCodes.Competitor) },
                  { label: 'Export Online Audience National Data', icon: 'group', command: () => this.store$.dispatch(new ExportApioNationalData()) },
                  { label: 'Send Custom Sites to Valassis Digital', icon: 'group', command: () => this.store$.dispatch(new ExportToValassisDigital()) }
              ]
            }
        ];
    }

    private exportLocations(locationType: SuccessfulLocationTypeCodes) : void {
      this.store$.dispatch(new ExportLocations({ locationType }));
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
    /* tslint:disable:component-selector */
    selector: '[app-submenu]',
    /* tslint:enable:component-selector */
    template: `
      <ng-template ngFor let-child let-i="index" [ngForOf]="(root ? item : item.items)">
        <li [ngClass]="{'active-menuitem': isActive(i)}" [class]="child.badgeStyleClass" *ngIf="child.visible !== false">
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
