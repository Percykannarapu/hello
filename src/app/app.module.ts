// Angular Imports
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
// import { HttpModule } from '@angular/http';
import { HttpClientModule } from '@angular/common/http';
import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { HttpModule } from '@angular/http';

// Service Imports
// import { InMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryStubService } from '../api/in-memory-stub.service';
// import { GeofootprintGeoService } from './Models/geofootprintGeo.service';
import { GfGeoService } from './Models/gf-geo/gf-geo.service';

import { AppComponent } from './app.component';

// ESRI Imports
import { EsriLoaderService } from 'angular-esri-loader';
import { EsriMapComponent } from './esri-map/esri-map.component';

// PrimeNG Imports
import { InputTextModule, ButtonModule, DataTableModule, DialogModule } from 'primeng/primeng';
import { AccordionModule } from 'primeng/primeng';
import { PanelMenuModule, MenuItem } from 'primeng/primeng';
import { ToolbarModule } from 'primeng/primeng';
import { FieldsetModule } from 'primeng/primeng';
import { SliderModule } from 'primeng/primeng';
import { SharedModule } from 'primeng/primeng';
import { CheckboxModule } from 'primeng/primeng';
import { MenubarModule } from 'primeng/primeng';

// Custom Component Imports
import { MainNavigationComponent } from './main-navigation/main-navigation.component';
import { GeofootprintGeoListComponent } from './geofootprintGeos/geofootprint-geo-list/geofootprint-geo-list.component';

// Feature Module Imports
import { CoreModule } from './core/core.module';
import { GeocoderComponent } from './components/geocoder/geocoder.component';
import { MenuComponent } from './components/menu/menu.component';

@NgModule({
  declarations: [
    AppComponent,
    EsriMapComponent,
    MainNavigationComponent,
    GeofootprintGeoListComponent,
    GeocoderComponent,
    MenuComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DataTableModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryStubService), //  , { dataEncapsulation: false, delay: 600 }),
    InputTextModule,
    DialogModule,
    ButtonModule,
    ToolbarModule,
    FieldsetModule,
    PanelMenuModule,
    SliderModule,
    SharedModule,
    CheckboxModule,
    CoreModule,
    HttpModule,
    MenubarModule
  ],
  providers: [EsriLoaderService, GfGeoService], // , GeofootprintGeoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
