import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule, Optional, SkipSelf, Type } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { BusyIndicatorComponent } from './components/busy-indicator/busy-indicator.component';
import { SimpleMessageComponent } from './components/simple-message/simple-message.component';
import { LiveIndicatorService } from './core/live-indicator.service';
import { MessageCenterService } from './core/message-center.service';
import { NotificationProvider, NotificationProviderToken } from './core/notification-provider.interface';
import { NullNotificationService } from './core/null-notification.service';
import { BusyEffects } from './state/busyIndicator/busy.state';
import { ConfirmationEffects } from './state/confirmation/confirmation.effects';
import { MessageCenterEffects } from './state/message-center/message-center.effects';
import { messagingReducers } from './state/messaging.interfaces';
import { MessageCenterComponent } from './components/message-center/message-center.component';

const allEffects = [
  MessageCenterEffects,
  ConfirmationEffects,
  BusyEffects
];

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature('messaging', messagingReducers),
    EffectsModule.forFeature(allEffects),
    FormsModule,
    DialogModule,
    DynamicDialogModule,
    ProgressSpinnerModule,
    ButtonModule,
    TableModule,
    InputTextModule,
    MultiSelectModule
  ],
  declarations: [BusyIndicatorComponent, SimpleMessageComponent, MessageCenterComponent],
  exports: [BusyIndicatorComponent, SimpleMessageComponent],
})
export class MessagingModule {
  constructor(@Optional() @SkipSelf() parentModule: MessagingModule) {
    if (parentModule) {
      throw new Error('MessagingModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot(notificationProvider: Type<NotificationProvider> = NullNotificationService) : ModuleWithProviders<MessagingModule> {
    return {
      ngModule: MessagingModule,
      providers: [
        LiveIndicatorService,
        MessageCenterService,
        { provide: NotificationProviderToken, useClass: notificationProvider }
      ]
    };
  }
}
