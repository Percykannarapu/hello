import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EsriModule } from '@val/esri';
import { MessagingModule } from '@val/messaging';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { MessagesModule } from 'primeng/messages';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SidebarModule } from 'primeng/sidebar';
import { SpinnerModule } from 'primeng/spinner';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { environment } from '../../environments/environment';
import { AppConfig } from '../app.config';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { DevToolsComponent } from './components/dev-tools/dev-tools.component';
import { GridComponent } from './components/grid/grid.component';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { LegendComponent } from './components/legend/legend.component';
import { MapControlsComponent } from './components/map-controls/map-controls.component';
import { MapPopupComponent } from './components/map-popup/map-popup.component';
import { ShadingConfigComponent } from './components/shading-config/shading-config.component';
import { CpqMapComponent } from './cpq-map.component';
import { AppMessagingService } from './services/app-messaging.service';
import { AppEffects } from './state/app.effects';
import { metaReducers, reducers } from './state/app.reducer';
import { GridEffects } from './state/grid/grid.effects';
import { InitEffects } from './state/init/init.effects';
import { MapUIEffects } from './state/map-ui/map-ui.effects';
import { PopupEffects } from './state/popup/popup.effects';

export function esriOptionsFactory() {
  return {
    portalServerRootUrl: environment.esri.portalServer,
    auth: {
      userName: environment.esri.username,
      password: environment.esri.password,
      referer: window.location.origin
    }
  };
}

@NgModule({
  imports: [
    DialogModule,
    SpinnerModule,
    CheckboxModule,
    InputSwitchModule,
    TableModule,
    RadioButtonModule,
    CardModule,
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    DropdownModule,
    ButtonModule,
    SidebarModule,
    CommonModule,
    InputTextModule,
    HttpClientModule,
    MessagesModule,
    ToastModule,
    MessagingModule.forRoot(AppMessagingService),
    StoreModule.forRoot(reducers, {metaReducers}),
    EffectsModule.forRoot([AppEffects, InitEffects, PopupEffects, MapUIEffects, GridEffects]),
    StoreDevtoolsModule.instrument({
      name: 'CPQ Maps Application',
      logOnly: environment.production,
    }),
    EsriModule.forRoot(esriOptionsFactory),
  ],
  declarations: [CpqMapComponent, DevToolsComponent, GridComponent, MapControlsComponent, HeaderBarComponent, ShadingConfigComponent, LegendComponent, MapPopupComponent],
  exports: [CpqMapComponent],
  providers: [
    RestDataService,
    AppConfig,
    MessageService,
  ],
  entryComponents: [MapPopupComponent, LegendComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class CpqMapModule {

  constructor(@Optional() @SkipSelf() parentModule: CpqMapModule) {
    if (parentModule) {
      throw new Error(
        'CpqMapModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot() : ModuleWithProviders<CpqMapModule> {
    return {
      ngModule: CpqMapModule
    };
  }
}
