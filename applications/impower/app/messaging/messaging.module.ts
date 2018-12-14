import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { messagingReducers } from './state/messaging.interfaces';
import { MessagingEffects } from './state/messaging.effects';
import { ConfirmationEffects } from './state/confirmation/confirmation.effects';

const allEffects = [
  MessagingEffects,
  ConfirmationEffects
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('messaging', messagingReducers),
    EffectsModule.forFeature(allEffects)
  ],
  declarations: []
})
export class MessagingModule { }
