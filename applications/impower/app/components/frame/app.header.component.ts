import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'val-app-header',
    template: `
        <div class="impower-header-wrapper">
          <div class="impower-header">
            <div class="logo"></div>
            <div *ngIf="username" class="user">
              <span>Welcome, {{username}}</span>
            </div>
          </div>
        </div>
    `,
    styleUrls: ['./app.header.component.scss']
})
export class AppHeaderComponent implements OnInit {

    constructor(private userService: UserService) {}

    public username: string;

    ngOnInit() {
        this.userService.userObservable.subscribe(user => {
            this.username = user.username;
        });
    }
}
