import { ModuleWithProviders, NgModule, Optional, SkipSelf, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { EsriModule } from '@val/esri';
import { environment } from '../../environments/environment';
import { CpqMapComponent } from './cpq-map.component';
import { StoreModule } from '@ngrx/store';
import { reducers, metaReducers } from './state/app.reducer';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EffectsModule } from '@ngrx/effects';
import { AppEffects } from './app.effects';
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
import { AdditionalToolbarGroupComponent } from './components/additional-toolbar-group/additional-toolbar-group.component';


@NgModule({
  imports: [
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
    StoreModule.forRoot(reducers, { metaReducers }),
    EffectsModule.forRoot([AppEffects]),
    EsriModule.forRoot(environment.esri.portalServer, {
      auth: {
        userName: environment.esri.username,
        password: environment.esri.password,
        referer: window.location.origin
      }
    }),
    StoreDevtoolsModule.instrument({
      name: 'CPQ Maps Application',
      logOnly: environment.production,
    }),
  ],
  declarations: [CpqMapComponent, DevToolsComponent, GridComponent, MapControlsComponent, AdditionalToolbarGroupComponent],
  exports: [CpqMapComponent],
  providers: [RestDataService, AppConfig]
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
