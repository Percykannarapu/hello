import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { MessagingModule } from '@val/messaging';
import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DataGridModule } from 'primeng/datagrid';
import { DataListModule } from 'primeng/datalist';
import { DataScrollerModule } from 'primeng/datascroller';
import { DialogModule } from 'primeng/dialog';
import { DropdownModule } from 'primeng/dropdown';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ListboxModule } from 'primeng/listbox';
import { MegaMenuModule } from 'primeng/megamenu';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { MessagesModule } from 'primeng/messages';
import { MultiSelectModule } from 'primeng/multiselect';
import { OrderListModule } from 'primeng/orderlist';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { PaginatorModule } from 'primeng/paginator';
import { PanelModule } from 'primeng/panel';
import { PanelMenuModule } from 'primeng/panelmenu';
import { PasswordModule } from 'primeng/password';
import { PickListModule } from 'primeng/picklist';
import { ProgressBarModule } from 'primeng/progressbar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { RadioButtonModule } from 'primeng/radiobutton';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SharedModule } from 'primeng/shared';
import { SlideMenuModule } from 'primeng/slidemenu';
import { SliderModule } from 'primeng/slider';
import { SpinnerModule } from 'primeng/spinner';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { AppConfig } from './app.config';
import { AppRoutes } from './app.routes';
import { TableModule } from 'primeng/table';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
import { AppComponent } from './app.component';
import { AppMenuComponent, AppSubMenuComponent } from './components/frame/app.menu.component';
import { AppHeaderComponent } from './components/frame/app.header.component';
import { AppFooterComponent } from './components/frame/app.footer.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AppLayerService } from './services/app-layer.service';
import { UserService } from './services/user.service';
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';
import { TargetingModule } from './val-modules/targeting/targeting.module';
import { GeofootprintGeoListComponent } from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import { GeofootprintGeoPanelComponent } from './components/geofootprint-geo-panel/geofootprint-geo-panel.component';
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
import { LoginComponent } from './components/login/login.component';
import { AuthService } from './services/auth.service';
import { TargetAudienceService } from './services/target-audience.service';
import { AppDiscoveryService } from './services/app-discovery.service';
import { RadService } from './services/rad.service';
import { AppGeocodingService } from './services/app-geocoding.service';
import { SiteListComponent } from './components/site-list/site-list.component';
import { AppTradeAreaService } from './services/app-trade-area.service';
import { CookieService } from 'ngx-cookie-service';
import { AppMapService } from './services/app-map.service';
import { ValMetricsService } from './services/app-metrics.service';
import { UploadTradeAreasComponent } from './components/trade-area-tab/upload-tradeareas/upload-tradeareas.component';
import { OfflineAudienceTdaComponent } from './components/target-audience/offline-audience-tda/offline-audience-tda.component';
import { UsageService } from './services/usage.service';
import { SelectedAudiencesComponent } from './components/target-audience/selected-audiences/selected-audiences.component';
import { AppMessagingService } from './services/app-messaging.service';
import { AppRendererService } from './services/app-renderer.service';
import { ImpMetricNameService } from './val-modules/metrics/services/ImpMetricName.service';
import { PocComponent } from './poc/poc.component';
import { PocMapComponent } from './poc/poc.map';
import { MetricService } from './val-modules/common/services/metric.service';
import { ImpGeofootprintVarService } from './val-modules/targeting/services/ImpGeofootprintVar.service';
import { AppProjectService } from './services/app-project.service';
import { CustomAudienceComponent } from './components/target-audience/custom-audience/custom-audience.component';
import { TargetAudienceComponent } from './components/target-audience/target-audience.component';
import { AudienceTradeareaComponent } from './components/trade-area-tab/audience-tradearea/audience-tradearea.component';
import { ValAudienceTradeareaService } from './services/app-audience-tradearea.service';
import { OnlineAudienceApioComponent } from './components/target-audience/online-audience-apio/online-audience-apio.component';
import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
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
import { ToastModule } from 'primeng/toast';
import { SampleComponent } from './poc/sample/sample.component';
import { NgStringPipesModule } from 'angular-pipes';
import { TableFilterNumericComponent } from './components/common/table-filter-numeric/table-filter-numeric.component';
import { TableFilterLovComponent } from './components/common/table-filter-lov/table-filter-lov.component';
import { BusinessSearchComponent } from './components/add-locations-tab/business-search/business-search.component';
import { StateModule } from './state/state.module';
import { SiteListContainerComponent } from './components/site-list-container/site-list-container.component';
import { ConfirmationContainerComponent } from './components/common/confirmation-dialog/confirmation-container.component';
import { ConfirmationDialogComponent } from './components/common/confirmation-dialog/confirmation-dialog.component';
import { ImpowerDatastoreModule } from './impower-datastore/impower-datastore.module';
import { EditLocationsComponent } from './components/edit-locations/edit-locations.component';
import { UploadMustCoverComponent } from './components/trade-area-tab/upload-must-cover/upload-must-cover.component';
import { EsriModule } from '@val/esri';
import { EnvironmentData } from '../environments/environment';
import { AppEditSiteService } from './services/app-editsite.service';
import { PrintViewComponent } from './components/print-view/print-view.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { ImpowerMainComponent } from './components/impower-main/impower-main.component';
import { SidebarModule } from 'primeng/sidebar';
import { ShadingSettingsComponent } from './components/shading-settings/shading-settings.component';
import { BatchMapDialogComponent } from './components/batch-map-dialog/batch-map-dialog.component';

@NgModule({
    imports: [
        StateModule.forRoot(),
        BrowserModule,
        FormsModule,
        ReactiveFormsModule,
        AppRoutes,
        HttpClientModule,
        BrowserAnimationsModule,
        AccordionModule,
        AutoCompleteModule,
        ButtonModule,
        CheckboxModule,
        ConfirmDialogModule,
        SharedModule,
        ContextMenuModule,
        DataGridModule,
        DataListModule,
        DataScrollerModule,
        DialogModule,
        DropdownModule,
        FieldsetModule,
        FileUploadModule,
        InputMaskModule,
        InputSwitchModule,
        InputTextModule,
        InputTextareaModule,
        ListboxModule,
        MegaMenuModule,
        MenuModule,
        MenubarModule,
        MessagesModule,
        MultiSelectModule,
        OrderListModule,
        OverlayPanelModule,
        PaginatorModule,
        PanelModule,
        PanelMenuModule,
        PasswordModule,
        PickListModule,
        ProgressBarModule,
        ProgressSpinnerModule,
        RadioButtonModule,
        ScrollPanelModule,
        SelectButtonModule,
        SlideMenuModule,
        SliderModule,
        SpinnerModule,
        SplitButtonModule,
        StepsModule,
        TableModule,
        TabMenuModule,
        TabViewModule,
        TieredMenuModule,
        ToastModule,
        ToggleButtonModule,
        ToolbarModule,
        TooltipModule,
        TreeModule,
        TreeTableModule,
        TargetingModule,
        CommonModule,
        NgStringPipesModule,
        CardModule,
        SidebarModule,
        EsriModule.forRoot({
          portalServerRootUrl: EnvironmentData.esri.portalServer,
          auth: {
            userName: EnvironmentData.esri.userName,
            password: EnvironmentData.esri.password,
            referer: window.location.origin
          }, app: {
            printServiceUrl: EnvironmentData.serviceUrls.valPrintService,
          }
        }),
        MessagingModule.forRoot(AppMessagingService),
        ImpowerDatastoreModule
    ],
    declarations: [
        AppComponent,
        AppMenuComponent,
        AppSubMenuComponent,
        AppHeaderComponent,
        AppFooterComponent,
        DashboardComponent,
        PocComponent,
        PocMapComponent,
        GeofootprintGeoListComponent,
        GeofootprintGeoPanelComponent,
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
        SampleComponent,
        TableFilterNumericComponent,
        TableFilterLovComponent,
        SiteListContainerComponent,
        ConfirmationContainerComponent,
        ConfirmationDialogComponent,
        UploadMustCoverComponent,
        EditLocationsComponent,
        PrintViewComponent,
        BatchMapComponent,
        ImpowerMainComponent,
        ShadingSettingsComponent,
        BatchMapDialogComponent
    ],
    providers: [
      {provide: LocationStrategy, useClass: HashLocationStrategy},
      {provide: HTTP_INTERCEPTORS, useClass: RestDataInterceptor, multi: true},
      // from val-modules
      {provide: LoggingConfigurationToken, useClass: AppConfig},
      ImpProjectService, ImpGeofootprintMasterService, ImpProjectPrefService, ImpProjectVarService, ImpClientLocationService,
      ImpGeofootprintLocationService, ImpGeofootprintTradeAreaService, ImpGeofootprintGeoService, ImpGeofootprintVarService,
      ImpGeofootprintLocAttribService, AppDiscoveryService, ImpMetricNameService,
      MetricService, RestDataService, TransactionManager,
      // from primeng
      MessageService, ConfirmationService,
      // from ngx-cookie-service
      CookieService,
      // from main application
      AppBusinessSearchService, AppConfig, AppProjectService, AppMessagingService, AppRendererService,
      AuthService, RadService, UsageService, UserService, ImpRadLookupService, TargetAudienceService,
      AppLayerService, AppGeocodingService, AppTradeAreaService,
      AppMapService, ValMetricsService, ValAudienceTradeareaService,
      AppEditSiteService
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
