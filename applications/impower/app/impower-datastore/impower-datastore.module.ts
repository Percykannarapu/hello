import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { AudiencesEffects } from './state/transient/audience/audience.effects';
import { GeoAttributesEffects } from './state/transient/geo-attributes/geo-attributes.effects';
import { GeoVarsEffects } from './state/transient/geo-vars/geo-vars.effects';
import { MapVarsEffects } from './state/transient/map-vars/map-vars.effects';
import { dataStoreReducers } from './state/impower-datastore.interfaces';
import { EffectsModule } from '@ngrx/effects';
import { PersistentEffects } from './state/persistent/persistent.effects';
import { TransientEffects } from './state/transient/transient.effects';

const allEffects = [PersistentEffects, TransientEffects, AudiencesEffects, GeoAttributesEffects, GeoVarsEffects, MapVarsEffects];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('datastore', dataStoreReducers),
    EffectsModule.forFeature(allEffects)
  ],
  declarations: []
})
export class ImpowerDatastoreModule { }

