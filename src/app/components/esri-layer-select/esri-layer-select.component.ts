import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { Input, Output, EventEmitter } from '@angular/core';

// import {GrowlModule,Message,ButtonModule} from 'primeng/primeng';

// Map Services
import { MapService } from '../../services/map.service';
import { EsriLoaderService } from 'angular-esri-loader';

// Import Core Modules
import { CONFIG, MessageService } from '../../core';

@Component({
  providers: [MapService],
  selector: 'val-esri-layer-select',
  templateUrl: './esri-layer-select.component.html',
  styleUrls: ['./esri-layer-select.component.css']
})
export class EsriLayerSelectComponent implements OnInit {

  // MapService Items
  private selectedService: string;
  private s_name: string;
  private s_url: string;

  // public msgs: Message[] = [];
  public esriDemographicItems: any[];
  public mapView: __esri.MapView;
  private esriMap: __esri.Map;

  // this is needed to be able to create the MapView at the DOM element in this component
  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private mapService: MapService
              // private messageService: MessageService
             ) {
     this.mapView = this.mapService.getMapView();
  }

  public ngOnInit() {
    try {
      this.esriDemographicItems = [
            {name: '<Blank>'                            , code: ''},
            {name: 'ATZ_Top_Vars_Portal'                , code: 'https://valvcshad001vm.val.vlss.local/server/rest/services/ATZ_Top_Vars_Portal_ReferenceRegisteredData/MapServer'},
            {name: 'ATZ_Centroids_Portal'               , code: 'https://valvcshad001vm.val.vlss.local/server/rest/services/ATZ_Centroids_Portal_ReferenceRegisteredData/MapServer'},
            {name: 'USA_1990-2000_Population_Change'    , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_1990-2000_Population_Change/MapServer'},
            {name: 'USA_2000-2010_Population_Change'    , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_2000-2010_Population_Change/MapServer'},
            {name: 'USA_Average_Household_Size'         , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Average_Household_Size/MapServer'},
            {name: 'USA_Diversity_Index'                , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Diversity_Index/MapServer'},
            {name: 'USA_Labor_Force_Participation_Rate' , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Labor_Force_Participation_Rate/MapServer'},
            {name: 'USA_Median_Age'                     , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Age/MapServer'},
            {name: 'USA_Median_Home_Value'              , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Home_Value/MapServer'},
            {name: 'USA_Median_Household_Income'        , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Household_Income/MapServer'},
            {name: 'USA_Median_Net_Worth'               , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Median_Net_Worth/MapServer'},
            {name: 'USA_Owner_Occupied_Housing'         , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Owner_Occupied_Housing/MapServer'},
            {name: 'USA_Percent_Over_64'                , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Over_64/MapServer'},
            {name: 'USA_Percent_Under_18'               , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Percent_Under_18/MapServer'},
            {name: 'USA_Population_by_Sex'              , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_by_Sex/MapServer'},
            {name: 'USA_Population_Density'             , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Population_Density/MapServer'},
            {name: 'USA_Projected_Population_Change'    , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Projected_Population_Change/MapServer'},
            {name: 'USA_Recent_Population_Change'       , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Recent_Population_Change/MapServer'},
            {name: 'USA_Retail_Spending_Potential'      , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Retail_Spending_Potential/MapServer'},
            {name: 'USA_Social_Vulnerability_Index'     , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Social_Vulnerability_Index/MapServer'},
            {name: 'USA_Tapestry'                       , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Tapestry/MapServer'},
            {name: 'USA_Unemployment_Rate'              , code: 'https://server.arcgisonline.com/arcgis/rest/services/Demographics/USA_Unemployment_Rate/MapServer'},
            {name: 'Census_2000'                        , code: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Census/MapServer'}
        ];
    }
    // tslint:disable-next-line:one-line
    catch (ex) {
      console.error(ex);
    }
  }

   onChangeMapService(dd: any) {
            
            this.s_name = dd.selectedOption.value.name; this.s_url = dd.selectedOption.value.code;
            console.log(this.s_name, this.s_url);

            //add feature layer
            // this.msgs.addSingle('info','Loading Layer', this.s_name);
            // this.msgs.push({severity:'info', summary:'Info Message', detail:'PrimeNG rocks'});
            this.mapService.setMapLayer(this.s_name, this.s_url, 'FeatureLayer');
/*

                //wait until the layer is loaded.
                layer.then
                    (() =>
                    {
                      let toc = document.getElementById("toc");
                      toc.innerHTML = "";
                      let layerlist = document.createElement("ul");
                      toc.appendChild(layerlist);
                      //populate layers in list
                      populateLayerRecursive(layer, layerlist);
                      //mapview.goTo(layer.fullExtent)

                      mapview.goTo(results.features, {animate: false}).then(function(response) {
                      let zoomView = {};
                      zoomView = mapview.extent.expand(2.0);
                      mapview.goTo(zoomView);
                      });
                    }
                    )
      */
    }

}
