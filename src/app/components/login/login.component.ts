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
import { TargetingProfile } from '../../models/TargetingProfile';
import { GeoFootPrint } from '../../services/geofootprint.service';
import { AppConfig } from '../../app.config';

@Component({
  selector: 'val-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
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
        this.displayLoginSpinner = false;
        this.createUser(loginForm.value.username);
        this.buildLoginDtls(loginForm.value.username);
        this.router.navigate(['/']);
      }
      else {
        this.displayLoginSpinner = false;
        this.messageService.add({ severity: 'error', summary: 'Login Error', detail: 'Please check your username and password and try again'});
      }
    });
    
  }

  private createUser(username: string) {
    const user: User = new User();
    user.clientName = null;
    user.creationDate = null;
    user.deactivationDate = null;
    user.email = null;
    user.userId = null;
    user.username = username;
    user.userRoles = null;
    this.userService.setUser(user);
  }

  private buildLoginDtls(username: string){
    //const geoMaster1           = new ImpGeofootprintMaster(); TODO need to transfer the data type to impgeofootrprint
    let targetingProfile = new TargetingProfile();
    const desc = 'User ' +username+ ' logged in';
     
        targetingProfile.baseStatus              = 'INSERT';
        targetingProfile.clientId                = 'impower';
        targetingProfile.createDate              = new Date();
        targetingProfile.createUser              = 7861; // 7861
        targetingProfile.description             = desc;
        targetingProfile.dirty                   = true;
        targetingProfile.group                   = 7861; // 7861
        targetingProfile.methAccess              = 14;   //  
        targetingProfile.methAnalysis            = 'A'; //
        targetingProfile.methSeason              = '2'; //
        targetingProfile.modifyDate              = new Date();
        targetingProfile.modifyUser              = 7861; // 7861
        targetingProfile.name                    = 'imPower user login from ' + this.config.environmentName + ' environment'; //imPower user login
        targetingProfile.pk                      = null; //
        targetingProfile.preferredDate           = null; 
        targetingProfile.promoPeriodEndDate      = null;
        targetingProfile.promoPeriodStartDate    = null;
        targetingProfile.taSource                = 1;
        targetingProfile.xmlSicquery             = null;
        targetingProfile.xmlTradearea            = null;   
        targetingProfile.xmlVariables            = null; // null

        /*
        * calling fuse service to persist the Targeting data
        */

        console.log('calling GeoFootPrintService to save targetingprofile');
        const observable = this.geoFootPrintService.saveTargetingProfile(targetingProfile);
        observable.subscribe((res) => {
          console.log('profileid::::::' + res.payload);

         // targetingProfile =  this.loadTargetingSites(this.profileId);
         });
  }

}
