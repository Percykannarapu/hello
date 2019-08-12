import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../state/app.interfaces';
import { ClearAllNotifications } from '@val/messaging';

@Component({
    selector: 'val-app-header',
    template: `
        <div class="impower-header-wrapper">
          <div class="impower-header">
            <div class="logo"></div>
            <div *ngIf="username">
              <a href="#" (click)="onClearMessages()" pTooltip="Clear all Messages" class="user">
                <i class="fa fa-times-circle"></i>
                <span>Welcome, {{username}}</span>
              </a>
            </div>
          </div>
        </div>
    `,
    styleUrls: ['./app.header.component.scss']
})
export class AppHeaderComponent implements OnInit {

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
