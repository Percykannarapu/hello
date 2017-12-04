import { Component, OnInit, ViewChild, Directive } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { Http } from '@angular/http';
import { InputTextModule, Dropdown } from 'primeng/primeng';


enum GpTool {
  RAD,
  BUFFER
}

enum RADCategory {
  QSRPIZZA = 'QSRPizza',
  AUTO_SERVICE = 'Auto Service/Parts',
  DISCOUNT_STORES = 'Discount Stores',
  EDUCATION = 'Education',
  FINANCIAL_SERVICES = 'Financial Services',
  FULL_SERVICE_RESTAURANTS = 'Full Service Restaurants',
  HARDWARE_HOME_IMPROVEMENT = 'Hardware_Home Improvement',
  HEALTH_AND_BEAUTY = 'Health and Beauty',
  HEALTHCARE = 'Healthcare',
  HEALTHCARE_OPTICAL = 'Healthcare_Optical',
  HOME_FURNISHING_MATTRESS = 'Home Furnishing_Mattress',
  HOME_SERVICES = 'Home Services',
  NON_PROFIT = 'Non-profit',
  PROFESSIONAL = 'Professional',
  QUICK_SERVICE_RESTAURANTS = 'Quick Service Restaurants',
  REMINDER = 'Reminder',
  RESEARCH = 'Research',
  RITUAL = 'Ritual',
  SPECIALTY_STORES = 'Specialty Stores',
  TELECOMMUNICATIONS = 'Telecommunications'
}

enum Products {
  CTRS_GROSS_MARGIN = 'Ctrs Gross Margin',
  CTRS_NP_MULTI_PAGE_INSERT = 'Ctrs NP Multi page Insert',
  CTRS_SM_MULTI_PAGE_INSERT = 'Ctrs SM Multi page Insert',
  FSI_COOP_OP = 'FSI Coop op',
  GROSS_MARGIN = 'Gross Margin',
  NP_INSERT = 'NP Insert',
  NP_MULTI_PAGE_INSERT = 'NP Multi page Insert',
  SM_COUPON_BOOKLET = 'SM Coupon Booklet',
  SM_INSERT = 'SM Insert',
  SM_MULTI_PAGE_INSERT = 'SM Multi page Insert',
  SM_POSTCARD = 'SM Postcard',
  SM_WRAP = 'SM Wrap',
  VPD = 'VDP'
}

@Component({
  selector: 'val-geoprocessing',
  templateUrl: './geoprocessing.component.html',
  styleUrls: ['./geoprocessing.component.css']
})
export class GeoprocessingComponent implements OnInit {

  //this annotation makes the dropdown menu in the HTML available in the typscript code
  //the HTML has #gpSelector in the dropdown tag, and that's how this annotation finds it
  @ViewChild('gpSelector')
  gpSelector: Dropdown;

  public gpToolsList: SelectItem[];
  public selectedGpTool: String;
  
  public radCategoryList: SelectItem[] = new Array();
  public selectedRADCategory: String;
  public displayRADInputs: Boolean = false;
  public radProductList: SelectItem[] = new Array();
  public selectedRADProduct: String;
  public radHouseholdCount: Number;
  

  constructor() {
    //Set up the list of available Geoprocessing Tools
    this.gpToolsList = [
      {label: "Select Geoprocessing Tool", value: null},
      {label: "RAD Data", value: {id: 1, name: "RAD Data", code: GpTool.RAD}},
      {label: "Draw Buffer", value: {id: 1, name: "Draw Buffer", code: GpTool.BUFFER}}
    ]

    let counter: number = 1;
    for(let category in RADCategory) {
      const item: SelectItem = {label: category.valueOf(), value: {id: counter, name: category.valueOf(), code: category}}
      this.radCategoryList.push(item);
      counter++;
    }

    counter = 1;
    for(let product in Products) {
      const item: SelectItem = {label: product.valueOf(), value: {id: product, name: product.valueOf(), code: product}}
      this.radProductList.push(item);
      counter++;
    }
   }

  ngOnInit() {

    
  }

  private selectGpTool(event: any) {

    //Bail out if the event doesn't have a vlaue
    if(event.value == null) {
      this.resetGpSelector();
      return;
    }
    
    //Read the event from the geoprocessing tool dropdown list and determine which tool was selected
    switch(event.value.code) {

      case GpTool.RAD:
        console.log('selected RAD Geoprocessing tool');
        this.resetGpSelector();
        this.displayRADInputs = true;
        this
        break;

      case GpTool.BUFFER:
        console.log('selected BUFFER Geoprocessing tool');
        this.resetGpSelector();
        break;
    }
  }

  private resetGpSelector() {
    console.log("resetting dropdown list");
    this.selectedGpTool = "Select Geoprocessing Tool";
  }

  private async executeRAD() {
    console.log("Executing RAD tool");
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Geoprocessor] = await loader.loadModules(['esri/tasks/Geoprocessor']);
    const params = {
      Category: this.selectedRADCategory,
      Product: this.selectedRADProduct,
      Distribution_Household_Count: this.radHouseholdCount
    };
    const geoprocessor: __esri.Geoprocessor = new Geoprocessor();
    geoprocessor.url = 'https://valvcshad001vm.val.vlss.local/server/rest/services/PredictedPerformanceAnalysisRB/GPServer/Predicted%20Performance%20Analysis_RB';
    geoprocessor.submitJob(params, null);
    this.displayRADInputs = false;
  }

}
