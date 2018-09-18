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
import { UsageService } from './usage.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppStateService, Season } from './app-state.service';
import { debounceTime, filter } from 'rxjs/operators';
import { AppMessagingService } from './app-messaging.service';
import { AppLayerService } from './app-layer.service';

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

  constructor(private appStateService: AppStateService,
              private appLayerService: AppLayerService,
              private rendererService: AppRendererService,
              private messagingService: AppMessagingService,
              private componentGenerator: AppComponentGeneratorService,
              private queryService: EsriQueryService,
              private layerService: EsriLayerService,
              private mapService: EsriMapService,
              private metricsService: ValMetricsService,
              private usageService: UsageService,
              private logger: AppLoggingService,
              private config: AppConfig) {
    this.useWebGLHighlighting = this.config.webGLIsAvailable();

    const cleanAnalysisLevel$ = this.appStateService.analysisLevel$.pipe(filter(al => al != null && al.length > 0));
    combineLatest(cleanAnalysisLevel$, this.rendererService.rendererDataReady$).pipe(
      filter(() => !this.useWebGLHighlighting)
    ).subscribe(
      ([analysisLevel, dataLength]) => this.setupRenderer(dataLength, analysisLevel)
    );
    combineLatest(cleanAnalysisLevel$, this.appStateService.uniqueSelectedGeocodes$).pipe(
      filter(() => this.useWebGLHighlighting)
    ).subscribe(
      ([analysisLevel, selectedGeocodes]) => this.setHighlight(selectedGeocodes, analysisLevel)
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
    // need to turn on the Home widget before we go async so it picks up the default map position as "home"
    this.mapService.createBasicWidget(EsriApi.widgets.Home);
    // Create the layer groups and load the portal items
    this.appLayerService.initializeLayers().subscribe(
      null,
      null,
      () => {
        // setup the remaining map widgets
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

  public selectMultipleGeocode(graphicsList: __esri.Graphic[]) {
    const events: GeoClickEvent[] = [];
    const layerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue());
    const layer = this.layerService.getPortalLayerById(layerId);
    graphicsList.forEach(graphic => {
      if (graphic.layer === layer) {
        const geocode =  graphic.attributes.geocode;
        const latitude = graphic.attributes.latitude;
        const longitude = graphic.attributes.longitude;
        const point: __esri.Point = new EsriApi.Point({latitude: latitude, longitude: longitude});
        this.collectSelectionUsage(graphic, 'multiSelectTool');
        events.push({ geocode, geometry: point });
      }
    });
    this.geoSelected.next(events);
  }

  /**
   * @deprecated
   * @param {Map<Coordinates, number[]>} locationBuffers
   * @param {boolean} mergeBuffers
   * @param {string} locationType
   */
  public drawRadiusBuffers(locationBuffers: Map<Coordinates, number[]>, mergeBuffers: boolean, locationType: string) : void {
    const locationKeys = Array.from(locationBuffers.keys());
    console.log('drawing buffers', locationBuffers);
    const radiusSet = Array.from(new Set([].concat(...Array.from(locationBuffers.values())))); // this gets a unique list of radii
    const pointMap: Map<number, __esri.Point[]> = new Map<number, __esri.Point[]>();
    for (const location of locationKeys) {
      for (const radius of radiusSet) {
        const currentLocationBuffers = new Set(locationBuffers.get(location));
        if (currentLocationBuffers.has(radius)) {
          const p = new EsriApi.Point({
            spatialReference: { wkid: this.config.esriAppSettings.defaultSpatialRef },
            x: location.xcoord,
            y: location.ycoord
          });
          if (pointMap.has(radius)) {
            pointMap.get(radius).push(p);
          } else {
            pointMap.set(radius, [p]);
          }
        }
      }
    }
    const colorVal = (locationType === 'Site') ? [0, 0, 255] : [255, 0, 0];
    const color = new EsriApi.Color(colorVal);
    const transparent = new EsriApi.Color([0, 0, 0, 0]);
    const symbol = new EsriApi.SimpleFillSymbol({
      style: 'solid',
      color: transparent,
      outline: {
        style: 'solid',
        color: color,
        width: 2
      }
    });
    const layersToRemove = this.layerService.getAllLayerNames().filter(name => name != null && name.startsWith(locationType) && name.endsWith('Trade Area'));
    layersToRemove.forEach(layerName => this.layerService.removeLayer(layerName));
    let layerId = 0;
    pointMap.forEach((points, radius) => {
      const radii = Array(points.length).fill(radius);
      EsriApi.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriApi.Graphic({
            geometry: g,
            symbol: symbol,
            attributes: { parentId: (++layerId).toString() }
          });
        });
        const groupName = `${locationType}s`;
        const layerName = `${locationType} - ${radius} Mile Trade Area`;
        this.layerService.removeLayer(layerName);
        this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
      });
    });
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
    //this.currentGeocodeList.push(geocode);

    const geoDeselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'deselected' });
    const geoselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'selected' });
    if (currentProject.estimatedBlendedCpm != null) {
      const amount: number = hhc * currentProject.estimatedBlendedCpm / 1000;
      const metricText = `${geocode}~${hhc}~${currentProject.estimatedBlendedCpm}~${amount.toString()}~ui=${selectionType}`;
      if (this.currentGeocodes.has(geocode)) {
        this.currentGeocodes.delete(geocode);
        this.usageService.createCounterMetric(geoDeselected, metricText, null);
      } else {
        this.currentGeocodes.add(geocode);
        this.usageService.createCounterMetric(geoselected, metricText, null);
      }
    } else {
      const metricText = `${geocode}~${hhc}~${0}~${0}~ui=${selectionType}`;
      if (this.currentGeocodes.has(geocode)) {
        this.currentGeocodes.delete(geocode);
        this.usageService.createCounterMetric(geoDeselected, metricText, null);
      } else {
        this.currentGeocodes.add(geocode);
        this.usageService.createCounterMetric(geoselected, metricText, null);
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
