import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule, DropdownModule, InputSwitchModule, OverlayPanelModule, ToolbarModule, TreeTableModule } from 'primeng/primeng';
import { select, Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { filter, take } from 'rxjs/operators';
import { allEffects, AppState, esriReducers, selectors } from './src/state';
import { EsriLabelConfigComponent } from './src/components/esri-map-panel/esri-label-config/esri-label-config.component';
import { EsriAppSettings, EsriAppSettingsToken, EsriAuthenticationParams, EsriAuthenticationToken, EsriConfigOptions, EsriLoaderToken } from './src/configuration';
import { defaultEsriAppSettings, defaultEsriAuthParams, defaultEsriConfig, defaultEsriUrlFragments } from './settings';
import { EsriMapPanelComponent } from './src/components/esri-map-panel/esri-map-panel.component';
import { EsriGeographyPopupComponent } from './src/components/esri-geography-popup/esri-geography-popup.component';
import { EsriToolbarComponent } from './src/components/esri-map-panel/esri-toolbar/esri-toolbar.component';
import { EsriMapComponent } from './src/components/esri-map-panel/esri-map/esri-map.component';
import { EsriDomainFactoryService, EsriGeoprocessorService, EsriIdentityService, EsriLayerService, EsriMapInteractionService, EsriMapService, EsriQueryService, EsriRendererService } from './src/services';

export function initializer(store: Store<AppState>) {
  return () => store.pipe(select(selectors.getEsriFeatureReady), filter(ready => ready), take(1)).toPromise();
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

  static forRoot(serverUrl: string, options: { config?: Partial<EsriConfigOptions>, auth?: Partial<EsriAuthenticationParams>, app?: Partial<EsriAppSettings> } = {}) : ModuleWithProviders {
    return {
      ngModule: EsriModule,
      providers: [
        {
          provide: EsriLoaderToken,
          useValue: {
            ...defaultEsriConfig,
            portalUrl: `${serverUrl}${defaultEsriUrlFragments.portal}`,
            ...options.config
          }
        },
        {
          provide: EsriAuthenticationToken,
          useValue: {
            ...defaultEsriAuthParams,
            generatorUrl: `${serverUrl}${defaultEsriUrlFragments.portal}${defaultEsriUrlFragments.generator}`,
            tokenServerUrl: `${serverUrl}${defaultEsriUrlFragments.portal}${defaultEsriUrlFragments.tokenServer}`,
            ...options.auth
          }
        },
        {
          provide: EsriAppSettingsToken,
          useValue: {
            ...defaultEsriAppSettings,
            ...options.app
          }
        },
        { provide: APP_INITIALIZER, useFactory: initializer, multi: true, deps: [Store] },
        EsriIdentityService,
        EsriDomainFactoryService,
        EsriGeoprocessorService,
        EsriLayerService,
        EsriMapService,
        EsriMapInteractionService,
        EsriQueryService,
        EsriRendererService
      ]
    };
  }
}
