import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule, TreeTableModule } from 'primeng/primeng';
import { EsriMapComponent } from './components/esri-map-panel/esri-map/esri-map.component';
import { EsriIdentityService } from './services/esri-identity.service';
import { EsriGeographyPopupComponent } from './components/esri-geography-popup/esri-geography-popup.component';
import { EsriApi } from './core/esri-api.service';
import { EsriToolbarComponent } from './components/esri-map-panel/esri-toolbar/esri-toolbar.component';
import { EsriMapPanelComponent } from './components/esri-map-panel/esri-map-panel.component';
import { select, Store, StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { filter, take } from 'rxjs/operators';
import { allEffects, esriReducers, selectors } from './state';
import { AppState } from './state/esri.selectors';

const apiLoader = (store: Store<AppState>) => {
  return () => store.pipe(select(selectors.getEsriFeatureReady), filter(ready => ready), take(1)).toPromise();
};

const PUBLIC_COMPONENTS = [
  EsriMapPanelComponent,
  EsriGeographyPopupComponent
];

@NgModule({
  imports: [
    CommonModule,
    TreeTableModule,
    ToolbarModule,
    StoreModule.forFeature('esri', esriReducers),
    EffectsModule.forFeature(allEffects)
  ],
  declarations: [
    EsriToolbarComponent,
    EsriMapComponent,
    ...PUBLIC_COMPONENTS
  ],
  exports: PUBLIC_COMPONENTS,
  providers: [
    EsriApi,
    EsriIdentityService,
    { provide: APP_INITIALIZER, useFactory: apiLoader, multi: true, deps: [Store] }
  ],
  entryComponents: [EsriGeographyPopupComponent]
})
export class EsriModule { }
