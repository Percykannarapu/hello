import { Injectable, NgZone } from '@angular/core';
import { geodesicArea, geodesicLength } from '@arcgis/core/geometry/geometryEngine';
import BasemapGallery from '@arcgis/core/widgets/BasemapGallery';
import Home from '@arcgis/core/widgets/Home';
import Legend from '@arcgis/core/widgets/Legend';
import ScaleBar from '@arcgis/core/widgets/ScaleBar';
import Search from '@arcgis/core/widgets/Search';
import { Store } from '@ngrx/store';
import { EsriDomainFactory, EsriLayerService, EsriMapService, EsriQueryService, EsriUtils } from '@val/esri';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { FullAppState } from '../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../state/usage/targeting-usage.actions';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLayerService } from './app-layer.service';
import { AppLoggingService } from './app-logging.service';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppRendererService } from './app-renderer.service';
import { AppStateService, Season } from './app-state.service';

@Injectable()
export class AppMapService {

  public popupSelection$ = new Subject<__esri.Graphic[]>();

  constructor(private appStateService: AppStateService,
              private appLayerService: AppLayerService,
              private rendererService: AppRendererService,
              private componentGenerator: AppComponentGeneratorService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private zone: NgZone,
              private appProjectPrefService: AppProjectPrefService,
              private store$: Store<FullAppState>) {}

  public setupMap(isBatchMapping: boolean = false) : void {
    const homeView = this.mapService.mapView.viewpoint;
    // Create the layer groups and load the portal items

    this.mapService.createBasicWidget(Legend, { }, 'top-right');
    // keep this here to aid in troubleshooting layer-related issues
    // this.mapService.createHiddenWidget(LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List', group: 'map-ui' });
    if (isBatchMapping) {
      // if we're batch mapping, we want no widgets on the UI except for a custom legend
      this.mapService.mapView.ui.remove('zoom');
      return;
    }
    // setup the map widgets
    this.mapService.createBasicWidget(Home, { viewpoint: homeView });
    this.mapService.createHiddenWidget(Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search', group: 'map-ui' });
    const source = EsriDomainFactory.createPortalBasemapSource(this.config.portalBaseMapNames);
    this.mapService.createHiddenWidget(BasemapGallery, { source }, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery', group: 'map-ui' }, 'bottom-left');
    this.mapService.createBasicWidget(ScaleBar, { unit: 'dual' }, 'bottom-left');

    EsriUtils.setupWatch(this.mapService.mapView.map, 'basemap').subscribe(val => this.zone.run(() => {
      this.appProjectPrefService.createPref('esri', 'basemap',  JSON.stringify(val.newValue.toJSON()), 'string');
    }));
    EsriUtils.setupWatch(this.mapService.mapView, 'extent').subscribe(extent => this.zone.run(() => {
      this.appProjectPrefService.createPref('esri', 'extent',  JSON.stringify(extent.newValue.toJSON()), 'string');
    }));

    const popup: __esri.Popup = this.mapService.mapView.popup;
    popup.highlightEnabled = false;
    popup.maxInlineActions = 2;
    popup.defaultPopupTemplateEnabled = false;

    // Event handler that fires each time a popup action is clicked.
    popup.on('trigger-action', (event) => {
      if (event.action.id === 'select-this') {
        this.zone.run(() => {
          this.popupSelection$.next([this.mapService.mapView.popup.selectedFeature]);
        });
      }
    });

    EsriUtils.setupWatch(popup, 'visible').pipe(
      filter(result => result.newValue === false && result.oldValue != null)
    ).subscribe(() => this.componentGenerator.cleanUpGeoPopup());
  }

  public setViewpoint(view: __esri.Viewpoint) : void {
    this.mapService.mapView.viewpoint = view;
  }

  /**
   * This method will create usage metrics each time a user selects/deselects geos manually on the map
   * @param graphic The feature the user manually selected on the map
   * @param selectionType The UI mechanism used to select the feature
   */
  private collectSelectionUsage(graphic: __esri.Graphic, selectionType: string) {
    // const currentProject = this.appStateService.currentProject$.getValue();
    // let hhc: number;
    // const geocode = graphic.attributes.geocode;
    // if (this.appStateService.season$.getValue() === Season.Winter) {
    //   hhc = Number(graphic.attributes.hhld_w);
    // } else {
    //   hhc = Number(graphic.attributes.hhld_s);
    // }
    // let metricText: string;
    // if (currentProject.estimatedBlendedCpm != null) {
    //   const amount: number = hhc * currentProject.estimatedBlendedCpm / 1000;
    //   metricText = `${geocode}~${hhc}~${currentProject.estimatedBlendedCpm}~${amount.toString()}~ui=${selectionType}`;
    // } else {
    //   metricText = `${geocode}~${hhc}~${0}~${0}~ui=${selectionType}`;
    // }
    // if (this.currentGeocodes.has(geocode)) {
    //   if (selectionType === 'multiUnSelectTool' || selectionType === 'popupAction') {
    //     this.currentGeocodes.delete(geocode);
    //     this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'deselected', metricText));
    //   }
    // } else {
    //   if (selectionType === 'multiSelectTool' || selectionType === 'popupAction') {
    //     this.currentGeocodes.add(geocode);
    //     this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'selected', metricText));
    //   }
    // }
  }
}
