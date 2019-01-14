import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EsriModule } from '@val/esri';
import { environment } from '../../environments/environment';
import { CpqMapComponent } from './cpq-map.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './state/app.reducer';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './app.effects';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([AppEffects]),
    EsriModule.forRoot(environment.esri.portalServer, {
      auth: {
        userName: environment.esri.username,
        password: environment.esri.password,
        referer: window.location.origin
      }
    }),
    StoreDevtoolsModule.instrument({
      name: 'CPQ Maps Application',
      logOnly: environment.production,
    }),
  ],
  declarations: [CpqMapComponent],
  exports: [CpqMapComponent],
  providers: [RestDataService, AppConfig]
})
export class CpqMapModule {

  constructor(@Optional() @SkipSelf() parentModule: CpqMapModule) {
    if (parentModule) {
      throw new Error(
        'CpqMapModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot() : ModuleWithProviders {
    return {
      ngModule: CpqMapModule
    };
  }
}
