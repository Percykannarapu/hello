import { Injectable, OnDestroy } from '@angular/core';
import { ValSiteListService } from './app-site-list.service';
import { Subscription } from 'rxjs/Subscription';
import { LocationUiModel } from '../models/location-ui.model';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { AppConfig } from '../app.config';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ValLayerService } from './app-layer.service';
import { ValGeoService } from './app-geo.service';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';
import { EsriQueryService } from '../esri-modules/layers/esri-query.service';
import { ValMetricsService } from './app-metrics.service';
import { ValTradeAreaService } from './app-trade-area.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { MessageService } from 'primeng/components/common/messageservice';
import { tap } from 'rxjs/operators';
import { AppRendererService } from './app-renderer.service';
import { EsriUtils } from '../esri-modules/core/esri-utils.service';
import { UsageService } from './usage.service';
import { ImpMetricName } from '../val-modules/metrics/models/ImpMetricName';
import { MapService } from './map.service';

export interface Coordinates {
  xcoord: number;
  ycoord: number;
}

@Injectable()
export class ValMapService implements OnDestroy {
  private siteSubscription: Subscription;
  private competitorSubscription: Subscription;
  private geoSubscription: Subscription;
  private discoverySubscription: Subscription;
  private clientTradeAreaSubscription: Subscription;
  private competitorTradeAreaSubscription: Subscription;

  private currentAnalysisLevel: string;
  private currentLocationList = new Map<string, LocationUiModel[]>();
  private currentGeocodeList: string[] = [];

  private useWebGLHighlighting: boolean;
  private layerSelectionRefresh: () => void;
  private highlightHandler: any;

  constructor(private siteService: ValSiteListService, private layerService: EsriLayerService,
              private mapService: EsriMapService, private config: AppConfig,
              private appLayerService: ValLayerService, private appGeoService: ValGeoService,
              private discoveryService: ImpDiscoveryService, private queryService: EsriQueryService,
              private metricsService: ValMetricsService, private tradeAreaService: ValTradeAreaService,
              private messageService: MessageService, private rendererService: AppRendererService,
              private usageService: UsageService) {
    this.currentAnalysisLevel = '';
    this.useWebGLHighlighting = this.config.webGLIsAvailable();
    this.mapService.onReady$.subscribe(ready => {
      if (ready) {
        this.siteSubscription = this.siteService.allClientSites$.pipe(
          tap(() => { if (!this.currentLocationList.has('Site')) this.currentLocationList.set('Site', []); })
        ).subscribe(sites => this.onSiteListChanged(sites, 'Site'));
        this.competitorSubscription = this.siteService.allCompetitorSites$.pipe(
          tap(() => { if (!this.currentLocationList.has('Competitor')) this.currentLocationList.set('Competitor', []); })
        ).subscribe(competitors => this.onSiteListChanged(competitors, 'Competitor'));
        this.geoSubscription = this.appGeoService.uniqueSelectedGeocodes$.subscribe(geocodes => this.onGeocodeListChanged(geocodes));
        this.discoverySubscription = this.discoveryService.storeObservable.subscribe(discovery => this.onDiscoveryChange(discovery));
        this.clientTradeAreaSubscription = this.tradeAreaService.clientBuffer$.subscribe(buffer => this.onTradeAreaBufferChange(buffer, 'Site'));
        this.competitorTradeAreaSubscription = this.tradeAreaService.competitorBuffer$.subscribe(buffer => this.onTradeAreaBufferChange(buffer, 'Competitor'));
      }
    });
  }

  ngOnDestroy() : void {
    if (this.siteSubscription) this.siteSubscription.unsubscribe();
    if (this.competitorSubscription) this.competitorSubscription.unsubscribe();
    if (this.geoSubscription) this.geoSubscription.unsubscribe();
    if (this.discoverySubscription) this.discoverySubscription.unsubscribe();
    if (this.clientTradeAreaSubscription) this.clientTradeAreaSubscription.unsubscribe();
    if (this.competitorTradeAreaSubscription) this.competitorTradeAreaSubscription.unsubscribe();
  }

  private onSiteListChanged(sites: LocationUiModel[], siteType: string) {
    const oldSites = new Set(this.currentLocationList.get(siteType));
    const newSites = new Set(sites);
    const addedPoints = sites.filter(s => !oldSites.has(s)).map(s => s.point);
    const removedPoints = this.currentLocationList.get(siteType).filter(s => !newSites.has(s)).map(s => s.point);
    const updatedPoints = sites.filter(s => oldSites.has(s)).map(s => s.point);
    const groupName = `${siteType}s`;
    const layerName = `Project ${groupName}`;
    if (this.mapService.map.layers.map(l => l.title).includes(groupName)) {
      this.layerService.addGraphicsToLayer(layerName, addedPoints);
      this.layerService.removeGraphicsFromLayer(layerName, removedPoints);
      this.layerService.updateGraphicAttributes(layerName, updatedPoints);
      this.layerService.setGraphicVisibility(layerName, updatedPoints);
    } else {
      this.layerService.createClientLayer(groupName, layerName, sites.map(s => s.point), 'point', true);
    }
    this.currentLocationList.set(siteType, Array.from(sites));
  }

  private onDiscoveryChange(discovery: ImpDiscoveryUI[]) : void {
    if (discovery && discovery[0] && discovery[0].analysisLevel != null && discovery[0].analysisLevel !== this.currentAnalysisLevel) {
      this.currentAnalysisLevel = discovery[0].analysisLevel;
      this.setDefaultLayers(this.currentAnalysisLevel);
      this.setupSelectionRenderer(this.currentAnalysisLevel);
    }
  }

  private setDefaultLayers(currentAnalysisLevel) : void {
    MapService.DmaGroupLayer.visible = false;
    MapService.ZipGroupLayer.visible = false;
    MapService.AtzGroupLayer.visible = false;
    MapService.DigitalAtzGroupLayer.visible = false;
    MapService.PcrGroupLayer.visible = false;
    MapService.WrapGroupLayer.visible = false;
    MapService.CountyGroupLayer.visible = false;

    switch (currentAnalysisLevel) {
      case 'Digital ATZ':
         MapService.DigitalAtzGroupLayer.visible = true;
         break;
      case 'ATZ':
         MapService.AtzGroupLayer.visible = true;
         break;
      case 'ZIP':
         MapService.ZipGroupLayer.visible = true;
         break;
      case 'PCR':
         MapService.PcrGroupLayer.visible = true;
         break;
      default:
          console.error(`ValMapService.setDefaultLayers - Unknown Analysis Level selected: ${currentAnalysisLevel}`);
     }

  }

  private onGeocodeListChanged(geocodes: string[]) {
    if ((geocodes == null || geocodes.length === 0) && this.currentGeocodeList.length === 0) return;
    const currentGeocodes = new Set(this.currentGeocodeList);
    const adds = geocodes.filter(g => !currentGeocodes.has(g));
    this.currentGeocodeList = Array.from(geocodes);
    if (adds.length > 0) {
      this.getGeoAttributes(adds, this.currentAnalysisLevel);
    }
    this.setHighlight(this.currentGeocodeList, this.currentAnalysisLevel);
    if (this.layerSelectionRefresh) this.layerSelectionRefresh();
  }

  private onTradeAreaBufferChange(buffer: Map<ImpGeofootprintLocation, number[]>, siteType: string) {
    const mergeFlag = siteType === 'Site' ? this.tradeAreaService.clientMergeFlag : this.tradeAreaService.competitorMergeFlag;
    this.drawRadiusBuffers(buffer, mergeFlag, siteType);
  }

  public setupMap() : void {

  }

  public handleClickEvent(location:  __esri.Point) {
    if (this.currentAnalysisLevel == null || this.currentAnalysisLevel === '') return;
    const boundaryLayerId = this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel);
    const layer = this.layerService.getPortalLayerById(boundaryLayerId);
    const query = layer.createQuery();
    query.geometry = location;
    query.outFields = ['geocode'];
    const discoData = this.discoveryService.get();
    if (discoData[0].selectedSeason.toUpperCase() === 'WINTER') {
      query.outFields.push('hhld_w');
    } else {
      query.outFields.push('hhld_s');
    }
    const sub = this.queryService.executeQuery(boundaryLayerId, query).subscribe(featureSet => {
      if (featureSet && featureSet.features && featureSet.features.length === 1) {
        const geocode = featureSet.features[0].attributes.geocode;
        this.collectSelectionUsage(featureSet);
        this.selectSingleGeocode(geocode);
      }
    }, err => console.error('Error getting geocode for map click event', err), () => sub.unsubscribe());
  }

  /**
   * This method will create usage metrics each time a user selects/deselects geos manually on the map
   * @param featureSet A feature set containing the features the user manually selected on the map
   */
  private collectSelectionUsage(featureSet: __esri.FeatureSet) {
    const discoData = this.discoveryService.get();
    let hhc: number;
    const geocode = featureSet.features[0].attributes.geocode;
    if (discoData[0].selectedSeason.toUpperCase() === 'WINTER') {
      hhc = Number(featureSet.features[0].attributes.hhld_w);
    } else {
      hhc = Number(featureSet.features[0].attributes.hhld_s);
    }
    const currentGeocodes = new Set(this.currentGeocodeList);
    const geoDeselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'deselected' });
    const geoselected: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'geography', action: 'selected' });
    if (discoData[0].cpm != null) {
      const amount: number = hhc * discoData[0].cpm / 1000;
      if (currentGeocodes.has(geocode)) {
        this.usageService.createCounterMetric(geoDeselected, geocode + '~' + hhc + '~' + discoData[0].cpm + '~' + amount.toLocaleString(), 1);
      } else {
        this.usageService.createCounterMetric(geoselected, geocode + '~' + hhc + '~' + discoData[0].cpm + '~' + amount.toLocaleString(), 1);
      }
    } else {
      if (currentGeocodes.has(geocode)) {
        this.usageService.createCounterMetric(geoDeselected, geocode + '~' + hhc + '~' + 0 + '~' + 0, 1);
      } else {
        this.usageService.createCounterMetric(geoselected, geocode + '~' + hhc + '~' + 0 + '~' + 0, 1);
      }
    }
  }

  public selectSingleGeocode(geocode: string) {
    const centroidLayerId = this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel, false);
    const centroidSub = this.queryService.queryAttributeIn(centroidLayerId, 'geocode', [geocode], true).subscribe(graphics => {
      if (graphics && graphics.length > 0) {
        const point = graphics[0].geometry;
        if (EsriUtils.geometryIsPoint(point)) this.appGeoService.toggleGeoSelection(geocode, point);
      }
    }, err => console.error(err), () => centroidSub.unsubscribe());
  }

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
    const layersToRemove = this.layerService.getAllLayerNames().filter(name => name.startsWith(locationType) && name.endsWith('Trade Area'));
    layersToRemove.forEach(layerName => this.layerService.removeLayer(layerName));
    pointMap.forEach((points, radius) => {
      const radii = Array(points.length).fill(radius);
      EsriModules.geometryEngineAsync.geodesicBuffer(points, radii, 'miles', mergeBuffers).then(geoBuffer => {
        const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
        const graphics = geometry.map(g => {
          return new EsriModules.Graphic({
            geometry: g,
            symbol: symbol
          });
        });
        const groupName = `${locationType}s`;
        const layerName = `${locationType} - ${radius} Mile Trade Area`;
        this.layerService.removeLayer(layerName);
        this.layerService.createClientLayer(groupName, layerName, graphics, 'polygon', false);
      });
    });
  }

  public getGeoAttributes(geocodes: string[], analysisLevel: string) {
    const portalId = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const outFields = this.metricsService.getLayerAttributes();
    const sub = this.queryService.queryAttributeIn(portalId, 'geocode', geocodes, false, outFields).subscribe(
      graphics => {
        const attributesForUpdate = graphics.map(g => g.attributes);
        this.appGeoService.updatedGeoAttributes(attributesForUpdate);
      },
      err => {
        console.error(err);
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'There was an error during geo selection' });
      },
      () => {
        sub.unsubscribe();
      });
   }

  private setupSelectionRenderer(currentAnalysisLevel: string) {
    if (currentAnalysisLevel == null || currentAnalysisLevel === '' || this.useWebGLHighlighting) return;
    const portalId = this.config.getLayerIdForAnalysisLevel(currentAnalysisLevel);
    const layer = this.layerService.getPortalLayerById(portalId);
    if (EsriUtils.rendererIsSimple(layer.renderer)) {
      const symbol = layer.renderer.symbol;
      layer.renderer = this.rendererService.createSelectionRenderer(symbol);
      this.layerSelectionRefresh = () => {
        layer.renderer = (layer.renderer as __esri.UniqueValueRenderer).clone();
      };
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
