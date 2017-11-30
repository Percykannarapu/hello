import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

// import {GrowlModule,Message,ButtonModule} from 'primeng/primeng';

// Map Services
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';

// Import Core Modules
import { CONFIG, MessageService } from '../../core';

// import primeng 
import {SelectItem} from 'primeng/primeng';
// import {ButtonModule} from 'primeng/primeng';

@Component({
  providers: [MapService],
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
  selectedLayers: string[] = [];

  constructor(private mapService: MapService) {
     this.mapView = this.mapService.getMapView();
    }

  public ngOnInit() {
    try {
      this.esriDemographicItems = [
            {label: 'Digital_ATZ'                        , value: 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/digitalATZ/FeatureServer'},
            {label: 'ZIP_Top_Vars'                       , value: 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Top_Vars/FeatureServer'},
            {label: 'ATZ_Top_Vars'                       , value: 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/arcgis/rest/services/ATZ_Top_Vars/FeatureServer'},
            {label: 'ZIP_Centroids'                      , value: 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ZIP_Centroids/FeatureServer'},
            {label: 'ATZ_Centroids'                      , value: 'https://services7.arcgis.com/U1jwgAVNb50RuY1A/ArcGIS/rest/services/ATZ_Centroids/FeatureServer'},
        // -----------------
            {label: 'Census_2000'                        , value: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer'},
        // -----------------
            {label: 'USA_1990-2000_Population_Change'    , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer'},
            {label: 'USA_2000-2010_Population_Change'    , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_2000-2010_Population_Change/MapServer'},
            {label: 'USA_Average_Household_Size'         , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Average_Household_Size/MapServer'},
            {label: 'USA_Diversity_Index'                , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Diversity_Index/MapServer'},
            {label: 'USA_Labor_Force_Participation_Rate' , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Labor_Force_Participation_Rate/MapServer'},
            {label: 'USA_Median_Age'                     , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Age/MapServer'},
            {label: 'USA_Median_Home_Value'              , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Home_Value/MapServer'},
            {label: 'USA_Median_Household_Income'        , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer'},
            {label: 'USA_Median_Net_Worth'               , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Net_Worth/MapServer'},
            {label: 'USA_Owner_Occupied_Housing'         , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Owner_Occupied_Housing/MapServer'},
            {label: 'USA_Percent_Over_64'                , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Over_64/MapServer'},
            {label: 'USA_Percent_Under_18'               , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Under_18/MapServer'},
            {label: 'USA_Population_by_Sex'              , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_by_Sex/MapServer'},
            {label: 'USA_Population_Density'             , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer'},
            {label: 'USA_Projected_Population_Change'    , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Projected_Population_Change/MapServer'},
            {label: 'USA_Recent_Population_Change'       , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Recent_Population_Change/MapServer'},
            {label: 'USA_Retail_Spending_Potential'      , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Retail_Spending_Potential/MapServer'},
            {label: 'USA_Social_Vulnerability_Index'     , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Social_Vulnerability_Index/MapServer'},
            {label: 'USA_Tapestry'                       , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Tapestry/MapServer'},
            {label: 'USA_Unemployment_Rate'              , value: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer'}
        ];
    }
    // tslint:disable-next-line:one-line
    catch (ex) {
      console.error(ex);
    }
  }

   onRemoveMapServices() {
     this.mapService.removeMapLayers();
    }

   onSetMapServices() {
     this.mapService.setMapLayers(this.selectedLayers);
    }

}
