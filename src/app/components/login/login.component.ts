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
              private geocoderService: GeocoderService) { }

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
       // this.buildLoginDtls(loginForm.value.username);
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
    const geoMaster1           = new ImpGeofootprintMaster();
    const geoMaster           = new GeofootprintMaster();
     /*
         * setting geofootprintMaster
         */
        geoMaster.activeSiteCount         = 0;
        geoMaster.allowDuplicates         = 0;
        geoMaster.baseStatus              = 'INSERT';
        geoMaster.cgmId                   = null;
        geoMaster.createdDate             = new Date();
        geoMaster.dirty                   = true;
        geoMaster.isMarketBased           = false;
        geoMaster.methAnalysis            = null;
        geoMaster.methSeason              = null;
        geoMaster.profile                 = 478277; // need to set new profile id from SDE.AM_PROFILES for every request.
        geoMaster.profileName             = 'User <'+ username+'> logged into <URL e.g impower dev'; // who loggenin what instane of impower User <userId> logged in to <URL e.g. https://impowerdev.val.vlss.local/#/>
        geoMaster.status                  = 'IMPOWER';
        geoMaster.summaryInd              = 0;
        geoMaster.totalSiteCount          = 0;

        var observable = this.geocoderService.saveGeofootprintMaster(geoMaster);
        observable.subscribe((res) => {
          console.log('In geofootprint response:::' + JSON.stringify(res.payload, null, 2));
        });
  }

}
