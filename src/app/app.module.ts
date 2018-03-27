import {BaseModel} from './val-modules/api/models/BaseModel';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {HttpClientModule} from '@angular/common/http';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {LocationStrategy, HashLocationStrategy, CommonModule } from '@angular/common';
import {AppConfig} from './app.config';
import {AppRoutes} from './app.routes';
import {AppState} from './app.state';
import 'rxjs/add/operator/toPromise';
import {AccordionModule} from 'primeng/primeng';
import {AutoCompleteModule} from 'primeng/primeng';
import {BreadcrumbModule} from 'primeng/primeng';
import {ButtonModule} from 'primeng/primeng';
import {CalendarModule} from 'primeng/primeng';
import {CarouselModule} from 'primeng/primeng';
import {ColorPickerModule} from 'primeng/primeng';
import {ChartModule} from 'primeng/primeng';
import {CheckboxModule} from 'primeng/primeng';
import {ChipsModule} from 'primeng/primeng';
import {CodeHighlighterModule} from 'primeng/primeng';
import {ConfirmDialogModule} from 'primeng/primeng';
import {SharedModule} from 'primeng/primeng';
import {ContextMenuModule} from 'primeng/primeng';
import {DataGridModule} from 'primeng/primeng';
import {DataListModule} from 'primeng/primeng';
import {DataScrollerModule} from 'primeng/primeng';
import {DataTableModule} from 'primeng/primeng';
import {DialogModule} from 'primeng/primeng';
import {DragDropModule} from 'primeng/primeng';
import {DropdownModule} from 'primeng/primeng';
import {EditorModule} from 'primeng/primeng';
import {FieldsetModule} from 'primeng/primeng';
import {FileUploadModule} from 'primeng/primeng';
import {GalleriaModule} from 'primeng/primeng';
import {GMapModule} from 'primeng/primeng';
import {GrowlModule} from 'primeng/primeng';
import {InputMaskModule} from 'primeng/primeng';
import {InputSwitchModule} from 'primeng/primeng';
import {InputTextModule} from 'primeng/primeng';
import {InputTextareaModule} from 'primeng/primeng';
import {LightboxModule} from 'primeng/primeng';
import {ListboxModule} from 'primeng/primeng';
import {MegaMenuModule} from 'primeng/primeng';
import {MenuModule} from 'primeng/primeng';
import {MenubarModule} from 'primeng/primeng';
import {MessagesModule} from 'primeng/primeng';
import {MultiSelectModule} from 'primeng/primeng';
import {OrderListModule} from 'primeng/primeng';
import {OrganizationChartModule} from 'primeng/primeng';
import {OverlayPanelModule} from 'primeng/primeng';
import {PaginatorModule} from 'primeng/primeng';
import {PanelModule} from 'primeng/primeng';
import {PanelMenuModule} from 'primeng/primeng';
import {PasswordModule} from 'primeng/primeng';
import {PickListModule} from 'primeng/primeng';
import {ProgressBarModule} from 'primeng/primeng';
import {ProgressSpinnerModule} from 'primeng/primeng';
import {RadioButtonModule} from 'primeng/primeng';
import {RatingModule} from 'primeng/primeng';
import {ScheduleModule} from 'primeng/primeng';
import {SelectButtonModule} from 'primeng/primeng';
import {SidebarModule} from 'primeng/primeng';
import {SlideMenuModule} from 'primeng/primeng';
import {SliderModule} from 'primeng/primeng';
import {SpinnerModule} from 'primeng/primeng';
import {SplitButtonModule} from 'primeng/primeng';
import {StepsModule} from 'primeng/primeng';
import {TabMenuModule} from 'primeng/primeng';
import {TabViewModule} from 'primeng/primeng';
import {TerminalModule} from 'primeng/primeng';
import {TieredMenuModule} from 'primeng/primeng';
import {ToggleButtonModule} from 'primeng/primeng';
import {ToolbarModule} from 'primeng/primeng';
import {TooltipModule} from 'primeng/primeng';
import {TreeModule} from 'primeng/primeng';
import {TreeTableModule} from 'primeng/primeng';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
import {AppComponent} from './app.component';
import {AppMenuComponent, AppSubMenuComponent} from './app.menu.component';
import {AppTopbarComponent} from './app.topbar.component';
import {AppFooterComponent} from './app.footer.component';
import {AppRightpanelComponent} from './app.rightpanel.component';
import {AppInlineProfileComponent} from './app.profile.component';
import {DashboardDemoComponent} from './demo/view/dashboarddemo.component';
import {SampleDemoComponent} from './demo/view/sampledemo.component';
import {FormsDemoComponent} from './demo/view/formsdemo.component';
import {DataDemoComponent} from './demo/view/datademo.component';
import {PanelsDemoComponent} from './demo/view/panelsdemo.component';
import {OverlaysDemoComponent} from './demo/view/overlaysdemo.component';
import {MenusDemoComponent} from './demo/view/menusdemo.component';
import {MessagesDemoComponent} from './demo/view/messagesdemo.component';
import {MiscDemoComponent} from './demo/view/miscdemo.component';
import {EmptyDemoComponent} from './demo/view/emptydemo.component';
import {ChartsDemoComponent} from './demo/view/chartsdemo.component';
import {FileDemoComponent} from './demo/view/filedemo.component';
import {UtilsDemoComponent} from './demo/view/utilsdemo.component';
import {DocumentationComponent} from './demo/view/documentation.component';
import {PocComponent} from './demo/view/poc.component';
import {PocMapComponent} from './demo/view/poc.map';
import {ParkedComponent} from './demo/view/parked.component';
import {GfGeoService} from './models/gf-geo/gf-geo.service';
import {MetricService} from './val-modules/common/services/metric.service';
import {CountryService} from './demo/service/countryservice';
import {EventService} from './demo/service/eventservice';
import {NodeService} from './demo/service/nodeservice';
import {ValLayerService} from './services/app-layer.service';
import {EsriModules, EsriLoaderToken} from './esri-modules/core/esri-modules.service';
import {UserService} from './services/user.service';
import {EsriMapComponent} from './components/esri-map/esri-map.component';
import {TargetingModule} from './val-modules/targeting/targeting.module';
import {GeofootprintGeoListComponent} from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import {GeocoderComponent} from './components/geocoder/geocoder.component';
import {BusinessSearchComponent} from './components/business-search/business-search.component';
import {GeofootprintComponent} from './components/geofootprint/geofootprint.component';
import {EsriLayerSelectComponent} from './components/esri-layer-select/esri-layer-select.component';
import {EsriMapToolsComponent} from './components/esri-map-tools/esri-map-tools.component';
import {MapService} from './services/map.service';
import {GeoprocessingComponent} from './components/geoprocessing/geoprocessing.component';
import {ColorBoxComponent} from './components/color-box/color-box.component';
import {MessageComponent} from './val-modules/common/components/message.component';
import {AppService} from './services/app.service';
import {RaddataComponent} from './components/raddata/raddata.component';
import {TradeareaDefineComponent} from './components/tradearea-define/tradearea-define.component';
import {DiscoveryInputComponent} from './components/discovery-input/discovery-input.component';
import {UploadLocationsComponent} from './components/upload-locations/upload-locations.component';
import {RestDataService} from './val-modules/common/services/restdata.service';
import {GeocoderService} from './services/geocoder.service';
import {ImpProjectService} from './val-modules/targeting/services/ImpProject.service';
import {ImpProjectPrefService} from './val-modules/targeting/services/ImpProjectPref.service';
import {ImpClientLocationService} from './val-modules/client/services/ImpClientLocation.service';
import {ImpGeofootprintLocationService} from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import {ImpGeofootprintTradeAreaService} from './val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import {ImpGeofootprintGeoService} from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import {ImpGeofootprintLocAttribService} from './val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import {ImpGeofootprintGeoAttribService} from './val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import {EsriMapService} from './esri-modules/core/esri-map.service';
import {EsriIdentityService} from './services/esri-identity.service';
import { TopVarService } from './services/top-var.service';
import { DemoVariablesComponent } from './components/target-audience/demo-variables/demo-variables.component';
import { GeocodingResponseService } from './val-modules/targeting/services/GeocodingResponse.service';
import { ImpDiscoveryService } from './services/ImpDiscoveryUI.service';
import { GeoFootPrint } from './services/geofootprint.service';
import { RadService } from './services/rad.service';
import { TargetAudienceService } from './services/target-audience.service';
import { ValGeocodingService } from './services/app-geocoding.service';
import { SiteListComponent } from './components/site-list/site-list.component';
import { ValSiteListService } from './services/app-site-list.service';
import { ValTradeAreaService } from './services/app-trade-area.service';
import { CookieService } from 'ngx-cookie-service';
import { ValMapService } from './services/app-map.service';
import { EsriLayerService } from './esri-modules/layers/esri-layer.service';
import { ValGeoService } from './services/app-geo.service';
import { EsriQueryService } from './esri-modules/layers/esri-query.service';
import { ValMetricsService } from './services/app-metrics.service';
import { UploadTradeAreasComponent } from './components/upload-tradeareas/upload-tradeareas.component';
@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        AppRoutes,
        HttpModule,
        HttpClientModule,
        BrowserAnimationsModule,
        AccordionModule,
        AutoCompleteModule,
        BreadcrumbModule,
        ButtonModule,
        CalendarModule,
        CarouselModule,
        ColorPickerModule,
        ChartModule,
        CheckboxModule,
        ChipsModule,
        CodeHighlighterModule,
        ConfirmDialogModule,
        SharedModule,
        ContextMenuModule,
        DataGridModule,
        DataListModule,
        DataScrollerModule,
        DataTableModule,
        DialogModule,
        DragDropModule,
        DropdownModule,
        EditorModule,
        FieldsetModule,
        FileUploadModule,
        GalleriaModule,
        GMapModule,
        GrowlModule,
        InputMaskModule,
        InputSwitchModule,
        InputTextModule,
        InputTextareaModule,
        LightboxModule,
        ListboxModule,
        MegaMenuModule,
        MenuModule,
        MenubarModule,
        MessagesModule,
        MultiSelectModule,
        OrderListModule,
        OrganizationChartModule,
        OverlayPanelModule,
        PaginatorModule,
        PanelModule,
        PanelMenuModule,
        PasswordModule,
        PickListModule,
        ProgressBarModule,
        ProgressSpinnerModule,
        RadioButtonModule,
        RatingModule,
        ScheduleModule,
        SelectButtonModule,
        SidebarModule,
        SlideMenuModule,
        SliderModule,
        SpinnerModule,
        SplitButtonModule,
        StepsModule,
        TabMenuModule,
        TabViewModule,
        TerminalModule,
        TieredMenuModule,
        ToggleButtonModule,
        ToolbarModule,
        TooltipModule,
        TreeModule,
        TreeTableModule,
        TargetingModule,
        CommonModule
    ],
    declarations: [
        AppComponent,
        AppMenuComponent,
        AppSubMenuComponent,
        AppTopbarComponent,
        AppFooterComponent,
        AppRightpanelComponent,
        AppInlineProfileComponent,
        DashboardDemoComponent,
        EsriMapComponent,
        SampleDemoComponent,
        FormsDemoComponent,
        GeofootprintGeoListComponent,
        GeocoderComponent,
        GeofootprintComponent,
        DataDemoComponent,
        PanelsDemoComponent,
        OverlaysDemoComponent,
        MenusDemoComponent,
        PocComponent,
        PocMapComponent,
        ParkedComponent,
        MessageComponent,
        MessagesDemoComponent,
        MiscDemoComponent,
        ChartsDemoComponent,
        EmptyDemoComponent,
        FileDemoComponent,
        UtilsDemoComponent,
        DocumentationComponent,
        BusinessSearchComponent,
        EsriLayerSelectComponent,
        EsriMapToolsComponent,
        GeoprocessingComponent,
        ColorBoxComponent,
        SiteListComponent,
        RaddataComponent,
        TradeareaDefineComponent,
        DiscoveryInputComponent,
        UploadLocationsComponent,
        DemoVariablesComponent,
        LoginComponent,
        UploadTradeAreasComponent
    ],
    providers: [
        {provide: LocationStrategy, useClass: HashLocationStrategy},
        AppService, AppConfig, MessageService,
        CountryService, EventService, NodeService,
        GfGeoService, MapService, RestDataService,
        MetricService, EsriModules, ValLayerService,
        AppState, GeocoderService, GeocodingResponseService,
        ImpProjectService, ImpProjectPrefService, ImpClientLocationService,
        ImpGeofootprintLocationService, ImpGeofootprintTradeAreaService, ImpGeofootprintGeoService,
        EsriMapService, EsriIdentityService, ImpGeofootprintLocAttribService,
        ImpDiscoveryService, GeoFootPrint, EsriLayerService,
        {provide: EsriLoaderToken, useClass: AppConfig}, AuthService, ConfirmationService,
        TopVarService, RadService, TargetAudienceService, ImpGeofootprintGeoAttribService,
        UserService, ValGeocodingService, ValSiteListService, ValTradeAreaService,
        CookieService, ValMapService, ValGeoService, EsriQueryService,
        ValMetricsService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
