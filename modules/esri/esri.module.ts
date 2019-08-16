import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { select, Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ToolbarModule } from 'primeng/toolbar';
import { TreeTableModule } from 'primeng/treetable';
import { filter, take } from 'rxjs/operators';
import { EsriLabelConfigComponent } from './src/components/esri-map-panel/esri-label-config/esri-label-config.component';
import { EsriAppSettingsToken, EsriAuthenticationToken, EsriLoaderToken } from './src/configuration';
import { EsriMapPanelComponent } from './src/components/esri-map-panel/esri-map-panel.component';
import { EsriGeographyPopupComponent } from './src/components/esri-geography-popup/esri-geography-popup.component';
import { EsriToolbarComponent } from './src/components/esri-map-panel/esri-toolbar/esri-toolbar.component';
import { EsriMapComponent } from './src/components/esri-map-panel/esri-map/esri-map.component';
import { EsriDomainFactoryService } from './src/services/esri-domain-factory.service';
import { EsriGeoprocessorService } from './src/services/esri-geoprocessor.service';
import { EsriIdentityService } from './src/services/esri-identity.service';
import { EsriLayerService } from './src/services/esri-layer.service';
import { EsriMapInteractionService } from './src/services/esri-map-interaction.service';
import { EsriMapService } from './src/services/esri-map.service';
import { EsriQueryService } from './src/services/esri-query.service';
import { EsriRendererService } from './src/services/esri-renderer.service';
import { allEffects } from './src/state/esri.effects';
import { esriReducers } from './src/state/esri.reducers';
import { AppState, selectors } from './src/state/esri.selectors';
import { ForRootOptions, forRootOptionsToken, provideEsriAppOptions, provideEsriAuthOptions, provideEsriLoaderOptions } from './esri-module-factories';
import { EsriPrintingService } from './src/services/esri-printing-service';

export function initializer(store: Store<AppState>) {
  return function () {
    return store.pipe(select(selectors.getEsriFeatureReady), filter(ready => ready), take(1)).toPromise();
  };
}

const PUBLIC_COMPONENTS = [
  EsriMapPanelComponent,
  EsriGeographyPopupComponent
];

@NgModule({
  imports: [
    CommonModule,
    HttpClientModule,
    TreeTableModule,
    ToolbarModule,
    OverlayPanelModule,
    ButtonModule,
    DropdownModule,
    InputSwitchModule,
    FormsModule,
    StoreModule.forFeature('esri', esriReducers),
    EffectsModule.forFeature(allEffects),
  ],
  declarations: [
    EsriToolbarComponent,
    EsriMapComponent,
    EsriLabelConfigComponent,
    ...PUBLIC_COMPONENTS,
  ],
  exports: PUBLIC_COMPONENTS,
  entryComponents: [EsriGeographyPopupComponent]
})
export class EsriModule {

  constructor(@Optional() @SkipSelf() parentModule: EsriModule) {
    if (parentModule) {
      throw new Error('EsriModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot(options?: ForRootOptions) : ModuleWithProviders {
    return {
      ngModule: EsriModule,
      providers: [
        { provide: forRootOptionsToken, useValue: options },
        { provide: EsriLoaderToken, useFactory: provideEsriLoaderOptions, deps: [forRootOptionsToken] },
        { provide: EsriAuthenticationToken, useFactory: provideEsriAuthOptions, deps: [forRootOptionsToken] },
        { provide: EsriAppSettingsToken, useFactory: provideEsriAppOptions, deps: [forRootOptionsToken] },
        EsriDomainFactoryService,
        EsriGeoprocessorService,
        EsriIdentityService,
        EsriLayerService,
        EsriMapService,
        EsriMapInteractionService,
        EsriQueryService,
        EsriRendererService,
        EsriPrintingService,
        { provide: APP_INITIALIZER, useFactory: initializer, multi: true, deps: [Store] }
      ]
    };
  }
}
