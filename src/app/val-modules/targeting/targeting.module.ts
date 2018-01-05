import {AmProfile} from './models/AmProfile';
import {AmSite} from './models/AmSite';
import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
//import {HttpClientInMemoryWebApiModule} from 'angular-in-memory-web-api';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import 'rxjs/add/operator/toPromise';

// Service Imports
import { InMemoryStubService } from '../../api/in-memory-stub.service';
import { AmSiteService } from './services/AmSite.service';

@NgModule({
   imports: [
      HttpModule
//    HttpClientInMemoryWebApiModule.forRoot(InMemoryStubService) // , { dataEncapsulation: false, delay: 600 }),
   ],
   declarations: [
   ],
   providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy},
      AmSiteService
   ],
})
export class TargetingModule { }