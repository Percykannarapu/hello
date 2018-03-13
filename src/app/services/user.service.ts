import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { User } from '../models/User';
import { TargetingProfile } from '../models/TargetingProfile';
import { AppConfig } from '../app.config';
import { GeoFootPrint } from '../services/geofootprint.service';

@Injectable()
export class UserService {

  // Private user, exposed publicly as an observable
  private _user = new User;
  private _userSubject = new BehaviorSubject<User>(this._user);

  // Public access to the user is through this observable
  public userObservable: Observable<User> = this._userSubject.asObservable();

  constructor(private config: AppConfig, private geoFootPrintService: GeoFootPrint) { }

  public setUser(user: User) {
    console.log('fired setUser() in UserService');
    this._user = user;
    this._userSubject.next(this._user);
  }

  /**
   * Retreive the User object for the currently logged in user
   * @returns A User object
   */
  public getUser() : User {
    return this._user;
  }

  /**
   * 
   * @param username 
   */
  public buildLoginDtls(){
    if (this._user == null || this._user.username == null) {
      console.warn('unable to store login details');
      return;
    }
    
    //const geoMaster1           = new ImpGeofootprintMaster(); TODO need to transfer the data type to impgeofootrprint
    const targetingProfile = new TargetingProfile();
    const desc = 'User ' + this._user.username + ' logged in';

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
