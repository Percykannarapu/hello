import { Component, OnInit } from '@angular/core';
import { AuthService } from 'app/services/auth.service';
import { UserService } from 'app/services/user.service';
import { Router } from '@angular/router';
import { AppLoggingService } from 'app/services/app-logging.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';

@Component({
  selector: 'val-auth-callback',
  templateUrl: './auth-callback.component.html',
  styleUrls: ['./auth-callback.component.scss']
})
export class AuthCallbackComponent implements OnInit {

  public userData: any;

  constructor(private authService: AuthService,
              private router: Router,
              private userService: UserService,
              private logger: AppLoggingService,
              private store: Store<LocalAppState>) { }

  ngOnInit() {
    this.authService.completeAuthentication().subscribe(user => {
      if (this.authService.isLoggedIn()) {
        this.router.navigate(['/']);
      }
    });
  }

  public getUserData() {
    this.userData = this.authService.getClaims();
  }

}
