import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { masterDataStoreReducer } from './state/impower-datastore.interfaces';
import { PersistentEffects } from './state/persistent/persistent.effects';
import { AudienceDefinitionsEffects } from './state/transient/audience-definitions/audience-definitions.effects';
import { InMarketAudienceEffects } from './state/transient/audience-definitions/in-market/in-market-audience.effects';
import { InterestAudienceEffects } from './state/transient/audience-definitions/interest/interest-audience.effects';
import { PixelAudienceEffects } from './state/transient/audience-definitions/pixel/pixel-audience.effects';
import { TdaAudienceEffects } from './state/transient/audience-definitions/tda/tda-audience.effects';
import { VlhAudienceEffects } from './state/transient/audience-definitions/vlh/vlh-audience.effects';
import { AudiencesEffects } from './state/transient/audience/audience.effects';
import { GeoAttributesEffects } from './state/transient/geo-attributes/geo-attributes.effects';
import { GeoVarsEffects } from './state/transient/geo-vars/geo-vars.effects';
import { TransientEffects } from './state/transient/transient.effects';

const allEffects = [
  PersistentEffects,
  TransientEffects,
  AudiencesEffects,
  GeoAttributesEffects,
  GeoVarsEffects,
  InterestAudienceEffects,
  InMarketAudienceEffects,
  VlhAudienceEffects,
  PixelAudienceEffects,
  TdaAudienceEffects,
  AudienceDefinitionsEffects
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('datastore', masterDataStoreReducer),
    EffectsModule.forFeature(allEffects)
  ],
  declarations: []
})
export class ImpowerDatastoreModule {
  constructor(@Optional() @SkipSelf() parentModule: ImpowerDatastoreModule) {
    if (parentModule) {
      throw new Error(
        'StateModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot() : ModuleWithProviders<ImpowerDatastoreModule> {
    return {
      ngModule: ImpowerDatastoreModule
    };
  }
}

