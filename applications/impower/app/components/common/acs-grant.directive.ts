/* tslint:disable:directive-selector */
import { Directive, ElementRef, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { isArray, isNil } from '@val/common';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { DEFAULT_GRANT_TYPE, GrantType, UserService } from '../../services/user.service';
import { LoggingService } from '../../val-modules/common/services/logging.service';

@Directive({
  selector: '[acsGrant]'
})
export class AcsGrantDirective implements OnInit, OnDestroy {

  private isHidden = true;
  private requiredGrants: string[] = [];
  private grantType: GrantType = DEFAULT_GRANT_TYPE;

  private fireUpdate$ = new Subject<void>();
  private destroyed$ = new Subject<void>();

  @Input() set acsGrant(value: string | string[]) {
    if (isNil(value)) {
      this.requiredGrants = [];
    } else if (isArray(value)) {
      this.requiredGrants = [ ...value ];
    } else {
      this.requiredGrants = [ value ];
    }
    this.fireUpdate$.next();
  }

  @Input() set acsGrantType(value: GrantType) {
    this.grantType = value || DEFAULT_GRANT_TYPE;
    this.fireUpdate$.next();
  }

  constructor(private element: ElementRef,
              private templateRef: TemplateRef<any>,
              private viewContainer: ViewContainerRef,
              private userService: UserService,
              private logger: LoggingService) { }

  ngOnInit() : void {
    this.fireUpdate$.pipe(
      takeUntil(this.destroyed$),
      debounceTime(5)
    ).subscribe(() => this.updateView());
    this.userService.userObservable.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => this.fireUpdate$.next());
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  private updateView() : void {
    const grantInfo = { requiredGrants: this.requiredGrants, grantType: this.grantType };
    if (this.userHasGrants()) {
      if (this.isHidden) {
        this.logger.debug.log('User has ACS Grants', grantInfo);
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
    } else {
      this.logger.debug.log('User does not have ACS Grants', grantInfo);
      this.isHidden = true;
      this.viewContainer.clear();
    }
  }

  private userHasGrants() : boolean {
    return this.userService.userHasGrants(this.requiredGrants, this.grantType);
  }
}
