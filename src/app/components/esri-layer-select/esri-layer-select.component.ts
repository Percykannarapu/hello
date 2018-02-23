// Map Services
import { MapService } from '../../services/map.service';

import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

import {EsriModules} from '../../esri-modules/core/esri-modules.service';
import {EsriMapService} from '../../esri-modules/core/esri-map.service';

// import primeng
import {SelectItem} from 'primeng/primeng';
import { AppConfig } from '../../app.config';
import { MetricService } from '../../val-modules/common/services/metric.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { ImpDiscoveryUI } from './../../models/ImpDiscoveryUI';

@Component({
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent implements OnInit, AfterViewInit {

  // MapService Items
  public mapView: __esri.MapView;
  private esriMap: __esri.Map;

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  public layerToggle: boolean = false;
  public analysisLevels: SelectItem[] = [];
  public selectedAnalysisLevels: string[] = [];

  constructor(public mapService: MapService,
              private config: AppConfig,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private metricService: MetricService,
              private esriMapService: EsriMapService,
              private modules: EsriModules,
              public impDiscoveryService: ImpDiscoveryService) {
      this.mapView = this.mapService.getMapView();
    }

  public ngOnInit() {
    console.log ('fired esri-layer-select.ngOnInit()');
    //console.log('selectedTargetAnalysisLevels', this.layerService.selectedTargetAnalysisLevels);
  }

  public ngAfterViewInit() /*ngOnInit()*/ {
      console.log ('fired esri-layer-select.ngAfterViewInit()');
      this.modules.onReady(() => { this.init(); });
  }

  private init() : void {
      console.log('Initializing Esri Layer Select Component');

      this.analysisLevels = [];
      this.analysisLevels.push({label: 'ZIP',  value: 'ZIP'});
      this.analysisLevels.push({label: 'ATZ',  value: 'ATZ'});
      this.analysisLevels.push({label: 'DIG_ATZ',  value: 'DIG_ATZ'});
      this.analysisLevels.push({label: 'PCR',  value: 'PCR'});
      this.analysisLevels.push({label: 'WRAP', value: 'WRAP'});
      this.analysisLevels.push({label: 'HH',   value: 'HH'});
      this.analysisLevels.push({label: 'DMA',  value: 'DMA'});

      // set default layers and disable them
      this.selectedAnalysisLevels = ['PCR', 'DIG_ATZ', 'ATZ', 'ZIP', 'WRAP', 'COUNTY', 'DMA'];
      console.log ('selectedAnalysisLevels = ' + this.selectedAnalysisLevels);

    EsriModules.watchUtils.once(this.esriMapService.mapView, 'ready', () => {
      this.mapService.setMapLayers(this.selectedAnalysisLevels);
      this.mapService.hideMapLayers();
  });
  }

   // set layers on panel hide, checking to see if layers are enabled
   checkLayers() {
     // remove groupLayers when analysis levels are not selected.
     try {
        if (!this.selectedAnalysisLevels.find(x => x === 'DMA'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis DMA'));
        if (!this.selectedAnalysisLevels.find(x => x === 'ZIP'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis ZIP'));
        if (!this.selectedAnalysisLevels.find(x => x === 'ATZ'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis ATZ'));
        if (!this.selectedAnalysisLevels.find(x => x === 'DIG_ATZ'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis Digital ATZ'));
        if (!this.selectedAnalysisLevels.find(x => x === 'PCR'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis PCR'));
        if (!this.selectedAnalysisLevels.find(x => x === 'WRAP'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis WRAP'));
        if (!this.selectedAnalysisLevels.find(x => x === 'HH'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis Households'));
     }
     finally {
          // catch(error => console.warn(error.message));
     }

    if (this.layerToggle) {
        this.mapService.setMapLayers(this.selectedAnalysisLevels);
        }
    }

   // this event handler is for the Toggle Layers control
   handleLayerChange(e) {
    console.log (this.selectedAnalysisLevels);
    if (e.checked) {
          this.checkLayers();
          this.mapService.setMapLayers(this.selectedAnalysisLevels);
        }
        else {
            this.mapService.hideMapLayers();
        }
    }

    async onClearAllSelections(){
      console.log(' fired Clear selections:::');
      let fLyrList: __esri.FeatureLayer[] = [];
      await this.mapService.getAllFeatureLayers().then(list => {
          fLyrList = list;
      });

      for (const lyr of fLyrList) {
        if ((lyr.portalItem != null) &&
        (lyr.portalItem.id === this.config.layerIds.zip.topVars.id ||
        lyr.portalItem.id === this.config.layerIds.atz.topVars.id ||
        lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id)) {
          let layername = null;
          if (lyr.portalItem.id === this.config.layerIds.zip.topVars.id)
              layername = 'Selected Geography - ZIP';
          else if (lyr.portalItem.id === this.config.layerIds.atz.topVars.id)
              layername = 'Selected Geography - ATZ';
          else if (lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars.id)
              layername = 'Selected Geography - Digital ATZ';
          else if (lyr.portalItem.id === this.config.layerIds.pcr.topVars)
              layername = 'Selected Geography - PCR';


              await this.mapService.removeSubLayer(layername, MapService.SitesGroupLayer);
              MapService.selectedCentroidObjectIds = [];
              MapService.hhDetails = 0;
              MapService.hhIpAddress = 0;
              MapService.medianHHIncome = '0';
              MapService.hhChildren = 0;
              MapService.proBudget = '0';
              this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
              this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
              this.metricService.add('CAMPAIGN', 'Total Investment', MapService.totInvestment.toString());
              this.metricService.add('CAMPAIGN', 'Progress to Budget', MapService.proBudget.toString());
              this.metricService.add('AUDIENCE', 'Median Household Income', MapService.medianHHIncome.toString());
              this.metricService.add('AUDIENCE', 'Households with Children', MapService.hhChildren.toString());
              this.impGeofootprintGeoService.clearAll();

        }
      }
    }

    onRevertToTradeArea(){
      console.log(' fired onRevertToTradeArea:::');
      this.mapService.callTradeArea();
    }

}
