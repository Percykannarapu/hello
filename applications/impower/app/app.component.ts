import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnInit, DoCheck, ChangeDetectionStrategy } from '@angular/core';
import { filter, take } from 'rxjs/operators';
import { AppStateService } from './services/app-state.service';
import { AppConfig } from './app.config';
import { Observable } from 'rxjs';
import { UserService } from './services/user.service';
import { ImpProject } from './val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from './val-modules/targeting/services/imp-domain-factory.service';

enum MenuOrientation {
    STATIC,
    OVERLAY,
    SLIM,
    HORIZONTAL
}

declare var jQuery: any;

@Component({
    selector: 'val-app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements AfterViewInit, OnDestroy, OnInit, DoCheck {

    layoutCompact = true;

    layoutMode: MenuOrientation = MenuOrientation.HORIZONTAL;

    darkMenu = false;

    profileMode = 'inline';

    rotateMenuButton: boolean;

    topbarMenuActive: boolean;

    overlayMenuActive: boolean;

    staticMenuDesktopInactive: boolean;

    staticMenuMobileActive: boolean;

    rightPanelActive: boolean;

    rightPanelClick: boolean;

    layoutContainer: HTMLDivElement;

    layoutMenuScroller: HTMLDivElement;

    menuClick: boolean;

    topbarItemClick: boolean;

    activeTopbarItem: any;

    resetMenu: boolean;

    menuHoverActive: boolean;

    @ViewChild('layoutContainer', { static: true }) layourContainerViewChild: ElementRef;

    @ViewChild('layoutMenuScroller', { static: true }) layoutMenuScrollerViewChild: ElementRef;


    currentProject$: Observable<ImpProject>;

    constructor(private config: AppConfig,
                private domainFactory: ImpDomainFactoryService,
                private stateService: AppStateService) { }

    ngOnInit() {
        this.currentProject$ = this.stateService.currentProject$;
    }

    ngOnDestroy() {
        jQuery(this.layoutMenuScroller).nanoScroller({flash: true});
    }

    ngAfterViewInit() {
        this.layoutContainer = <HTMLDivElement> this.layourContainerViewChild.nativeElement;
        this.layoutMenuScroller = <HTMLDivElement> this.layoutMenuScrollerViewChild.nativeElement;

        setTimeout(() => {
            jQuery(this.layoutMenuScroller).nanoScroller({flash: true});
        }, 10);
    }

    ngDoCheck() {
      this.stateService.refreshDynamicControls();
    }

    onLayoutClick() {
        if (!this.topbarItemClick) {
            this.activeTopbarItem = null;
            this.topbarMenuActive = false;
        }

        if (!this.menuClick) {
            if (this.isHorizontal() || this.isSlim()) {
                this.resetMenu = true;
            }

            if (this.overlayMenuActive || this.staticMenuMobileActive) {
                this.hideOverlayMenu();
            }

            this.menuHoverActive = false;
        }

        if (!this.rightPanelClick) {
            this.rightPanelActive = false;
        }

        this.topbarItemClick = false;
        this.menuClick = false;
        this.rightPanelClick = false;
    }

    onMenuClick($event) {
        this.menuClick = true;
        this.resetMenu = false;

        if (!this.isHorizontal()) {
            setTimeout(() => {
                jQuery(this.layoutMenuScroller).nanoScroller();
            }, 500);
        }
    }

    hideOverlayMenu() {
        this.rotateMenuButton = false;
        this.overlayMenuActive = false;
        this.staticMenuMobileActive = false;
    }

    isHorizontal() {
        return this.layoutMode === MenuOrientation.HORIZONTAL;
    }

    isSlim() {
        return this.layoutMode === MenuOrientation.SLIM;
    }
}
