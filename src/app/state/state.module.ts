import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { environment } from '../../environments/environment';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './app.effects';
import { appMetaReducers, appReducer } from './app.reducer';
import { CustomSerializer } from './shared/utils';
import { UsageEffects } from './usage/usage.effects';
import { MenuEffects } from './menu/menu.effects';
import { DataShimEffects } from './data-shim/data-shim.effects';
import { DataShimNotificationEffects } from './data-shim/data-shim-notification.effects';
import { DataShimUsageEffects } from './data-shim/data-shim-usage.effects';

@NgModule({
  imports: [
    CommonModule,
    // NOTE: StoreModule.forRoot() must be in the imports array BEFORE any other ngrx imports
    StoreModule.forRoot(appReducer, { metaReducers: appMetaReducers }),
    EffectsModule.forRoot([
      AppEffects,
      UsageEffects,
      MenuEffects,
      DataShimEffects,
      DataShimNotificationEffects,
      DataShimUsageEffects
    ]),
    StoreRouterConnectingModule.forRoot(),
    StoreDevtoolsModule.instrument({
      name: 'imPower Application',
      logOnly: environment.production,
    }),
  ],
  declarations: []
})
export class StateModule {

  constructor(@Optional() @SkipSelf() parentModule: StateModule) {
    if (parentModule) {
      throw new Error(
        'StateModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot() : ModuleWithProviders {
    return {
      ngModule: StateModule,
      providers: [{
        provide: RouterStateSerializer,
        useClass: CustomSerializer
      }]
    };
  }
}
