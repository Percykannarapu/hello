/* tslint:disable:directive-selector */
import { Directive, ElementRef, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, TemplateRef, ViewContainerRef } from '@angular/core';
import { isArray, isNil } from '@val/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DEFAULT_GRANT_TYPE, GrantType, UserService } from '../../services/user.service';
import { LoggingService } from '../../val-modules/common/services/logging.service';

@Directive({
  selector: '[acsGrant]'
})
export class AcsGrantDirective implements OnInit, OnDestroy, OnChanges {

  private isHidden = true;
  private destroyed$ = new Subject<void>();

  @Input() acsGrant: string | string[];
  @Input() acsGrantType: GrantType = DEFAULT_GRANT_TYPE;

  constructor(private element: ElementRef,
              private templateRef: TemplateRef<any>,
              private viewContainer: ViewContainerRef,
              private userService: UserService,
              private logger: LoggingService) { }

  ngOnInit() : void {
    this.userService.userObservable.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => this.updateView());
    this.updateView();
  }

  ngOnChanges(changes: SimpleChanges) : void {
    this.updateView();
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  private updateView() : void {
    const grantType = this.acsGrantType || DEFAULT_GRANT_TYPE;
    let requiredGrants: string[];
    if (isNil(this.acsGrant)) {
      requiredGrants = [];
    } else if (isArray(this.acsGrant)) {
      requiredGrants = [ ...this.acsGrant ];
    } else {
      requiredGrants = [ this.acsGrant ];
    }
    const grantInfo = { requiredGrants, grantType };
    if (this.userHasGrants(requiredGrants, grantType)) {
      if (this.isHidden) {
        this.logger.debug.log('User has ACS Grants', grantInfo);
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isHidden = false;
      }
    } else {
      this.logger.debug.log('User does not have ACS Grants', grantInfo);
      this.viewContainer.clear();
      this.isHidden = true;
    }
  }

  private userHasGrants(requiredGrants: string[], grantType: GrantType) : boolean {
    return this.userService.userHasGrants(requiredGrants, grantType);
  }
}
