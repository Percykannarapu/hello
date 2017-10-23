// Angular Imports
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';

// ESRI Imports
import { EsriLoaderService } from 'angular2-esri-loader';
import { EsriMapComponent } from './esri-map/esri-map.component';

// PrimeNG Imports
import { InputTextModule, ButtonModule, DataTableModule, DialogModule } from 'primeng/primeng';
import { AccordionModule } from 'primeng/primeng';
import { PanelMenuModule, MenuItem } from 'primeng/primeng';
import { ToolbarModule } from 'primeng/primeng';
import { FieldsetModule } from 'primeng/primeng';
import { SliderModule } from 'primeng/primeng';

// Custom Component Imports
import { MainNavigationComponent } from './main-navigation/main-navigation.component';

@NgModule({
  declarations: [
    AppComponent,
    EsriMapComponent,
    MainNavigationComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    DataTableModule,
    HttpModule,
    InputTextModule,
    DialogModule,
    ButtonModule,
    ToolbarModule,
    FieldsetModule,
    PanelMenuModule,
    SliderModule
  ],
  providers: [EsriLoaderService],
  bootstrap: [AppComponent]
})
export class AppModule { }
