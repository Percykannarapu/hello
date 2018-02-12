import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { User } from '../models/User';

@Injectable()
export class UserService {

  // Private user, exposed publicly as an observable
  private _user = new User;
  private _userSubject = new BehaviorSubject<User>(this._user);

  // Public access to the user is through this observable
  public userObservable: Observable<User> = this._userSubject.asObservable();

  public setUser(user: User) {
    console.log('fired setUser() in UserService');
    this._user = user;
    this._userSubject.next(this._user);
  }

  constructor() { }

}
