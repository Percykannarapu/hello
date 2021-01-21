import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ClearAllNotifications } from '@val/messaging';
import { UserService } from 'app/services/user.service';
import { ImpowerHelpOpen } from 'app/state/menu/menu.actions';
import { MessageService } from 'primeng/api';
import { Subject, timer } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppStateService } from '../../services/app-state.service';
import { FullAppState } from '../../state/app.interfaces';
import { getRouteUrl } from '../../state/shared/router.interfaces';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpDomainFactoryService } from '../../val-modules/targeting/services/imp-domain-factory.service';

enum MenuOrientation {
  STATIC,
  OVERLAY,
  SLIM,
  HORIZONTAL
}

@Component({
  templateUrl: './impower-main.component.html',
  styleUrls: ['./impower-main.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImpowerMainComponent implements OnInit, OnDestroy {

  layoutMode: MenuOrientation = MenuOrientation.HORIZONTAL;
  layoutCompact = true;
  darkMenu = false;
  overlayMenuActive: boolean;
  staticMenuDesktopInactive: boolean;
  staticMenuMobileActive: boolean;
  resetMenu: boolean;
  menuHoverActive: boolean;
  currentProject: ImpProject;

  menuTypes = MenuOrientation;

  private rotateMenuButton: boolean;
  private topBarMenuActive: boolean;
  private rightPanelActive: boolean;
  private rightPanelClick: boolean;
  private menuClick: boolean;
  private topBarItemClick: boolean;
  private activeTopBarItem: any;
  private currentRoute: string = '';
  private destroyed$ = new Subject<void>();

  constructor(private config: AppConfig,
              private domainFactory: ImpDomainFactoryService,
              private stateService: AppStateService,
              private userService: UserService,
              private messageService: MessageService,
              private store$: Store<FullAppState>,
              private cd: ChangeDetectorRef) { }

  ngOnInit() : void {
    this.stateService.currentProject$.pipe(
      takeUntil(this.destroyed$),
      filter(project => project != null)
    ).subscribe(project => {
      this.currentProject = project;
      this.cd.markForCheck();
    });
    this.store$.select(getRouteUrl).pipe(
      takeUntil(this.destroyed$),
      filter(url => url != null)
    ).subscribe(url => {
      this.currentRoute = url;
      this.cd.markForCheck();
    });
    this.messageService.messageObserver.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.cd.markForCheck();
    });

    timer(0, 1000).pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => this.stateService.refreshDynamicControls());
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onClearMessages() {
    this.store$.dispatch(new ClearAllNotifications());
  }

  getHelpPopup(event: any){
    if (this.userService.userHasGrants(['IMPOWER_INTERNAL_FEATURES'])){
      const internal = 'http://myvalassis/da/ts/imPower%20Resources/Forms/AllItems.aspx';
      window.open(internal, '_blank');
    }
    else{
      this.store$.dispatch(new ImpowerHelpOpen(event));
    }
  }

  onLayoutClick() {
    if (!this.topBarItemClick) {
      this.activeTopBarItem = null;
      this.topBarMenuActive = false;
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

    this.topBarItemClick = false;
    this.menuClick = false;
    this.rightPanelClick = false;
  }

  onMenuClick() {
    this.menuClick = true;
    this.resetMenu = false;
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
