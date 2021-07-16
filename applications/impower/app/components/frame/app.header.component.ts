import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'val-app-header',
  templateUrl: './app.header.component.html',
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
