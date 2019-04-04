import { ModuleWithProviders, NgModule, Optional, SkipSelf, Type } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { DialogModule } from 'primeng/dialog';
import { ProgressSpinnerModule } from 'primeng/primeng';
import { NotificationProvider, NotificationProviderToken } from './core/notification-provider.interface';
import { NullNotificationService } from './core/null-notification.service';
import { messagingReducers } from './state/messaging.interfaces';
import { MessagingEffects } from './state/messaging.effects';
import { ConfirmationEffects } from './state/confirmation/confirmation.effects';
import { BusyIndicatorComponent } from './components/busy-indicator/busy-indicator.component';

const allEffects = [
  MessagingEffects,
  ConfirmationEffects
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('messaging', messagingReducers),
    EffectsModule.forFeature(allEffects),
    DialogModule,
    ProgressSpinnerModule
  ],
  declarations: [BusyIndicatorComponent],
  exports: [BusyIndicatorComponent]
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
        { provide: NotificationProviderToken, useClass: notificationProvider }
      ]
    };
  }
}
