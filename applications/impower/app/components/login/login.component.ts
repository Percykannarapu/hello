import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/User';
import { DataStoreServiceConfiguration, DataStore } from '../../val-modules/common/services/datastore.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '../../messaging';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  private spinnerKey = 'LoginComponentKey';
  private spinnerMessage = 'Authenticating';

  constructor(private router: Router,
              private authService: AuthService,
              private store$: Store<LocalAppState>,
              private userService: UserService) { }

  /**
   * Handle the user authentication request, this is done by invoking the auth service
   * @param loginForm the login form data from the UI
   */
  public onSubmit(loginForm: NgForm) {
    if (loginForm.value.username === '' || loginForm.value.password === '') {
      this.store$.dispatch(new ErrorNotification({ message: 'You must enter both a username and password', notificationTitle: 'Login Error' }));
      return;
    }
    this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: this.spinnerMessage }));
    this.authService.authenticate(loginForm.value.username, loginForm.value.password).subscribe(authenticated => {
      if (authenticated) {
          this.bootstrapDataStore();
          this.fetchUserInfo(loginForm.value.username);
      } else {
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
        this.store$.dispatch(new ErrorNotification({ message: 'Please check your username and password and try again', notificationTitle: 'Login Error' }));
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
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
        this.router.navigate(['/']);
      } else {
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
        this.store$.dispatch(new ErrorNotification({ message: 'Unable to look up user info', notificationTitle: 'Login Error' }));
      }
    }, err => {
      this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      this.store$.dispatch(new ErrorNotification({ message: 'Unable to look up user info', notificationTitle: 'Login Error' }));
      console.error('Unable to look up user info', err);
    });
  }

  /**
   * Boostrap the data store with the oauth token that was acquired on login
   */
  private bootstrapDataStore() {
    const config: DataStoreServiceConfiguration = new DataStoreServiceConfiguration();
    config.oauthToken = this.authService.getOauthToken();
    config.tokenExpiration = this.authService.getTokenExpiration();
    config.tokenRefreshFunction = () => this.authService.refreshToken();
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
