import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'val-app-header',
  template: `
    <div class="impower-header-wrapper">
      <div class="impower-header">
        <div class="logo"></div>
        <div class="announcement" *acsGrant="['IMPOWER_INTERNAL_FEATURES']">
          <p-messages severity="error" styleClass="val-no-message-padding p-shadow-4">
            <ng-template pTemplate>
              <div class="p-p-2 p-d-flex p-ai-center">
                <i class="pi pi-exclamation-circle p-mr-2" style="font-size: 2rem"></i>
                <span class="message">
                  Please Note: Distribution has changed. Users should reference the <a target="_blank" [href]="linkAddress">'{{linkName}}' file</a>
                  to ensure all desired geographies and distribution methods are included.
                </span>
              </div>
            </ng-template>
          </p-messages>
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

  username: string;
  linkAddress = 'http://myvalassis/Sales%20%20Marketing/marketplanning/marketreach/2020%20Direct%20Mail%20Optimization/Forms/AllItems.aspx';
  linkName = '2021 Market Optimizations';

  constructor(private userService: UserService) {}

  ngOnInit() {
    this.userService.userObservable.subscribe(user => {
      this.username = user.displayName ?? user.username ?? user.email;
    });
  }
}
