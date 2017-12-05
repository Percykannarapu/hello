import { Component, OnInit, ViewChild, Directive } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { EsriLoaderService } from 'angular-esri-loader';
import { Http } from '@angular/http';
import { InputTextModule, Dropdown, GrowlModule, Message, ProgressSpinnerModule, ProgressBarModule } from 'primeng/primeng';
import { error } from 'selenium-webdriver';


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
  HARDWARE_HOME_IMPROVEMENT = 'Hardware_Home Improvement Ctrs',
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
  CTRS_NP_MULTI_PAGE_INSERT = 'NP Multi page Insert',
  CTRS_SM_MULTI_PAGE_INSERT = 'SM Multi page Insert',
  FSI_COOP_OP = 'FSI Coop op',
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

interface GpResponse {
  jobId: string,
  jobStatus: string,
  messages: string[]
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
  public radEstimatedCPM: number;
  public radBudget: number;
  public radDistributionHouseholdCount: number;

  public growlMessages: Message[] = new Array();
  public displayGpSpinner: boolean = false;

  constructor() {
    //Set up the list of available Geoprocessing Tools
    this.gpToolsList = [
      { label: "Select Geoprocessing Tool", value: null },
      { label: "RAD Data", value: { id: 1, name: "RAD Data", code: GpTool.RAD } },
      { label: "Draw Buffer", value: { id: 1, name: "Draw Buffer", code: GpTool.BUFFER } }
    ]

    let counter: number = 0;
    let objValues = Object.keys(RADCategory).map(k => RADCategory[k]);
    let names = objValues.filter(v => typeof v === "string") as string[];
    let firstItem: SelectItem = { label: "Select Category", value: null }
    this.radCategoryList.push(firstItem);
    for (let category in RADCategory) {
      const item: SelectItem = { label: names[counter], value: { id: counter + 1, name: names[counter], code: category } }
      this.radCategoryList.push(item);
      counter++;
    }

    counter = 0;
    objValues = Object.keys(Products).map(k => Products[k]);
    names = objValues.filter(v => typeof v === "string") as string[];
    firstItem = { label: "Select Product", value: null }
    this.radProductList.push(firstItem);
    for (let product in Products) {
      const item: SelectItem = { label: names[counter], value: { id: counter + 1, name: names[counter], code: product } }
      this.radProductList.push(item);
      counter++;
    }
  }

  ngOnInit() {


  }

  public selectGpTool(event: any) {

    //Bail out if the event doesn't have a vlaue
    if (event.value == null) {
      this.resetGpSelector();
      return;
    }

    //Read the event from the geoprocessing tool dropdown list and determine which tool was selected
    switch (event.value.code) {

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
    this.selectedGpTool = "Select Geoprocessing Tool";
  }

  public async executeRAD() {

    //hide the modal popup and reset the HHC
    this.displayRADInputs = false;
    this.radHouseholdCount = null;

    //show the spinner while we do our work
    this.displayGpSpinner = true;

    //these are the output variables we will look for from the service call
    var predictedResponse: number;
    var averageTicket: number;
    var estimatedCPM: number;
    var predictedSalesLift: string;
    var category2: string;
    var product2: string;
    var distributionHouseholdCount2;
    var budget2: string;
    var totalEstimatedSpend: string;
    var budgetVsSpend: string;
    var predictedROI: string;

    console.log("Executing RAD tool");
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Geoprocessor, JobInfo, ParameterValue] = await loader.loadModules(['esri/tasks/Geoprocessor', 'esri/tasks/support/JobInfo', 'esri/tasks/support/ParameterValue']);
    const categoryItem: DropdownItem = JSON.parse(JSON.stringify(this.selectedRADCategory, null, null));
    const productItem: DropdownItem = JSON.parse(JSON.stringify(this.selectedRADProduct, null, null));
    const params = {
      Category: categoryItem.name,
      Product: productItem.name,
      Distribution_Household_Count: this.radHouseholdCount,
      Estimated_CPM: this.radEstimatedCPM,
      Budget: this.radBudget
    };
    const geoprocessor: __esri.Geoprocessor = new Geoprocessor();
    geoprocessor.url = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RADExlRB9/GPServer/RADExlRB9';
    await geoprocessor.submitJob(params, null).then(async response => {
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Predicted_Response", null).then(result => {
        let pv = result as __esri.ParameterValue;
        predictedResponse = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "AVG_Ticket", null).then(result => {
        let pv = result as __esri.ParameterValue;
        averageTicket = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Estimated_CPM2", null).then(result => {
        let pv = result as __esri.ParameterValue;
        estimatedCPM = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Predicted_Sales_Lift", null).then(result => {
        let pv = result as __esri.ParameterValue;
        predictedSalesLift = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Category2", null).then(result => {
        let pv = result as __esri.ParameterValue;
        category2 = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Product2", null).then(result => {
        let pv = result as __esri.ParameterValue;
        product2 = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Distribution_Household_Count2", null).then(result => {
        let pv = result as __esri.ParameterValue;
        distributionHouseholdCount2 = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Budget2", null).then(result => {
        let pv = result as __esri.ParameterValue;
        budget2 = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Total_Estimated_Spend", null).then(result => {
        let pv = result as __esri.ParameterValue;
        totalEstimatedSpend = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "BudgetVsSpend", null).then(result => {
        let pv = result as __esri.ParameterValue;
        budgetVsSpend = pv.value;
      }, error => {
        this.displayRADError();
      });
      await geoprocessor.getResultData((<GpResponse>response).jobId, "Predicted_Return_on_Investment", null).then(result => {
        let pv = result as __esri.ParameterValue;
        predictedROI = pv.value;
      }, error => {
        this.displayRADError();
      });

      //configure the growl message that will be displayed
      const growlMessage: Message = {
        summary: "Results from RAD Service",
        severity: "info",
        detail: "Predicted Response: " + predictedResponse + "<br>" +
          "Average Ticket: " + averageTicket + "<br>" +
          "Estimated CPM: " + estimatedCPM + "<br>" +
          "Predicted Sales Lift: " + predictedSalesLift + "<br>" +
          "Category: " + category2 + "<br>" +
          "Product: " + product2 + "<br>" +
          "Distribution Household Count: " + distributionHouseholdCount2 + "<br>" +
          "Budget: " + budget2 + "<br>" +
          "Total Estimated Spend: " + totalEstimatedSpend + "<br>" +
          "Budget vs Spend: " + budgetVsSpend + "<br>" +
          "Predicted ROI: " + predictedROI + "<br>"
      }
      //hide the spinner and display the results
      this.displayGpSpinner = false;
      this.growlMessages.push(growlMessage);
    }, error => {
      this.displayRADError();
    });


  }

  private displayRADError() {
    const growlMessage: Message = {
      summary: "Error Executing RAD Service",
      severity: "error",
      detail: "Please contact the Valassis helpdesk"
    }
    this.displayGpSpinner = false;
    this.growlMessages.push(growlMessage);
  }

}
