import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ModuleWithProviders, NgModule, Optional, SkipSelf } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TreeTableModule } from 'primeng/treetable';
import {
  ForRootOptions,
  forRootOptionsToken,
  provideEsriAppOptions,
  provideEsriAuthOptions,
  provideEsriLoaderOptions
} from './esri-module-factories';
import { EsriGeographyPopupComponent } from './src/components/esri-geography-popup/esri-geography-popup.component';
import { EsriLabelConfigComponent } from './src/components/esri-map-panel/esri-label-config/esri-label-config.component';
import { EsriMapPanelComponent } from './src/components/esri-map-panel/esri-map-panel.component';
import { EsriMapComponent } from './src/components/esri-map-panel/esri-map/esri-map.component';
import { EsriToolbarComponent } from './src/components/esri-map-panel/esri-toolbar/esri-toolbar.component';
import { EsriAppSettingsToken, EsriAuthenticationToken, EsriLoaderToken } from './src/configuration';
import { EsriBoundaryService } from './src/services/esri-boundary.service';
import { EsriGeoprocessorService } from './src/services/esri-geoprocessor.service';
import { EsriLayerService } from './src/services/esri-layer.service';
import { EsriMapInteractionService } from './src/services/esri-map-interaction.service';
import { EsriMapService } from './src/services/esri-map.service';
import { EsriPoiService } from './src/services/esri-poi.service';
import { EsriPrintingService } from './src/services/esri-printing-service';
import { EsriQueryService } from './src/services/esri-query.service';
import { EsriShadingService } from './src/services/esri-shading.service';
import { EsriService } from './src/services/esri.service';
import { LoggingService } from './src/services/logging.service';
import { masterEsriReducer } from './src/state/esri.reducers';
import { EsriInitEffects } from './src/state/init/esri.init.effects';
import { EsriMapButtonEffects } from './src/state/map/esri.map-button.effects';
import { EsriMapEffects } from './src/state/map/esri.map.effects';
import { EsriShadingEffects } from './src/state/shading/esri.shading.effects';

const allEffects = [
  EsriInitEffects,
  EsriMapEffects,
  EsriMapButtonEffects,
  EsriShadingEffects,
];

const PUBLIC_COMPONENTS = [
  EsriMapComponent,
  EsriMapPanelComponent,
  EsriGeographyPopupComponent
];

@NgModule({
    imports: [
        StoreModule.forFeature('esri', masterEsriReducer),
        CommonModule,
        HttpClientModule,
        TreeTableModule,
        ToolbarModule,
        OverlayPanelModule,
        ButtonModule,
        DropdownModule,
        InputSwitchModule,
        FormsModule,
        EffectsModule.forFeature(allEffects),
        TooltipModule,
        ProgressSpinnerModule,
        ProgressBarModule,
    ],
  declarations: [
    EsriToolbarComponent,
    EsriLabelConfigComponent,
    ...PUBLIC_COMPONENTS,
  ],
  exports: PUBLIC_COMPONENTS
})
export class EsriModule {

  constructor(@Optional() @SkipSelf() parentModule: EsriModule) {
    if (parentModule) {
      throw new Error('EsriModule is already loaded. Import it in the AppModule only');
    }
  }

  static forRoot(optionFactory: () => ForRootOptions = () => null) : ModuleWithProviders<EsriModule> {
    return {
      ngModule: EsriModule,
      providers: [
        { provide: forRootOptionsToken, useFactory: optionFactory },
        { provide: EsriLoaderToken, useFactory: provideEsriLoaderOptions, deps: [forRootOptionsToken] },
        { provide: EsriAuthenticationToken, useFactory: provideEsriAuthOptions, deps: [forRootOptionsToken] },
        { provide: EsriAppSettingsToken, useFactory: provideEsriAppOptions, deps: [forRootOptionsToken] },
        EsriService,
        EsriGeoprocessorService,
        EsriLayerService,
        EsriMapService,
        EsriMapInteractionService,
        EsriQueryService,
        EsriPrintingService,
        EsriShadingService,
        EsriPoiService,
        EsriBoundaryService,
        LoggingService
      ]
    };
  }
}
