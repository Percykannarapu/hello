import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf, Type } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { BusyIndicatorComponent } from './components/busy-indicator/busy-indicator.component';
import { SimpleMessageComponent } from './components/simple-message/simple-message.component';
import { LiveIndicatorService } from './core/live-indicator.service';
import { NotificationProvider, NotificationProviderToken } from './core/notification-provider.interface';
import { NullNotificationService } from './core/null-notification.service';
import { BusyEffects } from './state/busyIndicator/busy.state';
import { ConfirmationEffects } from './state/confirmation/confirmation.effects';
import { MessagingEffects } from './state/messaging.effects';
import { messagingReducers } from './state/messaging.interfaces';

const allEffects = [
  MessagingEffects,
  ConfirmationEffects,
  BusyEffects
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('messaging', messagingReducers),
    EffectsModule.forFeature(allEffects),
    DialogModule,
    ProgressSpinnerModule,
    ButtonModule
  ],
  declarations: [BusyIndicatorComponent, SimpleMessageComponent],
  exports: [BusyIndicatorComponent, SimpleMessageComponent]
})
export class MessagingModule {
  constructor(@Optional() @SkipSelf() parentModule: MessagingModule) {
    if (parentModule) {
      throw new Error('MessagingModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot(notificationProvider: Type<NotificationProvider> = NullNotificationService) : ModuleWithProviders {
    return {
      ngModule: MessagingModule,
      providers: [
        LiveIndicatorService,
        { provide: NotificationProviderToken, useClass: notificationProvider }
      ]
    };
  }
}
