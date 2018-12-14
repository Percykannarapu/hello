import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EsriModule } from '@val/esri';
import { environment } from '../../environments/environment';
import { CpqMapComponent } from './cpq-map.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './reducers';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './app.effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forRoot(reducers, { metaReducers }),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot([AppEffects]),
    EsriModule.forRoot(environment.esri.portalServer, {
      auth: {
        userName: environment.esri.username,
        password: environment.esri.password,
        referer: window.location.origin
      }
    }),
  ],
  declarations: [CpqMapComponent],
  exports: [CpqMapComponent]
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
