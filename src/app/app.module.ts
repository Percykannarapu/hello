import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
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
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';
import { TargetingModule } from './val-modules/targeting/targeting.module';
import { GeofootprintGeoListComponent } from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import { BusinessSearchComponent } from './components/business-search/business-search.component';
import { ColorBoxComponent } from './components/color-box/color-box.component';
import { MessageComponent } from './val-modules/common/components/message.component';
import { AppBusinessSearchService } from './services/app-business-search.service';
import { DiscoveryInputComponent } from './components/campaign-details/discovery-input/discovery-input.component';
import { UploadLocationsComponent } from './components/add-locations-tab/upload-locations/upload-locations.component';
import { RestDataInterceptor, RestDataService } from './val-modules/common/services/restdata.service';
import { TransactionManager } from './val-modules/common/services/TransactionManager.service';
import { ImpProjectService } from './val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from './val-modules/targeting/services/ImpProjectPref.service';
import { ImpProjectVarService } from './val-modules/targeting/services/ImpProjectVar.service';
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
import { AppDiscoveryService } from './services/app-discovery.service';
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
import { AudienceTradeareaComponent } from './components/trade-area-tab/audience-tradearea/audience-tradearea.component';
import { ValAudienceTradeareaService } from './services/app-audience-tradearea.service';
import { OnlineAudienceApioComponent } from './components/target-audience/online-audience-apio/online-audience-apio.component';
import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
import { ImpProjectTrackerService } from './val-modules/targeting/services/ImpProjectTracker.service';
import { ProjectComponent } from './components/project-dashboard/project.component';
import { OnlineAudienceVlhComponent } from './components/target-audience/online-audience-vlh/online-audience-vlh.component';
import { OnlineAudiencePixelComponent } from './components/target-audience/online-audience-pixel/online-audience-pixel.component';
import { TradeAreaTabComponent } from './components/trade-area-tab/trade-area-tab.component';
import { DistanceTradeAreaComponent } from './components/trade-area-tab/distance-trade-area/distance-trade-area.component';
import { SiteTypeSelectorComponent } from './components/common/site-type-selector/site-type-selector.component';
import { AddLocationsTabComponent } from './components/add-locations-tab/add-locations-tab.component';
import { FailedGeocodeGridComponent } from './components/common/failed-geocode-grid/failed-geocode-grid.component';
import { ManualEntryComponent } from './components/add-locations-tab/manual-entry/manual-entry.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { MapComponent } from './components/map/map.component';
import { MapToolbarComponent } from './components/map/map-toolbar/map-toolbar.component';
import { ToastModule } from 'primeng/toast';
import { EsriGeographyPopupComponent } from './components/esri-geography-popup/esri-geography-popup.component';
import { SampleComponent } from './poc/sample/sample.component';
import { NgStringPipesModule } from 'angular-pipes';

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
        ScrollPanelModule,
        SelectButtonModule,
        SidebarModule,
        SlideMenuModule,
        SliderModule,
        SpinnerModule,
        SplitButtonModule,
        StepsModule,
        TableModule,
        TabMenuModule,
        TabViewModule,
        TerminalModule,
        TieredMenuModule,
        ToastModule,
        ToggleButtonModule,
        ToolbarModule,
        TooltipModule,
        TreeModule,
        TreeTableModule,
        TargetingModule,
        CommonModule,
        NgStringPipesModule
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
        MessageComponent,
        BusinessSearchComponent,
        ColorBoxComponent,
        SiteListComponent,
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
        ProjectComponent,
        OnlineAudienceVlhComponent,
        OnlineAudiencePixelComponent,
        TradeAreaTabComponent,
        DistanceTradeAreaComponent,
        SiteTypeSelectorComponent,
        AddLocationsTabComponent,
        FailedGeocodeGridComponent,
        ManualEntryComponent,
        CampaignDetailsComponent,
        MapComponent,
        MapToolbarComponent,
        EsriGeographyPopupComponent,
        SampleComponent
    ],
    providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy},
      {provide: HTTP_INTERCEPTORS, useClass: RestDataInterceptor, multi: true},
      // from esri-modules
      {provide: EsriLoaderToken, useClass: AppConfig},
      EsriModules, EsriIdentityService, EsriMapService, EsriLayerService, EsriQueryService,
      // from val-modules
      {provide: LoggingConfigurationToken, useClass: AppConfig},
      ImpProjectService, ImpGeofootprintMasterService, ImpProjectPrefService, ImpProjectVarService, ImpClientLocationService,
      ImpGeofootprintLocationService, ImpGeofootprintTradeAreaService, ImpGeofootprintGeoService, ImpGeofootprintVarService,
      ImpGeofootprintLocAttribService, AppDiscoveryService, ImpGeofootprintGeoAttribService, ImpMetricNameService,
      MetricService, RestDataService, TransactionManager,
      // from primeng
      MessageService, ConfirmationService,
      // from ngx-cookie-service
      CookieService,
      // from main application
      AppBusinessSearchService, AppConfig, AppState, AppProjectService, AppMessagingService, AppRendererService,
      AuthService, MapDispatchService, RadService, UsageService, UserService, ImpRadLookupService,
      TargetAudienceService, TargetAudienceMetricService, ImpProjectTrackerService,
      AppLayerService, AppGeocodingService, AppTradeAreaService,
      AppMapService, ValMetricsService, ValAudienceTradeareaService
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    entryComponents: [EsriGeographyPopupComponent]
})
export class AppModule { }
