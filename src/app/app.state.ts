import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookup } from './val-modules/targeting/models/ImpRadLookup';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class AppState
{
   // Initial thoughts were anything global to the app, outside of the services
}