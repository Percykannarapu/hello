import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { AppConfig } from '../app.config';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { ValMetricsService } from './app-metrics.service';
import { AppRendererService } from './app-renderer.service';
import { AppStateService, Season } from './app-state.service';
import { debounceTime } from 'rxjs/operators';
import { AppLayerService } from './app-layer.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../state/usage/targeting-usage.actions';
import { EsriApi, EsriLayerService, EsriMapService, EsriQueryService, EsriUtils } from '@val/esri';
import { ErrorNotification } from '../../../../modules/messaging/state/messaging.actions';

export interface GeoClickEvent {
  geocode: string;
  geometry?: {
    x: number;
    y: number;
  };
}

@Injectable()
export class AppMapService implements OnDestroy {
  private geoSelected = new BehaviorSubject<GeoClickEvent[]>([]);
  private clientTradeAreaSubscription: Subscription;
  private competitorTradeAreaSubscription: Subscription;
  private currentGeocodes = new Set<string>();
  private readonly useWebGLHighlighting: boolean;
  private layerSelectionRefresh: () => void;

  public geoSelected$: Observable<GeoClickEvent[]> = this.geoSelected.asObservable();
  public selectedButton: number;
  constructor(private appStateService: AppStateService,
              private appLayerService: AppLayerService,
              private rendererService: AppRendererService,
              private componentGenerator: AppComponentGeneratorService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private store$: Store<LocalAppState>) {
    this.useWebGLHighlighting = this.config.webGLIsAvailable();

    this.appStateService.uniqueSelectedGeocodes$.subscribe(() => {
      if (this.layerSelectionRefresh) this.layerSelectionRefresh();
    });
  }

  ngOnDestroy() : void {
    if (this.clientTradeAreaSubscription) this.clientTradeAreaSubscription.unsubscribe();
    if (this.competitorTradeAreaSubscription) this.competitorTradeAreaSubscription.unsubscribe();
  }

  public setupMap() : void {

    const homeView = this.mapService.mapView.viewpoint;
    // Create the layer groups and load the portal items
    this.appLayerService.initializeLayers().subscribe (
      null,
      null,
      () => {
        // setup the map widgets
        this.mapService.createBasicWidget(EsriApi.widgets.Home, { viewpoint: homeView });
        this.mapService.createHiddenWidget(EsriApi.widgets.Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search', group: 'left-column' });
        this.mapService.createHiddenWidget(EsriApi.widgets.LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List', group: 'left-column' });
        this.mapService.createHiddenWidget(EsriApi.widgets.Legend, {}, { expandIconClass: 'esri-icon-documentation', expandTooltip: 'Legend', group: 'left-column' });
        this.mapService.createHiddenWidget(EsriApi.widgets.BaseMapGallery, {}, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery', group: 'left-column' });
        this.mapService.createBasicWidget(EsriApi.widgets.ScaleBar, { unit: 'dual' }, 'bottom-left');

        const popup: __esri.Popup = this.mapService.mapView.popup;
        popup.actionsMenuEnabled = false;
        if (this.useWebGLHighlighting) {
          popup.highlightEnabled = false;
        }

        // Event handler that fires each time a popup action is clicked.
        popup.on('trigger-action', (event) => {
          // Execute the measureThis() function if the measure-this action is clicked
          if (event.action.id === 'measure-this') {
            this.measureThis();
          }
          // Execute the selectThis() function if the select-this action is clicked
          if (event.action.id === 'select-this') {
            this.selectThis();
          }
        });

        EsriUtils.setupWatch(popup, 'visible').pipe(debounceTime(1000)).subscribe(result => {
          this.logger.debug.log('Popup visible watch fired', result);
          if (result.newValue === false) {
            this.componentGenerator.cleanUpGeoPopup();
          }
        });
    });
  }

  public setViewpoint(view: __esri.Viewpoint) : void {
    this.mapService.mapView.viewpoint = view;
  }

  public selectSingleGeocode(geocode: string, geometry?: { x: number, y: number }) {
    if (geometry == null) {
      const eventData: GeoClickEvent[] = [];
      const centroidLayerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
      this.queryService.queryAttributeIn(centroidLayerId, 'geocode', [geocode], false, ['geocode', 'latitude', 'longitude']).subscribe(
        graphics => {
          if (graphics && graphics.length > 0) {
            const event = {
              geocode: geocode,
              geometry: {
                x: Number(graphics[0].attributes.latitude),
                y: Number(graphics[0].attributes.longitude)
              }
            };
            eventData.push(event);
          }
        },
        err => console.error('There was an error querying for a geocode', err),
        () => {
          this.geoSelected.next(eventData);
        });
    } else {
      this.geoSelected.next([{ geocode, geometry }]);
    }
  }

  public selectMultipleGeocode(graphicsList: __esri.Graphic[], button) {
    const events: GeoClickEvent[] = [];
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue());
    if (layerId == null || layerId.length === 0) return;
    const layer = this.layerService.getPortalLayerById(layerId);
    graphicsList.forEach(graphic => {
      if (graphic.layer === layer) {
        const geocode =  graphic.attributes.geocode;
        const latitude = graphic.attributes.latitude;
        const longitude = graphic.attributes.longitude;
        const point: __esri.Point = new EsriApi.Point({latitude: latitude, longitude: longitude});
        if (button === 8) {
          this.collectSelectionUsage(graphic, 'multiUnSelectTool');
        } else {
          this.collectSelectionUsage(graphic, 'multiSelectTool');
        }
        events.push({ geocode, geometry: point });
      }
    });
    this.selectedButton = button;
    this.geoSelected.next(events);
  }

  /**
   * This method will create usage metrics each time a user selects/deselects geos manually on the map
   * @param graphic The feature the user manually selected on the map
   * @param selectionType The UI mechanism used to select the feature
   */
  private collectSelectionUsage(graphic: __esri.Graphic, selectionType: string) {
    const currentProject = this.appStateService.currentProject$.getValue();
    let hhc: number;
    const geocode = graphic.attributes.geocode;
    if (this.appStateService.season$.getValue() === Season.Winter) {
      hhc = Number(graphic.attributes.hhld_w);
    } else {
      hhc = Number(graphic.attributes.hhld_s);
    }
    let metricText: string;
    if (currentProject.estimatedBlendedCpm != null) {
      const amount: number = hhc * currentProject.estimatedBlendedCpm / 1000;
      metricText = `${geocode}~${hhc}~${currentProject.estimatedBlendedCpm}~${amount.toString()}~ui=${selectionType}`;
    } else {
      metricText = `${geocode}~${hhc}~${0}~${0}~ui=${selectionType}`;
    }
    if (this.currentGeocodes.has(geocode)) {
      if (selectionType === 'multiUnSelectTool' || selectionType === 'popupAction') {
        this.currentGeocodes.delete(geocode);
        this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'deselected', metricText));
      }
    } else {
      if (selectionType === 'multiSelectTool' || selectionType === 'popupAction') {
        this.currentGeocodes.add(geocode);
        this.store$.dispatch(new CreateTradeAreaUsageMetric('geography', 'selected', metricText));
      }
    }
  }

  private selectThis() {
    const portalId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), true);
    const selectedFeature = this.mapService.mapView.popup.selectedFeature;
    const geocode: string = selectedFeature.attributes.geocode;
    const geometry = {
      x: Number(selectedFeature.attributes.longitude),
      y: Number(selectedFeature.attributes.latitude)
    };
    if (EsriUtils.layerIsPortalFeature(selectedFeature.layer)) {
        if (selectedFeature.layer.portalItem.id === portalId){
          this.selectSingleGeocode(geocode, geometry);
        }
        else{
          this.store$.dispatch(new ErrorNotification({message: 'You are attempting to add or remove a geo at the wrong analysis level', notificationTitle: 'Invalid Add/Remove'}));
        }
    }
    
    this.collectSelectionUsage(selectedFeature, 'popupAction');
  }

  private measureThis() {
    const geom: __esri.Geometry = this.mapService.mapView.popup.selectedFeature.geometry;
    const distance: number = EsriApi.geometryEngine.geodesicLength(geom, 'miles');
    const area: number = EsriApi.geometryEngine.geodesicArea(<any>geom, 'square-miles');
    const distanceStr: string = String(parseFloat(Math.round((distance * 100) / 100).toFixed(2)));
    const areaStr: string = String(parseFloat(Math.round((area * 100) / 100).toFixed(2)));

    this.mapService.mapView.popup.content =
      '<div style="background-color:DarkBlue;color:white"><b>' +
      'Length: ' + distanceStr + ' miles.<br>Area: ' + areaStr + ' square-miles.</b></div>';
  }
}
