import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { GeoAttributesEffects } from './state/geo-attributes/geo-attributes.effects';
import { dataStoreReducers } from './state/impower-datastore.interfaces';
import { EffectsModule } from '@ngrx/effects';
import { PersistentEffects } from './state/persistent/persistent.effects';

const allEffects = [PersistentEffects, GeoAttributesEffects];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('datastore', dataStoreReducers),
    EffectsModule.forFeature(allEffects)
  ],
  declarations: []
})
export class ImpowerDatastoreModule { }

