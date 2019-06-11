import { CUSTOM_ELEMENTS_SCHEMA, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EsriModule } from '@val/esri';
import { MessagingModule } from '@val/messaging';
import { environment } from '../../environments/environment';
import { CpqMapComponent } from './cpq-map.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './state/app.reducer';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './state/app.effects';
import { RestDataService } from '../val-modules/common/services/restdata.service';
import { AppConfig } from '../app.config';
import { SidebarModule } from 'primeng/sidebar';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { DevToolsComponent } from './components/dev-tools/dev-tools.component';
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { GridComponent } from './components/grid/grid.component';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { MapControlsComponent } from './components/map-controls/map-controls.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { MessageService, MessagesModule, SpinnerModule } from 'primeng/primeng';
import { InitEffects } from './state/init/init.effects';
import { ShadingEffects } from './state/shading/shading.effects';
import { GridEffects } from './state/grid/grid.effects';
import { PopupEffects } from './state/popup/popup.effects';
import { HeaderBarComponent } from './components/header-bar/header-bar.component';
import { AppMessagingService } from './services/app-messaging.service';
import { ToastModule } from 'primeng/toast';
import { ShadingConfigComponent } from './components/shading-config/shading-config.component';
import { LegendComponent } from './components/legend/legend.component';
import { MapPopupComponent } from './components/map-popup/map-popup.component';


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
    EffectsModule.forRoot([AppEffects, InitEffects, PopupEffects, ShadingEffects, GridEffects]),
    StoreDevtoolsModule.instrument({
      name: 'CPQ Maps Application',
      logOnly: environment.production,

    }),
    EsriModule.forRoot({
      portalServerRootUrl: environment.esri.portalServer,
      auth: {
        userName: environment.esri.username,
        password: environment.esri.password,
        referer: window.location.origin
      }
    }),
  ],
  declarations: [CpqMapComponent, DevToolsComponent, GridComponent, MapControlsComponent, HeaderBarComponent, ShadingConfigComponent, LegendComponent, MapPopupComponent],
  exports: [CpqMapComponent],
  providers: [RestDataService, AppConfig, MessageService],
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

  static forRoot() : ModuleWithProviders {
    return {
      ngModule: CpqMapModule
    };
  }
}
