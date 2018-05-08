import {NgModule} from '@angular/core';
import {HttpModule} from '@angular/http';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';

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
