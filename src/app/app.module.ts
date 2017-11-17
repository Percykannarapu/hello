// Angular Imports
import { RouterModule } from '@angular/router';
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
import { MenuModule } from 'primeng/primeng';
import { PanelMenuModule, MenuItem } from 'primeng/primeng';
import { ToolbarModule } from 'primeng/primeng';
import { FieldsetModule } from 'primeng/primeng';
import { SliderModule } from 'primeng/primeng';
import { SharedModule } from 'primeng/primeng';
import { CheckboxModule } from 'primeng/primeng';
import { MenubarModule } from 'primeng/primeng';
import { FileUploadModule } from 'primeng/primeng';
import { GrowlModule } from 'primeng/primeng';

import { SplitButtonModule } from 'primeng/primeng';
import { PanelModule } from 'primeng/primeng';
import { RadioButtonModule } from 'primeng/primeng';

// Custom Component Imports
import { MainNavigationComponent } from './main-navigation/main-navigation.component';
import { GeofootprintGeoListComponent } from './geofootprintGeos/geofootprint-geo-list/geofootprint-geo-list.component';

// Feature Module Imports
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { GeocoderComponent } from './components/geocoder/geocoder.component';
import { MenuComponent } from './components/menu/menu.component';
import { BusinessComponent } from './components/business/business.component';
import { AppService } from './services/app.service';

import { ModalModule } from 'ngx-bootstrap';

@NgModule({
  declarations: [
    AppComponent,
    EsriMapComponent,
    MainNavigationComponent,
    GeofootprintGeoListComponent,
    GeocoderComponent,
    MenuComponent,
    BusinessComponent
  ],
  entryComponents: [
    BusinessComponent
  ],
  imports: [
    AppRoutingModule,
    RouterModule,
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DataTableModule,
    HttpClientModule,
    HttpClientInMemoryWebApiModule.forRoot(InMemoryStubService), //  , { dataEncapsulation: false, delay: 600 }),
    InputTextModule,
    DialogModule,
    AccordionModule,
    ButtonModule,
    ToolbarModule,
    FieldsetModule,
    MenuModule,
    PanelMenuModule,
    SliderModule,
    SharedModule,
    CheckboxModule,
    CoreModule,
    HttpModule,
    MenubarModule,
    FileUploadModule,
    GrowlModule,
    PanelModule,
    SplitButtonModule,
    RadioButtonModule,
    ModalModule.forRoot()
  ],
  providers: [EsriLoaderService, GfGeoService, AppService], // , GeofootprintGeoService],
  bootstrap: [AppComponent]
})
export class AppModule { }
