import { Component, AfterViewInit, ElementRef, ViewChild, OnDestroy, OnInit, DoCheck, ChangeDetectionStrategy } from '@angular/core';
import { AppStateService } from './services/app-state.service';
import { AppConfig } from './app.config';
import { Observable } from 'rxjs';
import { ImpProject } from './val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from './val-modules/targeting/services/imp-domain-factory.service';
import { LocalAppState } from './state/app.interfaces';
import { select, Store } from '@ngrx/store';
import { selectors } from '@val/messaging';
import { CreateNewProject } from './state/data-shim/data-shim.actions';

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

    @ViewChild('layoutContainer') layourContainerViewChild: ElementRef;

    @ViewChild('layoutMenuScroller') layoutMenuScrollerViewChild: ElementRef;

    public currentSpinnerMessage$: Observable<string>;
    public currentSpinnerState$: Observable<boolean>;

    currentProject$: Observable<ImpProject>;

    constructor(private config: AppConfig,
                private domainFactory: ImpDomainFactoryService,
                private stateService: AppStateService,
                private store$: Store<LocalAppState>) { }

    ngOnInit() {
        console.log('app.component.ngOnInit - Fired');
        this.currentSpinnerMessage$ = this.store$.pipe(select(selectors.busyIndicatorMessage));
        this.currentSpinnerState$ = this.store$.pipe(select(selectors.showBusyIndicator));
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

    onMenuButtonClick(event) {
        this.menuClick = true;
        this.rotateMenuButton = !this.rotateMenuButton;
        this.topbarMenuActive = false;

        if (this.layoutMode === MenuOrientation.OVERLAY) {
            this.overlayMenuActive = !this.overlayMenuActive;
        } else {
            if (this.isDesktop()) {
                this.staticMenuDesktopInactive = !this.staticMenuDesktopInactive; } else {
                this.staticMenuMobileActive = !this.staticMenuMobileActive; }
        }

        event.preventDefault();
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

    onTopbarMenuButtonClick(event) {
        this.topbarItemClick = true;
        this.topbarMenuActive = !this.topbarMenuActive;

        this.hideOverlayMenu();

        event.preventDefault();
    }

    onTopbarItemClick(event, item) {
        this.topbarItemClick = true;

        if (this.activeTopbarItem === item) {
            this.activeTopbarItem = null; } else {
            this.activeTopbarItem = item; }

        event.preventDefault();
    }

    onRightPanelButtonClick(event) {
        this.rightPanelClick = true;
        this.rightPanelActive = !this.rightPanelActive;
        event.preventDefault();
    }

    onRightPanelClick() {
        this.rightPanelClick = true;
    }

    hideOverlayMenu() {
        this.rotateMenuButton = false;
        this.overlayMenuActive = false;
        this.staticMenuMobileActive = false;
    }

    isTablet() {
        const width = window.innerWidth;
        return width <= 1024 && width > 640;
    }

    isDesktop() {
        return window.innerWidth > 1024;
    }

    isMobile() {
        return window.innerWidth <= 640;
    }

    isOverlay() {
        return this.layoutMode === MenuOrientation.OVERLAY;
    }

    isHorizontal() {
        return this.layoutMode === MenuOrientation.HORIZONTAL;
    }

    isSlim() {
        return this.layoutMode === MenuOrientation.SLIM;
    }

    changeToStaticMenu() {
        this.layoutMode = MenuOrientation.STATIC;
    }

    changeToOverlayMenu() {
        this.layoutMode = MenuOrientation.OVERLAY;
    }

    changeToHorizontalMenu() {
        this.layoutMode = MenuOrientation.HORIZONTAL;
    }

    changeToSlimMenu() {
        this.layoutMode = MenuOrientation.SLIM;
    }

}
