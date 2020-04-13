import { Component } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ClearAllNotifications, ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { from, Observable, of, throwError } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { User } from '../../models/User';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../../state/app.interfaces';
import { OauthConfiguration, RestDataService } from '../../val-modules/common/services/restdata.service';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
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
    const authError = {notificationTitle: 'Login Error', message: `Please check your username and password and try again \n
    TIP: @valassis.com should NOT be included as part of the Username`};
    const userError = { message: 'Unable to look up user info', notificationTitle: 'Login Error' };
    const username = loginForm.value.username;
    const pass = loginForm.value.password;
    if (username === '' || pass === '') {
      this.store$.dispatch(new ErrorNotification({ message: 'You must enter both a username and password', notificationTitle: 'Login Error' }));
      return;
    }
    loginForm.form.disable({ emitEvent: false });
    this.store$.dispatch(new ClearAllNotifications());
    this.store$.dispatch(new StartBusyIndicator({ key: this.spinnerKey, message: this.spinnerMessage }));

    this.authService.authenticate(username, pass).pipe(
      switchMap(result => result
        ? this.configOauthAndFetchUserId(username).pipe(catchError(err => throwError({ ...authError, additionalErrorInfo: err })))
        : throwError(authError)),
      switchMap(user => user != null
        ? this.createUserAndNavigate(username, user).pipe(catchError(err => throwError({ ...userError, additionalErrorInfo: err })))
        : throwError(userError)),
      catchError(err => of(this.store$.dispatch(new ErrorNotification(err)))),
      tap(() => {
        loginForm.form.enable({ emitEvent: false });
        this.store$.dispatch(new StopBusyIndicator({ key: this.spinnerKey }));
      }),
    ).subscribe();
  }

  private configOauthAndFetchUserId(username: string) {
    const config: OauthConfiguration = new OauthConfiguration();
    config.oauthToken = this.authService.getOauthToken();
    config.tokenExpiration = this.authService.getTokenExpiration();
    config.tokenRefreshFunction = () => this.authService.refreshToken();
    RestDataService.bootstrap(config);
    return this.userService.fetchUserRecord(username);
  }

  private createUserAndNavigate(username: string, user: User) : Observable<any> {
    user.clientName = null;
    user.creationDate = null;
    user.deactivationDate = null;
    user.email = null;
    user.username = username;
    user.userRoles = null;
    this.userService.setUser(user);
    this.userService.storeUserCookie(user);
    return from(this.router.navigate(['/']));
  }

}
