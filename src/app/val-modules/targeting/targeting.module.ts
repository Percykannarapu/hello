import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';
import 'rxjs/add/operator/toPromise';

@NgModule({
   imports: [
      HttpModule
   ],
   declarations: [
   ],
   providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy}
   ],
})
export class TargetingModule { }
