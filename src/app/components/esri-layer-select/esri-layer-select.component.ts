import { MapService } from '../../services/map.service';
import { Component, OnInit, AfterViewInit } from '@angular/core';
import { EsriModules } from '../../esri-modules/core/esri-modules.service';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { AppConfig } from '../../app.config';
import { MetricService } from '../../val-modules/common/services/metric.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ValGeoService } from '../../services/app-geo.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { calculateStatistics, toUniversalCoordinates } from '../../app.utils';
import { EsriLayerService } from '../../esri-modules/layers/esri-layer.service';
import { EsriQueryService } from '../../esri-modules/layers/esri-query.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent implements OnInit, AfterViewInit {

  public selectedAnalysisLevels: string[] = [];
  public currentAnalysisLevel: string = '';
  public currentPoints;
  private geoSubscription: Subscription;
  private geocodes: string[];

  constructor(public mapService: MapService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private modules: EsriModules,
              public impDiscoveryService: ImpDiscoveryService,
              private attributeService: ImpGeofootprintGeoAttribService ,
              private valGeoService: ValGeoService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private esriLayerService: EsriLayerService,
              private queryService: EsriQueryService,
              private config: AppConfig) {
    }

  public ngOnInit() {
    this.impDiscoveryService.storeObservable.subscribe(d => {
      if (d && d[0] && d[0].analysisLevel) this.currentAnalysisLevel = d[0].analysisLevel;
    });
    this.geoSubscription = this.valGeoService.uniqueSelectedGeocodes$.subscribe(geocodes => {
      this.geocodes = geocodes;
    });


  }

 
  public ngAfterViewInit() {
      this.modules.onReady(() => { this.init(); });
  }

  private init() : void {
      console.log('Initializing Esri Layer Select Component');
      this.selectedAnalysisLevels = ['PCR', 'DIG_ATZ', 'ATZ', 'ZIP', 'WRAP', 'COUNTY', 'DMA'];
      EsriModules.watchUtils.once(this.esriMapService.mapView, 'ready', () => {
          //this.mapService.setMapLayers(this.selectedAnalysisLevels);
          //this.mapService.hideMapLayers();
      });
  }

    onClearAllSelections(){
      console.log(' fired Clear selections:::');
      this.impGeofootprintGeoService.clearAll();
      this.attributeService.clearAll();
    }

    public onZoomToTA() {
       const latitudes: number[] = [];
       const longitudes: number[] = [];
       const layerId = this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel, false);
       const query$ = this.queryService.queryAttributeIn(layerId, 'geocode', this.geocodes, false, ['latitude', 'longitude']);
       const sub = query$.subscribe(
         selections => {
           selections.forEach(g => {
             if (g.attributes.latitude != null && !Number.isNaN(Number(g.attributes.latitude))) {
               latitudes.push(Number(g.attributes.latitude));
             }
             if (g.attributes.longitude != null && !Number.isNaN(Number(g.attributes.longitude))) {
              longitudes.push(Number(g.attributes.longitude));
            }
           });
         },
         err => { console.error('Error getting lats and longs from layer', err); },
         () => {
           const xStats = calculateStatistics(longitudes);
           const yStats = calculateStatistics(latitudes);
           this.esriMapService.zoomOnMap(xStats, yStats, this.geocodes.length);
         }
       );
    }

    onRevertToTradeArea(){
      console.log(' fired onRevertToTradeArea:::');
      this.impGeofootprintGeoService.clearAll();
      this.attributeService.clearAll();
      this.valGeoService.clearCache();
      this.tradeAreaService.update(null, null);
    }
}
