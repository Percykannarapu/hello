import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
    selector: 'val-app-header',
    template: `
        <div class="impower-header-wrapper">
          <div class="impower-header">
            <div class="logo"></div>
            <div class="announcement" *acsGrant="['IMPOWER_INTERNAL_FEATURES']">
              <span>
                Please Note: Distribution has changed. Users should reference the
                <a target="_blank" href="http://myvalassis/Sales%20%20Marketing/marketplanning/marketreach/2021%20Direct%20Mail%20Footprint/Forms/AllItems.aspx?InitialTabId=Ribbon.Library&VisibilityContext=WSSListAndLibrary">'2021 Zip-ATZ Closures-Reductions-ATZ Footprint ...' file</a>
                to ensure all desired geographies and distribution methods are included.
              </span>
            </div>
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
