import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AppState {
  private _isRed = new BehaviorSubject<boolean>(false);
  isRed: Observable<boolean> = this._isRed.asObservable();

  toggleRed() {
    this._isRed.next(!this._isRed.value);
  }
}