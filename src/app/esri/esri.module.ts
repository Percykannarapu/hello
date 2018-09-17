import { APP_INITIALIZER, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolbarModule, TreeTableModule } from 'primeng/primeng';
import { EsriMapComponent } from './components/esri-map-panel/esri-map/esri-map.component';
import { EsriIdentityService } from './services/esri-identity.service';
import { EsriGeographyPopupComponent } from './components/esri-geography-popup/esri-geography-popup.component';
import { EsriApi } from './core/esri-api.service';
import { EsriToolbarComponent } from './components/esri-map-panel/esri-toolbar/esri-toolbar.component';
import { EsriMapPanelComponent } from './components/esri-map-panel/esri-map-panel.component';

const apiLoader = (api: EsriApi, identity: EsriIdentityService) => {
  return () => {
    return new Promise((resolve, reject) => {
      api.initialize().then(() => {
        identity.authenticate();
        resolve();
      }).catch(e => reject(e));
    });
  };
};

@NgModule({
  imports: [
    CommonModule,
    TreeTableModule,
    ToolbarModule
  ],
  declarations: [
    EsriGeographyPopupComponent,
    EsriToolbarComponent,
    EsriMapComponent,
    EsriMapPanelComponent
  ],
  exports: [
    EsriMapPanelComponent,
    EsriGeographyPopupComponent
  ],
  providers: [
    EsriApi, EsriIdentityService,
    { provide: APP_INITIALIZER, useFactory: apiLoader, multi: true, deps: [EsriApi, EsriIdentityService] }
  ],
  entryComponents: [EsriGeographyPopupComponent]
})
export class EsriModule { }
