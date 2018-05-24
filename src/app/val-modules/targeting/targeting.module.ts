import {NgModule} from '@angular/core';
import {LocationStrategy, HashLocationStrategy} from '@angular/common';

@NgModule({
   imports: [],
   declarations: [
   ],
   providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy}
   ],
})
export class TargetingModule { }
