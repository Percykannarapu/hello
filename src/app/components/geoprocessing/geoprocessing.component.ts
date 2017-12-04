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
  QSRPIZZA = 'QSR Pizza',
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

interface DropdownItem {
  id: number,
  name: String,
  code: String
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
  public gpSelector: Dropdown;

  @ViewChild('radCategorySelector')
  public radCategorySelector: Dropdown;

  @ViewChild('radProductSelector')
  public radProductSelector: Dropdown;

  public gpToolsList: SelectItem[];
  public selectedGpTool: String;
  
  public radCategoryList: SelectItem[] = new Array();
  public selectedRADCategory: string;
  public displayRADInputs: boolean = false;
  public radProductList: SelectItem[] = new Array();
  public selectedRADProduct: string;
  public radHouseholdCount: number;
  

  constructor() {
    //Set up the list of available Geoprocessing Tools
    this.gpToolsList = [
      {label: "Select Geoprocessing Tool", value: null},
      {label: "RAD Data", value: {id: 1, name: "RAD Data", code: GpTool.RAD}},
      {label: "Draw Buffer", value: {id: 1, name: "Draw Buffer", code: GpTool.BUFFER}}
    ]

    let counter: number = 0;
    let objValues = Object.keys(RADCategory).map(k => RADCategory[k]);
    let names = objValues.filter(v => typeof v === "string") as string[];    
    for(let category in RADCategory) {
      const item: SelectItem = {label: names[counter], value: {id: counter, name: names[counter], code: category}}
      this.radCategoryList.push(item);
      counter++;
    }

    counter = 0;
    objValues = Object.keys(Products).map(k => Products[k]);
    names = objValues.filter(v => typeof v === "string") as string[];
    for(let product in Products) {
      const item: SelectItem = {label: names[counter], value: {id: counter, name: names[counter], code: product}}
      this.radProductList.push(item);
      counter++;
    }
   }

  ngOnInit() {

    
  }

  public selectGpTool(event: any) {

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

  public async executeRAD() {
    
    console.log("Executing RAD tool");
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Geoprocessor] = await loader.loadModules(['esri/tasks/Geoprocessor']);
    console.log(JSON.stringify(this.selectedRADCategory, null, 4));
    const categoryItem: DropdownItem = JSON.parse(JSON.stringify(this.selectedRADCategory, null, null));
    const productItem: DropdownItem = JSON.parse(JSON.stringify(this.selectedRADProduct, null, null));
    const params = {
      Category: categoryItem.name,
      Product: productItem.name,
      Distribution_Household_Count: this.radHouseholdCount
    };
    const geoprocessor: __esri.Geoprocessor = new Geoprocessor();
    geoprocessor.url = 'https://valvcshad001vm.val.vlss.local/server/rest/services/PredictedPerformanceAnalysisRB/GPServer/Predicted%20Performance%20Analysis_RB';
    console.log("Invoking RAD service with params: " + JSON.stringify(params, null, 4));
    geoprocessor.submitJob(params, null);
    this.displayRADInputs = false;
    this.radHouseholdCount = null;
  }

}
