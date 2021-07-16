import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { EffectsModule } from '@ngrx/effects';
import { DefaultRouterStateSerializer, RouterStateSerializer, StoreRouterConnectingModule } from '@ngrx/router-store';
import { Action, StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { EsriModule } from '@val/esri';
import { MessagingModule } from '@val/messaging';
import { NgTruncatePipeModule } from 'angular-pipes';
import { CookieService } from 'ngx-cookie-service';
import { AccordionModule } from 'primeng/accordion';
import { ConfirmationService, MessageService, SharedModule } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { FieldsetModule } from 'primeng/fieldset';
import { FileUploadModule } from 'primeng/fileupload';
import { InputMaskModule } from 'primeng/inputmask';
import { InputSwitchModule } from 'primeng/inputswitch';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { KeyFilterModule } from 'primeng/keyfilter';
import { ListboxModule } from 'primeng/listbox';
import { MegaMenuModule } from 'primeng/megamenu';
import { MenuModule } from 'primeng/menu';
import { MenubarModule } from 'primeng/menubar';
import { MessageModule } from 'primeng/message';
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
import { SidebarModule } from 'primeng/sidebar';
import { SlideMenuModule } from 'primeng/slidemenu';
import { SliderModule } from 'primeng/slider';
import { SpinnerModule } from 'primeng/spinner';
import { SplitButtonModule } from 'primeng/splitbutton';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { TabMenuModule } from 'primeng/tabmenu';
import { TabViewModule } from 'primeng/tabview';
import { TagModule } from 'primeng/tag';
import { TieredMenuModule } from 'primeng/tieredmenu';
import { ToastModule } from 'primeng/toast';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { ToolbarModule } from 'primeng/toolbar';
import { TooltipModule } from 'primeng/tooltip';
import { TreeModule } from 'primeng/tree';
import { TreeTableModule } from 'primeng/treetable';
import { ForRootOptions } from '../../../modules/esri/esri-module-factories';
import { environment, EnvironmentData } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppConfig } from './app.config';
import { AppRoutes } from './app.routes';
import { allInterceptorProviders } from './common/interceptors';
import { AddLocationsTabComponent } from './components/add-locations-tab/add-locations-tab.component';
import { ManualEntryComponent } from './components/add-locations-tab/manual-entry/manual-entry.component';
import { MarketLocationsComponent } from './components/add-locations-tab/market-locations/market-locations.component';
import { UploadLocationsComponent } from './components/add-locations-tab/upload-locations/upload-locations.component';
import { AdminDialogComponent } from './components/admin-dialog/admin-dialog.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { BatchMapDashboardComponent } from './components/batch-map-dashboard/batch-map-dashboard.component';
import { BatchMapDialogComponent } from './components/batch-map-dialog/batch-map-dialog.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { DiscoveryInputComponent } from './components/campaign-details/discovery-input/discovery-input.component';
import { ColorBoxComponent } from './components/color-box/color-box.component';
import { AcsGrantDirective } from './components/common/acs-grant.directive';
import { BooleanInputComponent } from './components/common/boolean-input/boolean-input.component';
import { BrokeredTreeviewComponent } from './components/common/brokered-treeview/brokered-treeview.component';
import { ConfirmationContainerComponent } from './components/common/confirmation-dialog/confirmation-container.component';
import { ConfirmationDialogComponent } from './components/common/confirmation-dialog/confirmation-dialog.component';
import { ConnectFormDirective } from './components/common/connect-form.directive';
import { DropdownInputComponent } from './components/common/dropdown-input/dropdown-input.component';
import { EsriClassBreakInputComponent } from './components/common/esri-class-break-input/esri-class-break-input.component';
import { EsriFillSymbolInputComponent } from './components/common/esri-fill-symbol-input/esri-fill-symbol-input.component';
import { EsriMarkerSymbolInputComponent } from './components/common/esri-marker-symbol-input/esri-marker-symbol-input.component';
import { ExtendedColorPickerComponent } from './components/common/extended-color-picker/extended-color-picker.component';
import { ExtendedPalettePickerComponent } from './components/common/extended-palette-picker/extended-palette-picker.component';
import { FailedGeocodeGridComponent } from './components/common/failed-geocode-grid/failed-geocode-grid.component';
import { MultiselectInputComponent } from './components/common/multiselect-input/multiselect-input.component';
import { PaletteColorPickerComponent } from './components/common/palette-color-picker/palette-color-picker.component';
import { EsriRgb2HexPipe } from './components/common/pipes/esri-rgb-2-hex.pipe';
import { SearchInputComponent } from './components/common/search-input/search-input.component';
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
import { AppMenuComponent } from './components/frame/app.menu.component';
import { GeofootprintGeoListComponent } from './components/geofootprint-geo-list/geofootprint-geo-list.component';
import { GeofootprintGeoPanelComponent } from './components/geofootprint-geo-panel/geofootprint-geo-panel.component';
import { ImpowerHelpComponent } from './components/impower-help/impower-help.component';
import { ImpowerMainComponent } from './components/impower-main/impower-main.component';
import { BoundaryListComponent } from './components/map-settings-sidebar/boundary-list/boundary-list.component';
import { BoundaryShaderComponent } from './components/map-settings-sidebar/boundary-list/boundary-shader/boundary-shader.component';
import { LocationListComponent } from './components/map-settings-sidebar/location-list/location-list.component';
import { LocationShaderComponent } from './components/map-settings-sidebar/location-list/location-shader/location-shader.component';
import { SimpleLocationShaderComponent } from './components/map-settings-sidebar/location-list/location-shader/simple-location-shader/simple-location-shader.component';
import { UniqueValueLocationShaderComponent } from './components/map-settings-sidebar/location-list/location-shader/unique-value-location-shader/unique-value-location-shader.component';
import { VisualRadiiComponent } from './components/map-settings-sidebar/location-list/location-shader/visual-radii/visual-radii.component';
import { MapSettingsSidebarComponent } from './components/map-settings-sidebar/map-settings-sidebar.component';
import { AddShaderButtonComponent } from './components/map-settings-sidebar/shader-list/add-shader-button/add-shader-button.component';
import { OwnerSiteShaderComponent } from './components/map-settings-sidebar/shader-list/owner-site-shader/owner-site-shader.component';
import { OwnerTradeAreaShaderComponent } from './components/map-settings-sidebar/shader-list/owner-trade-area-shader/owner-trade-area-shader.component';
import { SelectedGeoShaderComponent } from './components/map-settings-sidebar/shader-list/selected-geo-shader/selected-geo-shader.component';
import { ShaderListComponent } from './components/map-settings-sidebar/shader-list/shader-list.component';
import { BreaksVariableShaderComponent } from './components/map-settings-sidebar/shader-list/variable-shader/breaks-variable-shader/breaks-variable-shader.component';
import { DensityVariableShaderComponent } from './components/map-settings-sidebar/shader-list/variable-shader/density-variable-shader/density-variable-shader.component';
import { RampVariableShaderComponent } from './components/map-settings-sidebar/shader-list/variable-shader/ramp-variable-shader/ramp-variable-shader.component';
import { UniqueVariableShaderComponent } from './components/map-settings-sidebar/shader-list/variable-shader/unique-variable-shader/unique-variable-shader.component';
import { VariableShaderComponent } from './components/map-settings-sidebar/shader-list/variable-shader/variable-shader.component';
import { MapComponent } from './components/map/map.component';
import { MarketGeosComponent } from './components/market-geos/market-geos.component';
import { ProjectComponent } from './components/project-dashboard/project.component';
import { SendSitesDigitalComponent } from './components/send-sites-digital/send-sites-digital.component';
import { SiteListContainerComponent } from './components/site-list-container/site-list-container.component';
import { SiteListComponent } from './components/site-list/site-list.component';
import { AudiencesCustomComponent } from './components/target-audience/audiences-custom/audiences-custom.component';
import { CombinedAudienceComponent } from './components/target-audience/audiences-custom/combined-audience/combined-audience.component';
import { EditCombinedAudiencesComponent } from './components/target-audience/audiences-custom/combined-audience/edit-combined-audiences/edit-combined-audiences.component';
import { CompositeAudienceComponent } from './components/target-audience/audiences-custom/composite-audience/composite-audience.component';
import { EditCompositeAudiencesComponent } from './components/target-audience/audiences-custom/composite-audience/edit-composite-audiences/edit-composite-audiences.component';
import { CustomAudienceComponent } from './components/target-audience/audiences-custom/custom-audience/custom-audience.component';
import { AudiencesOfflineComponent } from './components/target-audience/audiences-offline/audiences-offline.component';
import { OfflineAudienceTdaComponent } from './components/target-audience/audiences-offline/offline-audience-tda/offline-audience-tda.component';
import { AudiencesOnlineComponent } from './components/target-audience/audiences-online/audiences-online.component';
import { OnlineAudienceApioComponent } from './components/target-audience/audiences-online/online-audience-apio/online-audience-apio.component';
import { OnlineAudiencePixelComponent } from './components/target-audience/audiences-online/online-audience-pixel/online-audience-pixel.component';
import { OnlineAudienceVlhComponent } from './components/target-audience/audiences-online/online-audience-vlh/online-audience-vlh.component';
import { SelectedAudiencesComponent } from './components/target-audience/selected-audiences/selected-audiences.component';
import { TargetAudienceComponent } from './components/target-audience/target-audience.component';
import { DistanceTradeAreaComponent } from './components/trade-area-tab/distance-trade-area/distance-trade-area.component';
import { RadiusEntryComponent } from './components/trade-area-tab/distance-trade-area/radius-entry/radius-entry.component';
import { TradeAreaTabComponent } from './components/trade-area-tab/trade-area-tab.component';
import { UploadMustCoverComponent } from './components/trade-area-tab/upload-must-cover/upload-must-cover.component';
import { UploadTradeAreasComponent } from './components/trade-area-tab/upload-tradeareas/upload-tradeareas.component';
import { ImpowerDatastoreModule } from './impower-datastore/impower-datastore.module';
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
import { BatchMapAuthService } from './services/batch-map-auth-service';
import { RadService } from './services/rad.service';
import { UsageService } from './services/usage.service';
import { UserService } from './services/user.service';
import { appMetaReducers, appReducer } from './state/app.reducer';
import { CustomSerializer } from './state/shared/router.serializer';
import { StateModule } from './state/state.module';
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';
import { MetricService } from './val-modules/common/services/metric.service';
import { RestDataService } from './val-modules/common/services/restdata.service';
import { TransactionManager } from './val-modules/common/services/TransactionManager.service';
import { ImpMetricNameService } from './val-modules/metrics/services/ImpMetricName.service';
import { ImpGeofootprintGeoService } from './val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from './val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocAttribService } from './val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { ImpGeofootprintMasterService } from './val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpGeofootprintTradeAreaService } from './val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpProjectService } from './val-modules/targeting/services/ImpProject.service';
import { ImpProjectPrefService } from './val-modules/targeting/services/ImpProjectPref.service';
import { ImpRadLookupService } from './val-modules/targeting/services/ImpRadLookup.service';

export function stateSanitizer(state: any) : any {
  if (environment.sanitizeState) {
    return {};
  } else {
    return state;
  }
}

export function actionSanitizer(action: Action) : Action {
  if (environment.sanitizeActions) {
    return { type: action.type };
  } else {
    return action;
  }
}

export function esriSetupFactory() : ForRootOptions {
  return {
    portalServerRootUrl: EnvironmentData.esri.portalServer,
    auth: {
      userName: EnvironmentData.esri.userName,
      password: EnvironmentData.esri.password
    }, app: {
      printServiceUrl: EnvironmentData.serviceUrls.valPrintService,
      logLevel: environment.logLevel
    }
  };
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
    EsriModule.forRoot(esriSetupFactory),
    StateModule.forRoot(),
    ImpowerDatastoreModule.forRoot(),
    StoreRouterConnectingModule.forRoot({ serializer: DefaultRouterStateSerializer }),
    StoreDevtoolsModule.instrument({
      name: 'imPower Application',
      maxAge: 25,
      logOnly: environment.production,
      actionsBlocklist: ['Usage', 'Map View Changed'],
      stateSanitizer: stateSanitizer,
      actionSanitizer: actionSanitizer,
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
    MessageModule,
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
    TagModule,
    TieredMenuModule,
    ToastModule,
    ToggleButtonModule,
    ToolbarModule,
    TooltipModule,
    TreeModule,
    TreeTableModule,
    CommonModule,
    NgTruncatePipeModule,
    CardModule,
    SidebarModule,
    ColorPickerModule,
    DividerModule,
    KeyFilterModule,
    InputTextareaModule
  ],
  declarations: [
    AppComponent,
    AppMenuComponent,
    AppHeaderComponent,
    AppFooterComponent,
    DashboardComponent,
    GeofootprintGeoListComponent,
    GeofootprintGeoPanelComponent,
    ColorBoxComponent,
    SiteListComponent,
    DiscoveryInputComponent,
    UploadLocationsComponent,
    UploadTradeAreasComponent,
    OfflineAudienceTdaComponent,
    SelectedAudiencesComponent,
    CustomAudienceComponent,
    TargetAudienceComponent,
    OnlineAudienceApioComponent,
    ProjectComponent,
    OnlineAudienceVlhComponent,
    OnlineAudiencePixelComponent,
    TradeAreaTabComponent,
    DistanceTradeAreaComponent,
    SiteTypeSelectorComponent,
    AddLocationsTabComponent,
    ManualEntryComponent,
    CampaignDetailsComponent,
    MapComponent,
    TableFilterNumericComponent,
    TableFilterLovComponent,
    SiteListContainerComponent,
    ConfirmationContainerComponent,
    ConfirmationDialogComponent,
    UploadMustCoverComponent,
    BatchMapComponent,
    ImpowerMainComponent,
    MapSettingsSidebarComponent,
    BatchMapDialogComponent,
    CombinedAudienceComponent,
    EditCombinedAudiencesComponent,
    ExportCrossbowSitesComponent,
    ConnectFormDirective,
    ShaderListComponent,
    VariableShaderComponent,
    BooleanInputComponent,
    SelectedGeoShaderComponent,
    OwnerSiteShaderComponent,
    OwnerTradeAreaShaderComponent,
    DropdownInputComponent,
    EsriFillSymbolInputComponent,
    AddShaderButtonComponent,
    RampVariableShaderComponent,
    UniqueVariableShaderComponent,
    DensityVariableShaderComponent,
    BreaksVariableShaderComponent,
    PaletteColorPickerComponent,
    EsriClassBreakInputComponent,
    ValidatedTextInputComponent,
    RadiusEntryComponent,
    BoundaryListComponent,
    LocationListComponent,
    EsriMarkerSymbolInputComponent,
    SendSitesDigitalComponent,
    ExtendedColorPickerComponent,
    LocationShaderComponent,
    CompositeAudienceComponent,
    BoundaryShaderComponent,
    AuthCallbackComponent,
    ExtendedPalettePickerComponent,
    SimpleLocationShaderComponent,
    UniqueValueLocationShaderComponent,
    AudiencesOnlineComponent,
    MarketLocationsComponent,
    MarketGeosComponent,
    MultiselectInputComponent,
    BatchMapDashboardComponent,
    EditCompositeAudiencesComponent,
    AcsGrantDirective,
    AudiencesCustomComponent,
    AudiencesOfflineComponent,
    ImpowerHelpComponent,
    VisualRadiiComponent,
    AdminDialogComponent,
    FailedLocationsTabComponent,
    FailedGeocodeGridComponent,
    EditLocationsComponent,
    SearchInputComponent,
    BrokeredTreeviewComponent,
    EsriRgb2HexPipe
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomSerializer },
    ...allInterceptorProviders,
    // from val-modules
    { provide: LoggingConfigurationToken, useClass: AppConfig },
    ImpProjectService, ImpGeofootprintMasterService, ImpProjectPrefService,
    ImpGeofootprintLocationService, ImpGeofootprintTradeAreaService, ImpGeofootprintGeoService,
    ImpGeofootprintLocAttribService, AppDiscoveryService, ImpMetricNameService,
    MetricService, RestDataService, TransactionManager,
    // from primeng
    MessageService, ConfirmationService,
    // from ngx-cookie-service
    CookieService,
    // from main application
    AppConfig, AppProjectService, AppMessagingService, AppRendererService,
    AuthService, RadService, UsageService, UserService, ImpRadLookupService,
    AppLayerService, AppGeocodingService, AppTradeAreaService,
    AppMapService, ValMetricsService,
    AppEditSiteService, BatchMapAuthService,
    EsriRgb2HexPipe
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
