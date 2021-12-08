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
import { MessageService, SharedModule } from 'primeng/api';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { BadgeModule } from 'primeng/badge';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ContextMenuModule } from 'primeng/contextmenu';
import { DialogModule } from 'primeng/dialog';
import { DividerModule } from 'primeng/divider';
import { DropdownModule } from 'primeng/dropdown';
import { DynamicDialogModule } from 'primeng/dynamicdialog';
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
import { TriStateCheckboxModule } from 'primeng/tristatecheckbox';
import { ForRootOptions } from '../../../modules/esri/esri-module-factories';
import { environment, EnvironmentData } from '../environments/environment';
import { AppComponent } from './app.component';
import { AppConfig } from './app.config';
import { AppRoutes } from './app.routes';
import { allInterceptorProviders } from './common/interceptors';
import { LocationListComponent } from './components/geo-location-panel/location-list-container/location-list/location-list.component';
import { AddLocationsTabComponent } from './components/locations/add-locations-tab/add-locations-tab.component';
import { ManualEntryComponent } from './components/locations/add-locations-tab/manual-entry/manual-entry.component';
import { MarketLocationsComponent } from './components/locations/add-locations-tab/market-locations/market-locations.component';
import { UploadLocationsComponent } from './components/locations/add-locations-tab/upload-locations/upload-locations.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { BatchMapComponent } from './components/batch-map/batch-map.component';
import { CampaignDetailsComponent } from './components/campaign-details/campaign-details.component';
import { DiscoveryInputComponent } from './components/campaign-details/discovery-input/discovery-input.component';
import { ColorBoxComponent } from './components/main/dashboard/color-box/color-box.component';
import { AcsGrantDirective } from './components/common/acs-grant.directive';
import { BooleanColumnFilterComponent } from './components/common/boolean-column-filter/boolean-column-filter.component';
import { BooleanInputComponent } from './components/common/boolean-input/boolean-input.component';
import { BrokeredTreeviewComponent } from './components/common/brokered-treeview/brokered-treeview.component';
import { ConnectFormDirective } from './components/common/connect-form.directive';
import { DropdownInputComponent } from './components/common/dropdown-input/dropdown-input.component';
import { ElapsedTimeComponent } from './components/common/elapsed-time/elapsed-time.component';
import { EsriClassBreakInputComponent } from './components/common/esri-class-break-input/esri-class-break-input.component';
import { EsriFillSymbolInputComponent } from './components/common/esri-fill-symbol-input/esri-fill-symbol-input.component';
import { EsriMarkerSymbolInputComponent } from './components/common/esri-marker-symbol-input/esri-marker-symbol-input.component';
import { ExtendedColorPickerComponent } from './components/common/extended-color-picker/extended-color-picker.component';
import { ExtendedPalettePickerComponent } from './components/common/extended-palette-picker/extended-palette-picker.component';
import { FailedGeocodeGridComponent } from './components/common/failed-geocode-grid/failed-geocode-grid.component';
import { MultiselectInputComponent } from './components/common/multiselect-input/multiselect-input.component';
import { PaletteColorPickerComponent } from './components/common/palette-color-picker/palette-color-picker.component';
import { AnyToBoolPipe, BoolToStringPipe } from './components/common/pipes/boolean-pipes';
import { EsriRgb2HexPipe } from './components/common/pipes/esri-rgb-2-hex.pipe';
import { StatTableTooltipPipe } from './components/common/pipes/stat-table-tooltip.pipe';
import { SearchInputComponent } from './components/common/search-input/search-input.component';
import { SiteTypeSelectorComponent } from './components/common/site-type-selector/site-type-selector.component';
import { TableFilterLovComponent } from './components/common/table-filter-lov/table-filter-lov.component';
import { ValidatedTextInputComponent } from './components/common/validated-text-input/validated-text-input.component';
import { DashboardComponent } from './components/main/dashboard/dashboard.component';
import { BatchMapAdminComponent } from './components/dialogs/batch-map-admin/batch-map-admin.component';
import { BatchMapRequestComponent } from './components/dialogs/batch-map-request/batch-map-request.component';
import { BatchMapStatusComponent } from './components/dialogs/batch-map-status/batch-map-status.component';
import { EditLocationsComponent } from './components/dialogs/edit-locations/edit-locations.component';
import { ExistingProjectComponent } from './components/dialogs/existing-project/existing-project.component';
import { ExportCrossbowSitesComponent } from './components/dialogs/export-crossbow-sites/export-crossbow-sites.component';
import { ImpowerHelpComponent } from './components/dialogs/impower-help/impower-help.component';
import { ManualGeoDialogComponent } from './components/dialogs/manual-geo-dialog/manual-geo-dialog.component';
import { SendSitesDigitalComponent } from './components/dialogs/send-sites-digital/send-sites-digital.component';
import { FailedLocationsTabComponent } from './components/locations/failed-locations-tab/failed-locations-tab.component';
import { AppFooterComponent } from './components/main/footer/app.footer.component';
import { AppHeaderComponent } from './components/main/header/app.header.component';
import { AppMenuComponent } from './components/main/menu/app.menu.component';
import { GeoListComponent } from './components/geo-location-panel/geo-list-container/geo-list/geo-list.component';
import { GeoListContainerComponent } from './components/geo-location-panel/geo-list-container/geo-list-container.component';
import { ImpowerMainComponent } from './components/main/impower-main.component';
import { BoundaryShaderListComponent } from './components/map-settings-sidebar/boundary-shader-list/boundary-shader-list.component';
import { BoundaryShaderComponent } from './components/map-settings-sidebar/boundary-shader-list/boundary-shader/boundary-shader.component';
import { LocationShaderListComponent } from './components/map-settings-sidebar/location-shader-list/location-shader-list.component';
import { LocationShaderComponent } from './components/map-settings-sidebar/location-shader-list/location-shader/location-shader.component';
import { SimpleLocationShaderComponent } from './components/map-settings-sidebar/location-shader-list/location-shader/simple-location-shader/simple-location-shader.component';
import { UniqueValueLocationShaderComponent } from './components/map-settings-sidebar/location-shader-list/location-shader/unique-value-location-shader/unique-value-location-shader.component';
import { VisualRadiiComponent } from './components/map-settings-sidebar/location-shader-list/location-shader/visual-radii/visual-radii.component';
import { MapSettingsSidebarComponent } from './components/map-settings-sidebar/map-settings-sidebar.component';
import { AddShaderButtonComponent } from './components/map-settings-sidebar/audience-shader-list/add-shader-button/add-shader-button.component';
import { OwnerSiteShaderComponent } from './components/map-settings-sidebar/audience-shader-list/owner-site-shader/owner-site-shader.component';
import { OwnerTradeAreaShaderComponent } from './components/map-settings-sidebar/audience-shader-list/owner-trade-area-shader/owner-trade-area-shader.component';
import { SelectedGeoShaderComponent } from './components/map-settings-sidebar/audience-shader-list/selected-geo-shader/selected-geo-shader.component';
import { AudienceShaderListComponent } from './components/map-settings-sidebar/audience-shader-list/audience-shader-list.component';
import { BreaksVariableShaderComponent } from './components/map-settings-sidebar/audience-shader-list/variable-shader/breaks-variable-shader/breaks-variable-shader.component';
import { DensityVariableShaderComponent } from './components/map-settings-sidebar/audience-shader-list/variable-shader/density-variable-shader/density-variable-shader.component';
import { RampVariableShaderComponent } from './components/map-settings-sidebar/audience-shader-list/variable-shader/ramp-variable-shader/ramp-variable-shader.component';
import { UniqueVariableShaderComponent } from './components/map-settings-sidebar/audience-shader-list/variable-shader/unique-variable-shader/unique-variable-shader.component';
import { VariableShaderComponent } from './components/map-settings-sidebar/audience-shader-list/variable-shader/variable-shader.component';
import { MapComponent } from './components/map/map.component';
import { MarketGeosComponent } from './components/locations/add-locations-tab/market-locations/market-geos/market-geos.component';
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
import { DistanceTradeAreaComponent } from './components/locations/trade-area-tab/distance-trade-area/distance-trade-area.component';
import { RadiusEntryComponent } from './components/locations/trade-area-tab/distance-trade-area/radius-entry/radius-entry.component';
import { TradeAreaTabComponent } from './components/locations/trade-area-tab/trade-area-tab.component';
import { UploadMustCoverComponent } from './components/locations/trade-area-tab/upload-must-cover/upload-must-cover.component';
import { UploadTradeAreasComponent } from './components/locations/trade-area-tab/upload-tradeareas/upload-tradeareas.component';
import { ImpowerDatastoreModule } from './impower-datastore/impower-datastore.module';
import { AppMessagingService } from './services/app-messaging.service';
import { appMetaReducers, appReducer } from './state/app.reducer';
import { CustomSerializer } from './state/shared/router.serializer';
import { StateModule } from './state/state.module';
import { LoggingConfigurationToken } from './val-modules/common/services/logging.service';
import { LocationsComponent } from './components/locations/locations.component';
import { ExportGeoGridComponent } from './components/dialogs/export-geo-grid/export-geo-grid.component';
import { GeoLocationPanelComponent } from './components/geo-location-panel/geo-location-panel.component';
import { LocationListContainerComponent } from './components/geo-location-panel/location-list-container/location-list-container.component';

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
      actionsBlocklist: ['Usage', 'Map View Changed', 'Set Viewpoint'],
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
    InputTextareaModule,
    BadgeModule,
    DynamicDialogModule,
    TriStateCheckboxModule
  ],
  declarations: [
    AppComponent,
    AppMenuComponent,
    AppHeaderComponent,
    AppFooterComponent,
    DashboardComponent,
    GeoListComponent,
    GeoListContainerComponent,
    ColorBoxComponent,
    DiscoveryInputComponent,
    UploadLocationsComponent,
    UploadTradeAreasComponent,
    OfflineAudienceTdaComponent,
    SelectedAudiencesComponent,
    CustomAudienceComponent,
    TargetAudienceComponent,
    OnlineAudienceApioComponent,
    ExistingProjectComponent,
    OnlineAudienceVlhComponent,
    OnlineAudiencePixelComponent,
    TradeAreaTabComponent,
    DistanceTradeAreaComponent,
    SiteTypeSelectorComponent,
    AddLocationsTabComponent,
    ManualEntryComponent,
    CampaignDetailsComponent,
    MapComponent,
    TableFilterLovComponent,
    UploadMustCoverComponent,
    BatchMapComponent,
    ImpowerMainComponent,
    MapSettingsSidebarComponent,
    BatchMapRequestComponent,
    CombinedAudienceComponent,
    EditCombinedAudiencesComponent,
    ExportCrossbowSitesComponent,
    ConnectFormDirective,
    AudienceShaderListComponent,
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
    BoundaryShaderListComponent,
    LocationShaderListComponent,
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
    BatchMapStatusComponent,
    EditCompositeAudiencesComponent,
    AcsGrantDirective,
    AudiencesCustomComponent,
    AudiencesOfflineComponent,
    ImpowerHelpComponent,
    VisualRadiiComponent,
    BatchMapAdminComponent,
    FailedLocationsTabComponent,
    FailedGeocodeGridComponent,
    EditLocationsComponent,
    SearchInputComponent,
    BrokeredTreeviewComponent,
    EsriRgb2HexPipe,
    AnyToBoolPipe,
    BoolToStringPipe,
    BooleanColumnFilterComponent,
    ManualGeoDialogComponent,
    ElapsedTimeComponent,
    StatTableTooltipPipe,
    LocationsComponent,
    ExportGeoGridComponent,
    GeoLocationPanelComponent,
    LocationListContainerComponent,
    LocationListComponent
  ],
  providers: [
    { provide: RouterStateSerializer, useClass: CustomSerializer },
    ...allInterceptorProviders,
    // from val-modules
    { provide: LoggingConfigurationToken, useClass: AppConfig },
    // from primeng
    MessageService,
    // from ngx-cookie-service
    CookieService,
    // pipes
    EsriRgb2HexPipe, AnyToBoolPipe, BoolToStringPipe, StatTableTooltipPipe
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
