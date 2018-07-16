import { Injectable, OnDestroy } from '@angular/core';
import { Subscription, BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { AppGeoService } from './app-geo.service';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ValMetricsService } from './app-metrics.service';
import { MessageService } from 'primeng/components/common/messageservice';
import { AppRendererService, CustomRendererSetup, SmartRendererSetup } from './app-renderer.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { UsageService } from './usage.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { AppStateService, Season } from './app-state.service';

export interface Coordinates {
  xcoord: number;
  ycoord: number;
}

@Injectable()
export class AppMapService implements OnDestroy {
  private clientTradeAreaSubscription: Subscription;
  private competitorTradeAreaSubscription: Subscription;
  private  currentGeocodes = new Set<string>();
  //private currentGeocodeList: string[] = [];

  private readonly useWebGLHighlighting: boolean;
  private layerSelectionRefresh: () => void;
  private highlightHandler: any;

  private defaultSymbol: __esri.SimpleFillSymbol;
  private isReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private rendererRetries: number = 0;
  public onReady$: Observable<boolean> = this.isReady.asObservable();

  constructor(private layerService: EsriLayerService,
              private mapService: EsriMapService, private config: AppConfig,
              private appGeoService: AppGeoService, private metricsService: ValMetricsService,
              private appStateService: AppStateService, private queryService: EsriQueryService,
              private messageService: MessageService, private rendererService: AppRendererService,
              private usageService: UsageService) {
    this.useWebGLHighlighting = this.config.webGLIsAvailable();

    this.mapService.onReady$.subscribe(ready => {
      if (ready) {
        this.isReady.next(true);
        combineLatest(this.appStateService.analysisLevel$, this.rendererService.rendererDataReady$).subscribe(
          ([analysisLevel, dataLength]) => this.setupRenderer(dataLength, analysisLevel)
        );
        combineLatest(this.appStateService.analysisLevel$, this.appStateService.uniqueSelectedGeocodes$).subscribe(
          ([analysisLevel, selectedGeocodes]) => this.setHighlight(selectedGeocodes, analysisLevel)
        );
        this.appStateService.uniqueSelectedGeocodes$.subscribe(() => {
          if (this.layerSelectionRefresh) this.layerSelectionRefresh();
        });
      }
    });
  }

  ngOnDestroy() : void {
    if (this.clientTradeAreaSubscription) this.clientTradeAreaSubscription.unsubscribe();
    if (this.competitorTradeAreaSubscription) this.competitorTradeAreaSubscription.unsubscribe();
  }

  public setupMap() : void {

  }

  public handleClickEvent(location:  __esri.MapViewClickEvent) {
    console.log('Inside AppMapService click event handler');
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    if (analysisLevel == null || analysisLevel.length === 0) return;
    const boundaryLayerId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const layer = this.layerService.getPortalLayerById(boundaryLayerId);
    this.mapService.mapView.hitTest(location).then(response => {
      const selectedGraphic = response.results.filter(r => r.graphic.layer === layer)[0].graphic;
      if (selectedGraphic != null) {
        const geocode = selectedGraphic.attributes.geocode;
        const geometry = {
          x: Number(selectedGraphic.attributes.longitude),
          y: Number(selectedGraphic.attributes.latitude),
        };
        this.collectSelectionUsage(selectedGraphic, 'ui=singleSelectTool');
        this.selectSingleGeocode(geocode, geometry);
      }
    }, err => console.error('Error during click event handling', err));
  }

  public selectSingleGeocode(geocode: string, geometry?: { x: number, y: number }) {
    if (geometry == null) {
      const centroidLayerId = this.config.getLayerIdForAnalysisLevel(this.appStateService.analysisLevel$.getValue(), false);
      const centroidSub = this.queryService.queryAttributeIn(centroidLayerId, 'geocode', [geocode], false, ['geocode', 'latitude', 'longitude']).subscribe(
        graphics => {
          if (graphics && graphics.length > 0) {
            const point = {
              x: Number(graphics[0].attributes.latitude),
              y: Number(graphics[0].attributes.longitude)
            };
            this.appGeoService.toggleGeoSelection(geocode, point);
          }
        },
        err => console.error('There was an error querying for a geocode', err),
        () => { if (centroidSub) centroidSub.unsubscribe(); } );
    } else {
      this.appGeoService.toggleGeoSelection(geocode, geometry);
    }
  }

  public selectMultipleGeocode(graphicsList: __esri.Graphic[]) {
    graphicsList.forEach(graphic => {
      const geocode =  graphic.attributes.geocode;
      const latitude = graphic.attributes.latitude;
      const longitude = graphic.attributes.longitude;
      const point: __esri.Point = new EsriModules.Point({latitude: latitude, longitude: longitude});
      this.collectSelectionUsage(graphic, 'ui=multiSelectTool');
      this.appGeoService.toggleGeoSelection(geocode, point);
    });
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
          const p = new EsriModules.Point({
            spatialReference: { wkid: this.config.val_spatialReference },
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
    const color = new EsriModules.Color(colorVal);
    const transparent = new EsriModules.Color([0, 0, 0, 0]);
    const symbol = new EsriModules.SimpleFillSymbol({
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
      EsriModules.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriModules.Graphic({
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
   */
  public collectSelectionUsage(graphic: __esri.Graphic, selectionType: string) {
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
      const metricText = `${geocode}~${hhc}~${currentProject.estimatedBlendedCpm}~${amount.toString()}~${selectionType}`;
      if (this.currentGeocodes.has(geocode)) {
        this.currentGeocodes.delete(geocode);
        this.usageService.createCounterMetric(geoDeselected, metricText, null);
      } else {
        this.currentGeocodes.add(geocode);
        this.usageService.createCounterMetric(geoselected, metricText, null);
      }
    } else {
      const metricText = `${geocode}~${hhc}~${0}~${0}~${selectionType}`;
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
    if (currentAnalysisLevel == null || currentAnalysisLevel === '' || this.useWebGLHighlighting) return;
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
          baseMap: this.mapService.map.basemap,
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
    if (currentAnalysisLevel == null || currentAnalysisLevel === '' || !this.useWebGLHighlighting) return;
    const boundaryLayerId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const layer = this.layerService.getPortalLayerById(boundaryLayerId);
    const query = new EsriModules.Query({
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
}
