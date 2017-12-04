import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { Http } from '@angular/http';
import { InputTextModule } from 'primeng/primeng';


enum GpTool {
  RAD,
  BUFFER
}

enum RADCategory {
  QSRPizza,
  Category1,
  Category2,
  Category3,
  Category4,
  Category5
}

enum Products {
  SMInsert
}

@Component({
  selector: 'val-geoprocessing',
  templateUrl: './geoprocessing.component.html',
  styleUrls: ['./geoprocessing.component.css']
})
export class GeoprocessingComponent implements OnInit {

  public gpToolsList: SelectItem[];
  public selectedGpTool: String;

  public radCategoryList: SelectItem[];
  public selectedRADCategory: String;
  public displayRADInputs: Boolean = false;
  public radProductList: SelectItem[];
  public selectedRADProduct: String;
  public radHouseholdCount: Number;
  

  constructor() {
    //Set up the list of available Geoprocessing Tools
    this.gpToolsList = [
      {label: "Select Geoprocessing Tool", value: null},
      {label: "RAD Data", value: {id: 1, name: "RAD Data", code: GpTool.RAD}},
      {label: "Draw Buffer", value: {id: 1, name: "Draw Buffer", code: GpTool.BUFFER}}
    ]

    //Set up the RAD Categories
    this.radCategoryList = [
      {label: "Select Category", value: null},
      {label: "QSR Pizza", value: {id: 1, name: "QSR Pizza", code: RADCategory.QSRPizza}},
      {label: "Category 1", value: {id: 2, name: "Category 1", code: RADCategory.Category1}},
      {label: "Category 2", value: {id: 3, name: "Category 2", code: RADCategory.Category2}},
      {label: "Category 3", value: {id: 4, name: "Category 3", code: RADCategory.Category3}},
      {label: "Category 4", value: {id: 5, name: "Category 4", code: RADCategory.Category4}},
      {label: "Category 5", value: {id: 6, name: "Category 5", code: RADCategory.Category5}}
    ]

    //set up the RAD product list
    this.radProductList = [
      {label: "Select Product", value: null},
      {label: "SM Insert", value: {id: 1, name: "SM Insert", code: Products.SMInsert}}
    ]
   }

  ngOnInit() {

    
  }

  private selectGpTool(event: any) {
    
    //Read the event from the geoprocessing tool dropdown list and determine which tool was selected
    switch(event.value.code) {

      case GpTool.RAD:
        console.log('selected RAD Geoprocessing tool');
        this.displayRADInputs = true;
        break;

      case GpTool.BUFFER:
        console.log('selected BUFFER Geoprocessing tool');
        break;
    }
  }

  private selectRADCategory(event: any) {
    
    //Read the event from the geoprocessing tool dropdown list and determine which tool was selected
    switch(event.value.code) {

      case GpTool.RAD:
        console.log('selected RAD Geoprocessing tool');
        this.displayRADInputs = true;
        break;

      case GpTool.BUFFER:
        console.log('selected BUFFER Geoprocessing tool');
        break;
    }
  }

  private async executeRAD() {
    console.log("Executing RAD tool");
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Geoprocessor] = await loader.loadModules(['esri/tasks/Geoprocessor']);
    const geoprocessor: __esri.Geoprocessor = new Geoprocessor();
    geoprocessor.url = 'https://valvcshad001vm.val.vlss.local/server/rest/services/PredictedPerformanceAnalysisRB/GPServer/Predicted%20Performance%20Analysis_RB';
    geoprocessor.execute(null, null);
    this.displayRADInputs = false;
  }

}
