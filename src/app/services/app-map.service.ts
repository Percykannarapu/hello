import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { EsriLayerService } from '../esri/services/esri-layer.service';
import { EsriMapService } from '../esri/services/esri-map.service';
import { AppConfig } from '../app.config';
import { EsriApi } from '../esri/core/esri-api.service';
import { EsriQueryService } from '../esri/services/esri-query.service';
import { AppComponentGeneratorService } from './app-component-generator.service';
import { AppLoggingService } from './app-logging.service';
import { ValMetricsService } from './app-metrics.service';
import { AppRendererService, CustomRendererSetup, SmartRendererSetup } from './app-renderer.service';
import { EsriUtils } from '../esri/core/esri-utils';
import { AppStateService, Season } from './app-state.service';
import { debounceTime, filter } from 'rxjs/operators';
import { AppLayerService } from './app-layer.service';
import { Store } from '@ngrx/store';
import { AppState } from '../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../state/usage/targeting-usage.actions';

export interface Coordinates {
  xcoord: number;
  ycoord: number;
}

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
  private highlightHandler: any;
  private defaultSymbol: __esri.SimpleFillSymbol;
  private rendererRetries: number = 0;

  public geoSelected$: Observable<GeoClickEvent[]> = this.geoSelected.asObservable();
  public selectedButton: number;
  constructor(private appStateService: AppStateService,
              private appLayerService: AppLayerService,
              private rendererService: AppRendererService,
              private componentGenerator: AppComponentGeneratorService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private metricsService: ValMetricsService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private store$: Store<AppState>) {
    this.useWebGLHighlighting = this.config.webGLIsAvailable();

    const cleanAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    combineLatest(cleanAnalysisLevel$, this.rendererService.rendererDataReady$).pipe(
      //filter(() => !this.useWebGLHighlighting)
    ).subscribe(
      ([analysisLevel, dataLength]) => this.setupRenderer(dataLength, analysisLevel)
    );
    combineLatest(cleanAnalysisLevel$, this.appStateService.uniqueSelectedGeocodes$).pipe(
      filter(() => this.useWebGLHighlighting)
    ).subscribe(
      //([analysisLevel, selectedGeocodes]) => this.setHighlight(selectedGeocodes, analysisLevel)
    );
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
        this.mapService.createHiddenWidget(EsriApi.widgets.Search, {}, { expandIconClass: 'esri-icon-search', expandTooltip: 'Search'});
        this.mapService.createHiddenWidget(EsriApi.widgets.LayerList, {}, { expandIconClass: 'esri-icon-layer-list', expandTooltip: 'Layer List'});
        this.mapService.createHiddenWidget(EsriApi.widgets.Legend, {}, { expandIconClass: 'esri-icon-documentation', expandTooltip: 'Legend'});
        this.mapService.createHiddenWidget(EsriApi.widgets.BaseMapGallery, {}, { expandIconClass: 'esri-icon-basemap', expandTooltip: 'Basemap Gallery'});
        this.mapService.createBasicWidget(EsriApi.widgets.ScaleBar, { unit: 'dual' }, 'bottom-left');

        const popup = this.mapService.mapView.popup;
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
          this.logger.debug('Popup visible watch fired', result);
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

  private setupRenderer(dataLength: number, currentAnalysisLevel: string) : void {
    console.log('setting renderer');
    const portalId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const layer = this.layerService.getPortalLayerById(portalId);
    if ((!layer || !layer.renderer) && this.rendererRetries < 19) {
      this.rendererRetries++;
      setTimeout((() => this.setupRenderer(dataLength, currentAnalysisLevel)), 1000);
      return;
    }
    this.rendererRetries = 0;
    if (EsriUtils.rendererIsSimple(layer.renderer) && EsriUtils.symbolIsSimpleFill(layer.renderer.symbol)) {
      this.defaultSymbol = layer.renderer.symbol;
    }
    let setup: CustomRendererSetup | SmartRendererSetup;
    console.log('data length', dataLength);
    if (dataLength === 0) {
      setup = {
        rampLabel: '',
        outline: {
          defaultWidth: this.defaultSymbol.outline.width,
          selectedWidth: this.defaultSymbol.outline.width,
          selectedColor: this.defaultSymbol.outline.color
        }
      };
    } else {
      setup = {
        rampLabel: '',
        outline: {
          defaultWidth: this.defaultSymbol.outline.width,
          selectedWidth: 4,
          selectedColor: [86, 231, 247, 1.0]
        },
        smartTheme: {
          baseMap: this.mapService.mapView.map.basemap,
          theme: null
        }
      };
    }
    layer.renderer = this.rendererService.createUnifiedRenderer(this.defaultSymbol.clone(), setup);
    if (dataLength === 0) {
      this.layerSelectionRefresh = () => {
        layer.renderer = EsriUtils.clone(layer.renderer);
      };
    } else {
      this.layerSelectionRefresh = null;
    }
  }

  private setHighlight(geocodes: string[], currentAnalysisLevel: string) {
    const boundaryLayerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const layer = this.layerService.getPortalLayerById(boundaryLayerId);
    const query = new EsriApi.Query({
      where: `geocode in ('${geocodes.join(`','`)}')`
    });
    const sub = this.queryService.executeObjectIdQuery(boundaryLayerId, query).subscribe(ids => {
      console.log('Object Ids query returned', ids);
      this.mapService.mapView.whenLayerView(layer).then((lv: __esri.FeatureLayerView) => {
        console.log('Highlighting');
        if (this.highlightHandler != null) this.highlightHandler.remove();
        this.highlightHandler = lv.highlight(ids);
        if (sub) sub.unsubscribe();
      });
    });
  }

  private selectThis() {
    const selectedFeature = this.mapService.mapView.popup.selectedFeature;
    const geocode: string = selectedFeature.attributes.geocode;
    const geometry = {
      x: Number(selectedFeature.attributes.longitude),
      y: Number(selectedFeature.attributes.latitude)
    };
    this.selectSingleGeocode(geocode, geometry);
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
