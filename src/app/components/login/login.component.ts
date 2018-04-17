import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/User';
import { DataStoreServiceConfiguration, DataStore } from '../../val-modules/common/services/datastore.service';
import { AppMessagingService } from '../../services/app-messaging.service';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  private spinnerKey = 'LoginComponentKey';
  private spinnerMessage = 'Authenticating';

  constructor(private router: Router,
              private authService: AuthService,
              private messageService: AppMessagingService,
              private userService: UserService) { }

  ngOnInit() {
  }

  /**
   * Handle the user authentication request, this is done by invoking the auth service
   * @param loginForm the login form data from the UI
   */
  public onSubmit(loginForm: NgForm) {
    if (loginForm.value.username === '' || loginForm.value.password === '') {
      this.messageService.showGrowlError('Login Error', 'You must enter both a username and password');
      return;
    }
    this.messageService.startSpinnerDialog(this.spinnerKey, this.spinnerMessage);
    this.authService.authenticate(loginForm.value.username, loginForm.value.password).subscribe(authenticated => {
      if (authenticated) {
          this.fetchUserInfo(loginForm.value.username);
      }
      else {
        this.messageService.stopSpinnerDialog(this.spinnerKey);
        this.messageService.showGrowlError('Login Error', 'Please check your username and password and try again');
      }
    });

  }

  /**
   * Lookup the AM_USER record from the Fuse service
   * @param username
   */
  private fetchUserInfo(username: string) {
    this.userService.fetchUserRecord(username).subscribe(user => {
      if (user != null) {
        this.createUser(username, user);
        this.bootstrapDataStore();
        this.messageService.stopSpinnerDialog(this.spinnerKey);
        this.router.navigate(['/']);
      } else {
        this.messageService.showGrowlError('Login Error', 'Unable to look up user info');
        this.messageService.stopSpinnerDialog(this.spinnerKey);
      }
    }, err => {
      this.messageService.showGrowlError('Login Error', 'Unable to look up user info');
      this.messageService.stopSpinnerDialog(this.spinnerKey);
    });
  }

  /**
   * Boostrap the data store with the oauth token that was acquired on login
   */
  private bootstrapDataStore() {
    const config: DataStoreServiceConfiguration = new DataStoreServiceConfiguration();
    config.oauthToken = this.authService.getOauthToken();
    config.tokenExpiration = this.authService.getTokenExpiration();
    config.tokenRefreshFunction = this.authService.refreshToken;
    DataStore.bootstrap(config);
  }

  private createUser(username: string, user: User) {
    user.clientName = null;
    user.creationDate = null;
    user.deactivationDate = null;
    user.email = null;
    user.username = username;
    user.userRoles = null;
    this.userService.setUser(user);
    this.userService.storeUserCookie(user);
  }

}
