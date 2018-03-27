import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { MessageService } from 'primeng/components/common/messageservice';
import { UserService } from '../../services/user.service';
import { User } from '../../models/User';
import { ImpGeofootprintMaster } from '../../val-modules/targeting/models/ImpGeofootprintMaster';
import { GeofootprintMaster } from '../../models/GeofootprintMaster';
import { GeocoderService } from '../../services/geocoder.service';
import { GeoFootPrint } from '../../services/geofootprint.service';
import { AppConfig } from '../../app.config';
import { DataStoreServiceConfiguration, DataStore } from '../../val-modules/common/services/datastore.service';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  public displayLoginSpinner: boolean = false;
  public growlMessages: string[] = new Array<string>();

  constructor(private router: Router,
              private authService: AuthService,
              private messageService: MessageService,
              private userService: UserService,
              private geocoderService: GeocoderService,
              private geoFootPrintService: GeoFootPrint,
              private config: AppConfig) { }

  ngOnInit() {
  }

  /**
   * Handle the user authentication request, this is done by invoking the auth service
   * @param loginForm the login form data from the UI
   */
  public onSubmit(loginForm: NgForm) {
    if (loginForm.value.username === '' || loginForm.value.password === '') {
      this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'You must enter both a username and password'});
      return;
    }
    this.displayLoginSpinner = true;
    this.authService.authenticate(loginForm.value.username, loginForm.value.password).subscribe(authenticated => {
      if (authenticated) {
//        this.displayLoginSpinner = false;
//        this.createUser(loginForm.value.username);
//        this.bootstrapDataStore();
//        this.router.navigate(['/']);
          this.fetchUserInfo(loginForm.value.username);
      }
      else {
        this.displayLoginSpinner = false;
        this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Please check your username and password and try again'});
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
        this.displayLoginSpinner = false;
        this.router.navigate(['/']);
      } else {
        this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Unable to look up user info'});
        this.displayLoginSpinner = false;
      }
    }, err => {
      this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Unable to look up user info'});
      this.displayLoginSpinner = false;
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
