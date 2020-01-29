import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { masterDataStoreReducer } from './state/impower-datastore.interfaces';
import { PersistentEffects } from './state/persistent/persistent.effects';
import { AudiencesEffects } from './state/transient/audience/audience.effects';
import { GeoAttributesEffects } from './state/transient/geo-attributes/geo-attributes.effects';
import { GeoVarsEffects } from './state/transient/geo-vars/geo-vars.effects';
import { TransientEffects } from './state/transient/transient.effects';

const allEffects = [PersistentEffects, TransientEffects, AudiencesEffects, GeoAttributesEffects, GeoVarsEffects];

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

  static forRoot() : ModuleWithProviders {
    return {
      ngModule: ImpowerDatastoreModule
    };
  }
}

