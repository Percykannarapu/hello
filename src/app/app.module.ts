import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { AppConfig } from './app.config';
import { AppRoutes } from './app.routes';
import { AppState } from './app.state';
import {
  AccordionModule,
  AutoCompleteModule,
  BreadcrumbModule,
  ButtonModule,
  CalendarModule,
  CarouselModule,
  ChartModule,
  CheckboxModule,
  ChipsModule,
  CodeHighlighterModule,
  ColorPickerModule,
  ConfirmDialogModule,
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
  InputTextareaModule,
  InputTextModule,
  LightboxModule,
  ListboxModule,
  MegaMenuModule,
  MenubarModule,
  MenuModule,
  MessagesModule,
  MultiSelectModule,
  OrderListModule,
  OrganizationChartModule,
  OverlayPanelModule,
  PaginatorModule,
  PanelMenuModule,
  PanelModule,
  PasswordModule,
  PickListModule,
  ProgressBarModule,
  ProgressSpinnerModule,
  RadioButtonModule,
  RatingModule,
  ScheduleModule,
  SelectButtonModule,
  SharedModule,
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
  TreeTableModule
} from 'primeng/primeng';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
import { AppComponent } from './app.component';
import { AppMenuComponent, AppSubMenuComponent } from './app.menu.component';
import { AppTopbarComponent } from './app.topbar.component';
import { AppFooterComponent } from './app.footer.component';
import { AppRightpanelComponent } from './app.rightpanel.component';
import { AppInlineProfileComponent } from './app.profile.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AppLayerService } from './services/app-layer.service';
import { EsriModules } from './esri-modules/core/esri-modules.service';
import { UserService } from './services/user.service';
import { EsriMapComponent } from './components/esri-map/esri-map.component';
import { TargetingModule } from './val-modules/targeting/targeting.module';
import { GeofootprintGeoListComponent } from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import { GeocoderComponent } from './components/geocoder/geocoder.component';
import { BusinessSearchComponent } from './components/business-search/business-search.component';
import { EsriLayerSelectComponent } from './components/esri-layer-select/esri-layer-select.component';
import { EsriMapToolsComponent } from './components/esri-map-tools/esri-map-tools.component';
import { MapService } from './services/map.service';
import { ColorBoxComponent } from './components/color-box/color-box.component';
import { MessageComponent } from './val-modules/common/components/message.component';
import { AppBusinessSearchService } from './services/app-business-search.service';
import { TradeAreaDefineComponent } from './components/tradearea-define/trade-area-define.component';
import { DiscoveryInputComponent } from './components/discovery-input/discovery-input.component';
import { UploadLocationsComponent } from './components/upload-locations/upload-locations.component';
import { RestDataInterceptor, RestDataService } from './val-modules/common/services/restdata.service';
import { TransactionManager } from './val-modules/common/services/TransactionManager.service';
import { ImpProjectService } from './val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from './val-modules/targeting/services/ImpProjectPref.service';
import { ImpClientLocationService } from './val-modules/client/services/ImpClientLocation.service';
import { ImpGeofootprintMasterService } from './val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpGeofootprintLocationService } from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from './val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintGeoService } from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocAttribService } from './val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintGeoAttribService } from './val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { EsriMapService } from './esri-modules/core/esri-map.service';
import { EsriIdentityService } from './services/esri-identity.service';
import { TargetAudienceService } from './services/target-audience.service';
import { ImpDiscoveryService } from './services/ImpDiscoveryUI.service';
import { RadService } from './services/rad.service';
import { TargetAudienceMetricService } from './services/target-audience-metric.service';
import { AppGeocodingService } from './services/app-geocoding.service';
import { SiteListComponent } from './components/site-list/site-list.component';
import { AppTradeAreaService } from './services/app-trade-area.service';
import { CookieService } from 'ngx-cookie-service';
import { AppMapService } from './services/app-map.service';
import { EsriLayerService } from './esri-modules/layers/esri-layer.service';
import { EsriQueryService } from './esri-modules/layers/esri-query.service';
import { ValMetricsService } from './services/app-metrics.service';
import { UploadTradeAreasComponent } from './components/upload-tradeareas/upload-tradeareas.component';
import { OfflineAudienceTdaComponent } from './components/target-audience/offline-audience-tda/offline-audience-tda.component';
import { UsageService } from './services/usage.service';
import { SelectedAudiencesComponent } from './components/target-audience/selected-audiences/selected-audiences.component';
import { AppMessagingService } from './services/app-messaging.service';
import { AppRendererService } from './services/app-renderer.service';
import { ImpMetricNameService } from './val-modules/metrics/services/ImpMetricName.service';
import { EsriLoaderToken } from './esri-modules/configuration';
import { PocComponent } from './poc/poc.component';
import { PocMapComponent } from './poc/poc.map';
import { MetricService } from './val-modules/common/services/metric.service';
import { MapDispatchService } from './services/map-dispatch.service';
import { ImpGeofootprintVarService } from './val-modules/targeting/services/ImpGeofootprintVar.service';
import { AppProjectService } from './services/app-project.service';
import { CustomAudienceComponent } from './components/target-audience/custom-audience/custom-audience.component';
import { TargetAudienceComponent } from './components/target-audience/target-audience.component';
import { AudienceTradeareaComponent } from './components/audience-tradearea/audience-tradearea.component';
import { ValAudienceTradeareaService } from './services/app-audience-tradearea.service';
import { OnlineAudienceApioComponent } from './components/target-audience/online-audience-apio/online-audience-apio.component';
import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
import { ImpProjectTrackerService } from './val-modules/targeting/services/ImpProjectTracker.service';
import { ProjectComponent } from './components/project-dashboard/project.component';

@NgModule({
    imports: [
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutes,
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
        DashboardComponent,
        PocComponent,
        PocMapComponent,
        EsriMapComponent,
        GeofootprintGeoListComponent,
        GeocoderComponent,
        MessageComponent,
        BusinessSearchComponent,
        EsriLayerSelectComponent,
        EsriMapToolsComponent,
        ColorBoxComponent,
        SiteListComponent,
        TradeAreaDefineComponent,
        DiscoveryInputComponent,
        UploadLocationsComponent,
        LoginComponent,
        UploadTradeAreasComponent,
        OfflineAudienceTdaComponent,
        SelectedAudiencesComponent,
        CustomAudienceComponent,
        TargetAudienceComponent,
        OnlineAudienceApioComponent,
        AudienceTradeareaComponent,
        ProjectComponent
    ],
    providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy},
      {provide: HTTP_INTERCEPTORS, useClass: RestDataInterceptor, multi: true},
      // from esri-modules
      {provide: EsriLoaderToken, useClass: AppConfig},
      EsriModules, EsriIdentityService, EsriMapService, EsriLayerService, EsriQueryService,
      // from val-modules
      ImpProjectService, ImpGeofootprintMasterService, ImpProjectPrefService, ImpClientLocationService,
      ImpGeofootprintLocationService, ImpGeofootprintTradeAreaService, ImpGeofootprintGeoService, ImpGeofootprintVarService,
      ImpGeofootprintLocAttribService, ImpDiscoveryService, ImpGeofootprintGeoAttribService, ImpMetricNameService,
      MetricService, RestDataService, TransactionManager,
      // from primeng
      MessageService, ConfirmationService,
      // from ngx-cookie-service
      CookieService,
      // from main application
      AppBusinessSearchService, AppConfig, AppState, AppProjectService, AppMessagingService, AppRendererService,
      MapService, AuthService, MapDispatchService, RadService, UsageService, UserService, ImpRadLookupService,
      TargetAudienceService, TargetAudienceMetricService, ImpProjectTrackerService,
      AppLayerService, AppGeocodingService, AppTradeAreaService,
      AppMapService, ValMetricsService, ValAudienceTradeareaService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }
