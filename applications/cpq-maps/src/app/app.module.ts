import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { CpqMapModule } from './cpq-map/cpq-map.module';
import { ConfigService } from './cpq-map/services/config.service';
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    CpqMapModule.forRoot()
  ],
  providers: [
    { provide: LoggingConfigurationToken, useClass: ConfigService },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
