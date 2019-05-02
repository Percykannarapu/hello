import { Component, OnInit } from '@angular/core';
import { UserService } from './services/user.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from './state/app.interfaces';
import { ClearAllNotifications } from '@val/messaging';
@Component({
    selector: 'val-app-topbar',
    template: `
        <div class="topbar clearfix">
            <div class="topbar-left">
                <div class="logo"></div>
            </div>
            <div class="topbar-right">
              <ul class="topbar-items">
                <li *ngIf="username"><span style="color: white">Welcome, {{username}}</span></li>
                <li>
                  <a href="#" name="clearMessages"  (click)="onClearMessages()" pTooltip="Clear all Messages">
                    <i class="topbar-icon material-icons" style="margin-top: -0.3em; font-size: 2em">cancel</i>
                  </a>
                </li>
              </ul>
            </div>
        </div>
    `
})
export class AppTopbarComponent implements OnInit{

    constructor(private userService: UserService,
                private store$: Store<LocalAppState>) {}

    public username: string;

    ngOnInit() {
        this.userService.userObservable.subscribe(user => {
            this.username = user.username;
        });
    }

    onClearMessages() {
      this.store$.dispatch(new ClearAllNotifications());
    }
}
