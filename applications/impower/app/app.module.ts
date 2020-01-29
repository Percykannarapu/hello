import { CommonModule, HashLocationStrategy, LocationStrategy } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Action, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EsriModule } from '@val/esri';
import { MessagingModule } from '@val/messaging';
import { NgStringPipesModule } from 'angular-pipes';
import { CookieService } from 'ngx-cookie-service';
import { AccordionModule } from 'primeng/accordion';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { MessageService } from 'primeng/components/common/messageservice';
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
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { SelectButtonModule } from 'primeng/selectbutton';
import { SharedModule } from 'primeng/shared';
import { SidebarModule } from 'primeng/sidebar';
import { SlideMenuModule } from 'primeng/slidemenu';
import { SliderModule } from 'primeng/slider';
import { SpinnerModule } from 'primeng/spinner';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { environment, EnvironmentData } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppConfig } from './app.config';
import { AppRoutes } from './app.routes';
import { AddLocationsTabComponent } from './components/add-locations-tab/add-locations-tab.component';
import { BusinessSearchComponent } from './components/add-locations-tab/business-search/business-search.component';
import { ManualEntryComponent } from './components/add-locations-tab/manual-entry/manual-entry.component';
import { UploadLocationsComponent } from './components/add-locations-tab/upload-locations/upload-locations.component';
import { BatchMapDialogComponent } from './components/batch-map-dialog/batch-map-dialog.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { DiscoveryInputComponent } from './components/campaign-details/discovery-input/discovery-input.component';
import { ColorBoxComponent } from './components/color-box/color-box.component';
import { BooleanInputComponent } from './components/common/boolean-input/boolean-input.component';
import { ConfirmationContainerComponent } from './components/common/confirmation-dialog/confirmation-container.component';
import { ConfirmationDialogComponent } from './components/common/confirmation-dialog/confirmation-dialog.component';
import { ConnectFormDirective } from './components/common/connect-form.directive';
import { DropdownInputComponent } from './components/common/dropdown-input/dropdown-input.component';
import { FailedGeocodeGridComponent } from './components/common/failed-geocode-grid/failed-geocode-grid.component';
import { SiteTypeSelectorComponent } from './components/common/site-type-selector/site-type-selector.component';
import { TableFilterLovComponent } from './components/common/table-filter-lov/table-filter-lov.component';
import { TableFilterNumericComponent } from './components/common/table-filter-numeric/table-filter-numeric.component';
import { ValidatedTextInputComponent } from './components/common/validated-text-input/validated-text-input.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { EditLocationsComponent } from './components/edit-locations/edit-locations.component';
import { ExportCrossbowSitesComponent } from './components/export-crossbow-sites/export-crossbow-sites.component';
import { FailedLocationsTabComponent } from './components/failed-locations-tab/failed-locations-tab.component';
import { AppFooterComponent } from './components/frame/app.footer.component';
import { AppHeaderComponent } from './components/frame/app.header.component';
import { AppMenuComponent, AppSubMenuComponent } from './components/frame/app.menu.component';
import { GeofootprintGeoListComponent } from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import { GeofootprintGeoPanelComponent } from './components/geofootprint-geo-panel/geofootprint-geo-panel.component';
import { ImpowerMainComponent } from './components/impower-main/impower-main.component';
import { LoginComponent } from './components/login/login.component';
import { MapComponent } from './components/map/map.component';
import { PrintViewComponent } from './components/print-view/print-view.component';
import { ProjectComponent } from './components/project-dashboard/project.component';
import { OwnerSiteShaderComponent } from './components/shading-settings/shading-list/owner-site-shader/owner-site-shader.component';
import { OwnerTradeAreaShaderComponent } from './components/shading-settings/shading-list/owner-trade-area-shader/owner-trade-area-shader.component';
import { SelectedGeoShaderComponent } from './components/shading-settings/shading-list/selected-geo-shader/selected-geo-shader.component';
import { ShadingListComponent } from './components/shading-settings/shading-list/shading-list.component';
import { VariableShadingComponent } from './components/shading-settings/shading-list/variable-shading/variable-shading.component';
import { ShadingSettingsComponent } from './components/shading-settings/shading-settings.component';
import { SiteListContainerComponent } from './components/site-list-container/site-list-container.component';
import { SiteListComponent } from './components/site-list/site-list.component';
import { CombinedAudienceComponent } from './components/target-audience/combined-audience/combined-audience.component';
import { EditCombinedAudiencesComponent } from './components/target-audience/combined-audience/edit-combined-audiences/edit-combined-audiences.component';
import { CustomAudienceComponent } from './components/target-audience/custom-audience/custom-audience.component';
import { OfflineAudienceTdaComponent } from './components/target-audience/offline-audience-tda/offline-audience-tda.component';
import { OnlineAudienceApioComponent } from './components/target-audience/online-audience-apio/online-audience-apio.component';
import { OnlineAudiencePixelComponent } from './components/target-audience/online-audience-pixel/online-audience-pixel.component';
import { OnlineAudienceVlhComponent } from './components/target-audience/online-audience-vlh/online-audience-vlh.component';
import { SelectedAudiencesComponent } from './components/target-audience/selected-audiences/selected-audiences.component';
import { TargetAudienceComponent } from './components/target-audience/target-audience.component';
import { AudienceTradeareaComponent } from './components/trade-area-tab/audience-tradearea/audience-tradearea.component';
import { DistanceTradeAreaComponent } from './components/trade-area-tab/distance-trade-area/distance-trade-area.component';
import { TradeAreaTabComponent } from './components/trade-area-tab/trade-area-tab.component';
import { UploadMustCoverComponent } from './components/trade-area-tab/upload-must-cover/upload-must-cover.component';
import { UploadTradeAreasComponent } from './components/trade-area-tab/upload-tradeareas/upload-tradeareas.component';
import { ImpowerDatastoreModule } from './impower-datastore/impower-datastore.module';
import { PocComponent } from './poc/poc.component';
import { PocMapComponent } from './poc/poc.map';
import { SampleComponent } from './poc/sample/sample.component';
import { ValAudienceTradeareaService } from './services/app-audience-tradearea.service';
import { AppBusinessSearchService } from './services/app-business-search.service';
import { AppDiscoveryService } from './services/app-discovery.service';
import { AppEditSiteService } from './services/app-editsite.service';
import { AppGeocodingService } from './services/app-geocoding.service';
import { AppLayerService } from './services/app-layer.service';
import { AppMapService } from './services/app-map.service';
import { AppMessagingService } from './services/app-messaging.service';
import { ValMetricsService } from './services/app-metrics.service';
import { AppProjectService } from './services/app-project.service';
import { AppRendererService } from './services/app-renderer.service';
import { AppTradeAreaService } from './services/app-trade-area.service';
import { AuthService } from './services/auth.service';
import { RadService } from './services/rad.service';
import { TargetAudienceService } from './services/target-audience.service';
import { UsageService } from './services/usage.service';
import { UserService } from './services/user.service';
import { appMetaReducers, appReducer } from './state/app.reducer';
import { CustomSerializer } from './state/shared/router.serializer';
import { StateModule } from './state/state.module';
import { ImpClientLocationService } from './val-modules/client/services/ImpClientLocation.service';
import { MessageComponent } from './val-modules/common/components/message.component';
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';
import { MetricService } from './val-modules/common/services/metric.service';
import { RestDataInterceptor, RestDataService } from './val-modules/common/services/restdata.service';
import { TransactionManager } from './val-modules/common/services/TransactionManager.service';
import { ImpMetricNameService } from './val-modules/metrics/services/ImpMetricName.service';
import { ImpGeofootprintGeoService } from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from './val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintMasterService } from './val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpGeofootprintTradeAreaService } from './val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintVarService } from './val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpProjectService } from './val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from './val-modules/targeting/services/ImpProjectPref.service';
import { ImpProjectVarService } from './val-modules/targeting/services/ImpProjectVar.service';
import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';
import { TargetingModule } from './val-modules/targeting/targeting.module';

export function stateSanitizer() : any {
  return {};
}

export function actionSanitizer(action: Action) : Action {
  return { type: action.type };
}

@NgModule({
  imports: [
    StoreModule.forRoot(appReducer, {
      metaReducers: appMetaReducers,
      runtimeChecks: {
        strictStateImmutability: false,
        strictActionImmutability: false,
        strictStateSerializability: false,
        strictActionSerializability: false
      }
    }),
    EffectsModule.forRoot([]),
    MessagingModule.forRoot(AppMessagingService),
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
    StateModule.forRoot(),
    ImpowerDatastoreModule.forRoot(),
    StoreRouterConnectingModule.forRoot(),
    StoreDevtoolsModule.instrument({
      name: 'imPower Application',
      logOnly: environment.production,
      actionsBlocklist: ['Usage', 'Map View Changed'],
      stateSanitizer: environment.production ? stateSanitizer : undefined,
      actionSanitizer: environment.production ? actionSanitizer : undefined,
    }),
    AppRoutes,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
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
    SidebarModule
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
    BatchMapDialogComponent,
    CombinedAudienceComponent,
    EditCombinedAudiencesComponent,
    FailedLocationsTabComponent,
    ExportCrossbowSitesComponent,
    ConnectFormDirective,
    ShadingListComponent,
    VariableShadingComponent,
    ValidatedTextInputComponent,
    BooleanInputComponent,
    SelectedGeoShaderComponent,
    OwnerSiteShaderComponent,
    OwnerTradeAreaShaderComponent,
    DropdownInputComponent
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomSerializer },
    { provide: LocationStrategy, useClass: HashLocationStrategy },
    { provide: HTTP_INTERCEPTORS, useClass: RestDataInterceptor, multi: true },
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
