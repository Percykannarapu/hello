
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

// Map Services
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';

// Import Core Modules
import { CONFIG } from '../../core';
import { MessageService } from '../../val-modules/common/services/message.service';

// import primeng 
import {SelectItem} from 'primeng/primeng';

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

  public esriDemographicItems: SelectItem[];
  public selectedLayers: SelectItem[] = [];
  public layerToggle: boolean = false;

  public analysisLevels: SelectItem[];
  public selectedAnalysisLevel: string;
  public selectedAnalysisLevels: string[] = [];

  constructor(private mapService: MapService) {
      this.mapView = this.mapService.getMapView();
    }

  public ngOnInit() {

    try {
      this.analysisLevels = [];
      this.analysisLevels.push({label: 'ZIP',  value: 'ZIP'});
      this.analysisLevels.push({label: 'ATZ',  value: 'ATZ'});
      this.analysisLevels.push({label: 'PCR',  value: 'PCR'});
      this.analysisLevels.push({label: 'HH',   value: 'HH'});
      this.analysisLevels.push({label: 'WRAP', value: 'WRAP'});

      this.selectedAnalysisLevel = 'ZIP';
      this.selectedAnalysisLevels = [];

      this.esriDemographicItems = [
        // -----------------
        //    ESRI Layers
        // -----------------
            { label: 'Census'                             , value: { group: 'ESRI', portalitem: '', url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer', name: 'Census'}},
            { label: 'USA 1990-2000 Population Change'    , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer',
              name: 'USA 1990-2000 Population Change'}},
            { label: 'USA 2000-2010 Population Change'    , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_2000-2010_Population_Change/MapServer',
              name: 'USA 2000-2010 Population Change'}},
            { label: 'USA Average Household Size'         , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Average_Household_Size/MapServer', name: 'USA Average Household Size'}},
            { label: 'USA Diversity Index'                , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Diversity_Index/MapServer', name: 'USA Diversity Index'}},
            { label: 'USA Labor Force Participation Rate' , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Labor_Force_Participation_Rate/MapServer',
              name: 'USA Labor Force Participation Rate'}},
            { label: 'USA Median Age'                     , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Age/MapServer', name: 'USA Median Age'}},
            { label: 'USA Median Home Value'              , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Home_Value/MapServer', name: 'USA Median Home Value'}},
            { label: 'USA Median Household Income'        , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer', name: 'USA Median Household Income'}},
            { label: 'USA Median Net Worth'               , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Net_Worth/MapServer', name: 'USA Median Net Worth'}},
            { label: 'USA Owner Occupied Housing'         , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Owner_Occupied_Housing/MapServer', name: 'USA Owner Occupied Housing'}},
            { label: 'USA Percent Over 64'                , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Over_64/MapServer', name: 'USA Percent Over 64'}},
            { label: 'USA Percent Under 18'               , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Under_18/MapServer', name: 'USA Percent Under 18'}},
            { label: 'USA Population by Sex'              , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_by_Sex/MapServer', name: 'USA Population by Sex'}},
            { label: 'USA Population Density'             , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer', name: 'USA Population Density'}},
            { label: 'USA Projected Population Change'    , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Projected_Population_Change/MapServer',
              name: 'USA Projected Population Change'}},
            { label: 'USA Recent Population Change'       , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Recent_Population_Change/MapServer', name: 'USA Recent Population Change'}},
            { label: 'USA Retail Spending Potential'      , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Retail_Spending_Potential/MapServer', name: 'USA Retail Spending Potential'}},
            { label: 'USA Social Vulnerability Index'     , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Social_Vulnerability_Index/MapServer',
              name: 'USA Social Vulnerability Index'}},
            { label: 'USA Tapestry'                       , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Tapestry/MapServer', name: 'USA Tapestry'}},
            { label: 'USA Unemployment Rate'              , value: { group: 'ESRI', portalitem: '', url: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer', name: 'USA Unemployment Rate'}}
        ];

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
        if (!this.selectedAnalysisLevels.find(x => x === 'ZIP'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis ZIP'));
        if (!this.selectedAnalysisLevels.find(x => x === 'ATZ'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis ATZ'));
        if (!this.selectedAnalysisLevels.find(x => x === 'PCR'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis PCR'));
        if (!this.selectedAnalysisLevels.find(x => x === 'WRAP'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis WRAP'));
        if (!this.selectedAnalysisLevels.find(x => x === 'WRAP'))
             this.mapService.removeLayer(this.mapService.findLayerByTitle('Valassis Households'));
     } 
     finally {
          // catch(error => console.warn(error.message));
     }

    if (this.layerToggle) {
            this.mapService.setMapLayers(this.esriDemographicItems, this.selectedLayers, this.selectedAnalysisLevels);
        }
    }

   // this event handler is for the Toggle Layers control
   handleLayerChange(e) {
        if (e.checked) {
            this.mapService.setMapLayers(this.esriDemographicItems, this.selectedLayers, this.selectedAnalysisLevels);
        }
        else {
            this.mapService.hideMapLayers();
        }
    }

}
