import {AmProfile} from './AmProfile';
import {AmSite} from './AmSite';
import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
import {HttpClientInMemoryWebApiModule} from 'angular-in-memory-web-api';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import 'rxjs/add/operator/toPromise';

// Service Imports
import { InMemoryStubService } from '../../api/in-memory-stub.service';

@NgModule({
    imports: [
        HttpModule,
        HttpClientInMemoryWebApiModule.forRoot(InMemoryStubService) // , { dataEncapsulation: false, delay: 600 }),
    ],
    declarations: [
//       AmProfile,
//       AmSite
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy}
    ],
})
export class TargetingModule { }
