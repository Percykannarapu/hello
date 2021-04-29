import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { AppEffects } from './app.effects';
import { masterImpowerReducer } from './app.reducer';
import { BatchMapEffects } from './batch-map/batch-map.effects';
import { DataShimBusyEffects } from './data-shim/data-shim-busy.effects';
import { DataShimExportEffects } from './data-shim/data-shim-export.effects';
import { DataShimNotificationEffects } from './data-shim/data-shim-notification.effects';
import { DataShimUsageEffects } from './data-shim/data-shim-usage.effects';
import { DataShimEffects } from './data-shim/data-shim.effects';
import { FormsEffects } from './forms/forms.effects';
import { HomeGeoEffects } from './homeGeocode/homeGeo.effects';
import { MenuEffects } from './menu/menu.effects';
import { RenderingEffects } from './rendering/rendering.effects';
import { UsageEffects } from './usage/usage.effects';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('impower', masterImpowerReducer),
    EffectsModule.forFeature([
      AppEffects,
      UsageEffects,
      MenuEffects,
      DataShimEffects,
      DataShimExportEffects,
      DataShimBusyEffects,
      DataShimNotificationEffects,
      DataShimUsageEffects,
      HomeGeoEffects,
      RenderingEffects,
      BatchMapEffects,
      FormsEffects
    ]),
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

  static forRoot() : ModuleWithProviders<StateModule> {
    return {
      ngModule: StateModule
    };
  }
}
