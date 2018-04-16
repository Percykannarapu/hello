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

@Component({
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent implements OnInit, AfterViewInit {


  public selectedAnalysisLevels: string[] = [];
  public currentAnalysisLevel: string = '';

  constructor(public mapService: MapService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private modules: EsriModules,
              public impDiscoveryService: ImpDiscoveryService,
              private attributeService: ImpGeofootprintGeoAttribService ,
              private valGeoService: ValGeoService,
              private tradeAreaService: ImpGeofootprintTradeAreaService) {
    }

  public ngOnInit() {
    this.impDiscoveryService.storeObservable.subscribe(d => {
      if (d && d[0] && d[0].analysisLevel) this.currentAnalysisLevel = d[0].analysisLevel;
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

    onRevertToTradeArea(){
      console.log(' fired onRevertToTradeArea:::');
      this.impGeofootprintGeoService.clearAll();
      this.attributeService.clearAll();
      this.valGeoService.clearCache();
      this.tradeAreaService.update(null, null);
    }
}
