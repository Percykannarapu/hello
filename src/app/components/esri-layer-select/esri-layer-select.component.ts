
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';

// Map Services
import { MapService } from '../../services/map.service';

// import primeng
import {SelectItem} from 'primeng/primeng';
import { AppConfig } from '../../app.config';
import { MetricService } from '../../val-modules/common/services/metric.service';

@Component({
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent implements OnInit {


  // MapService Items
  public mapView: __esri.MapView;
  private esriMap: __esri.Map;

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

//  public esriDemographicItems: SelectItem[];
//  public selectedLayers: SelectItem[] = [];
  public layerToggle: boolean = false;

  public analysisLevels: SelectItem[];
  public selectedAnalysisLevel: string;
  public selectedAnalysisLevels: string[] = [];

  constructor(public mapService: MapService,  private config: AppConfig, private metricService: MetricService) {
      this.mapView = this.mapService.getMapView();
    }

  public ngOnInit() {

    try {
      this.analysisLevels = [];
      this.analysisLevels.push({label: 'ZIP',  value: 'ZIP'});
      this.analysisLevels.push({label: 'ATZ',  value: 'ATZ'});
      this.analysisLevels.push({label: 'DIG_ATZ',  value: 'DIG_ATZ'});
      this.analysisLevels.push({label: 'PCR',  value: 'PCR'});
      this.analysisLevels.push({label: 'WRAP', value: 'WRAP'});
//      this.analysisLevels.push({label: 'HH',   value: 'HH'});
      this.analysisLevels.push({label: 'DMA',  value: 'DMA'});

      this.selectedAnalysisLevel = 'ZIP';
      //this.selectedAnalysisLevels = [];

      this.checkLayers();

    }
    // tslint:disable-next-line:one-line
    catch (ex) {
      console.error(ex);
    }
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
        if (e.checked) {
          this.mapService.setMapLayers(this.selectedAnalysisLevels);
        }
        else {
            this.mapService.hideMapLayers();
        }
    }

    async onClearAllSelections(){
      console.log(' fired Clear selections:::')
      let fLyrList: __esri.FeatureLayer[] = [];
      await this.mapService.getAllFeatureLayers().then(list => {
          fLyrList = list;
      });

      for (const lyr of fLyrList) {
        if ((lyr.portalItem != null) &&
        (lyr.portalItem.id === this.config.layerIds.zip.topVars ||
        lyr.portalItem.id === this.config.layerIds.atz.topVars ||
        lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars)) {
          let layername = null;
          if (lyr.portalItem.id === this.config.layerIds.zip.topVars)
              layername = 'Selected Geography - ZIP';
          else if (lyr.portalItem.id === this.config.layerIds.atz.topVars)
              layername = 'Selected Geography - ATZ';
          else if (lyr.portalItem.id === this.config.layerIds.digital_atz.digitalTopVars)
              layername = 'Selected Geography - Digital ATZ';


              await this.mapService.removeSubLayer(layername, MapService.SitesGroupLayer);
              MapService.selectedCentroidObjectIds = [];
              MapService.hhDetails = 0;
              MapService.hhIpAddress = 0;
              MapService.medianHHIncome = '0';
              MapService.hhChildren = 0;
              this.metricService.add('CAMPAIGN', 'Household Count', MapService.hhDetails.toString());
              this.metricService.add('CAMPAIGN', 'IP Address Count', MapService.hhIpAddress.toString());
              this.metricService.add('AUDIENCE', 'Median Household Income', MapService.medianHHIncome.toString());
              this.metricService.add('AUDIENCE', 'Households with Children', MapService.hhChildren.toString());

        }
      }
    }

    onRevertToTradeArea(){
      console.log(' fired onRevertToTradeArea:::')
      this.mapService.callTradeArea();
    }

}
