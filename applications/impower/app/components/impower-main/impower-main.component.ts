import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ClearAllNotifications } from '@val/messaging';
import { MessageService } from 'primeng/api';
import { Observable, timer } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';
import { getRouteUrl } from '../../state/shared/router.interfaces';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../../val-modules/targeting/services/imp-domain-factory.service';
import { UserService } from 'app/services/user.service';

enum MenuOrientation {
  STATIC,
  OVERLAY,
  SLIM,
  HORIZONTAL
}

declare var jQuery: any;

@Component({
  templateUrl: './impower-main.component.html',
  styleUrls: ['./impower-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpowerMainComponent implements AfterViewInit, OnDestroy, OnInit {

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
  currentRoute: string = '';

  constructor(private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private stateService: AppStateService,
              private messageService: MessageService,
              private cd: ChangeDetectorRef,
              private store$: Store<FullAppState>,
              private userService: UserService) { }

  ngOnInit() {
    this.currentProject$ = this.stateService.currentProject$;
    this.store$.select(getRouteUrl).pipe(
      filter(url => url != null)
    ).subscribe(url => {
      this.currentRoute = url;
      this.cd.markForCheck();
    });

    timer(0, 1000).subscribe(() => this.stateService.refreshDynamicControls());

    this.messageService.messageObserver.subscribe(() => this.cd.markForCheck());
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

  onClearMessages() {
    this.store$.dispatch(new ClearAllNotifications());
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
