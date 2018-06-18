import { ImpGeofootprintTradeAreaService } from './../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppConfig } from '../../app.config';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { UserService } from '../../services/user.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpDiscoveryUI } from '../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { AppState } from '../../app.state';
import { ImpRadLookupService } from '../../val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookupStore } from '../../val-modules/targeting/services/ImpRadLookup.store';
import { Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ValMapService } from '../../services/app-map.service';
import { Component, OnInit } from '@angular/core';
import {SelectItem} from 'primeng/primeng';
import {ImpRadLookup} from '../../val-modules/targeting/models/ImpRadLookup';
import { MapService } from '../../services/map.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { DAOBaseStatus } from '../../val-modules/api/models/BaseModel';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { MessageService } from 'primeng/components/common/messageservice';
import { ImpProjectTrackerService } from '../../val-modules/targeting/services/ImpProjectTracker.service';
import { Response } from '@angular/http/src/static_response';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/internal/operators/map';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintLocAttrib } from '../../val-modules/targeting/models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { EsriLayerService } from '../../esri-modules/layers/esri-layer.service';
import { ValTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { isNumber } from '../../app.utils';



interface Product {
   productName: string;
   productCode: string;
}

interface Category {
   name: string;
   code: string;
}


/* Need to check with kirk how to search based on object values
export class ProjectTraker {
    id: string;
    projectName: string;
    targetor: string;
}*/

@Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.css'],
  providers: [ImpRadLookupService, ImpRadLookupStore, ImpProjectTrackerService]
})
export class DiscoveryInputComponent implements OnInit
{
   public impDiscoveryUI: ImpDiscoveryUI;
   public impProject: ImpProject = new ImpProject();

   products: Product[];
   selectedProduct: Product;

   radData: ImpRadLookup[];
   selectedRadLookup: ImpRadLookup;
   radDisabled: boolean = true;

   storeRadData: ImpRadLookup[];

   categories: Category[];
   selectedCategory: Category;

   public analysisLevels: SelectItem[];
   public selectedAnalysisLevel: SelectItem;

   seasons: SelectItem[];
   selectedSeason: String;

   public calcProductCatRadData: string;
   public productCategoryTooltip: string;

   public isCpmBlended: boolean;
   public selectCpmType: string;
   summer: boolean = true;

   public searchList = [];
   public radSearchList = [];
   public selectedRadLookupValue: string ;
   
   public trackerId: number;

   showLoadBtn: boolean = false;
   private loadRetries: number = 0;
   private analysisLevelRetries = 0;
   private mapReady: boolean = false;
   private layersReady: boolean = false;
   public validationMessage: string;
   private projectTrackerName: string = '';


   private localCopydiscoverUI: ImpDiscoveryUI = new ImpDiscoveryUI;
   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public  config: AppConfig,
               public  impDiscoveryService: ImpDiscoveryService,
               public  impProjectService: ImpProjectService,
               public  impRadLookupService: ImpRadLookupService,
               public  impGeofootprintLocationService: ImpGeofootprintLocationService,
               public  impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
               public  impGeofootprintGeoService: ImpGeofootprintGeoService,
               public  userService: UserService,
               private http: HttpClient,
               private appState: AppState,
               private mapservice: MapService,
               private usageService: UsageService,
               private messagingService: AppMessagingService,
               private valMapService: ValMapService,
               private messageService: MessageService,
               private impProjectTrackerService: ImpProjectTrackerService,
               private restService: RestDataService,
               private esriLayerService: EsriLayerService,
               private impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
               public valTradeAreaService: ValTradeAreaService)
   {
      //this.impDiscoveryService.analysisLevel.subscribe(data => this.onAnalysisSelectType(data));

      this.products = [
         {productName: 'N/A',                         productCode: 'N/A'},
         {productName: 'Display Advertising',         productCode: 'N/A'},
         {productName: 'Email',                       productCode: 'N/A'},
         {productName: 'Insert - Newspaper',          productCode: 'NP Insert'},
         {productName: 'Insert - Shared Mail',        productCode: 'SM Insert'},
         {productName: 'RedPlum Plus Dynamic Mobile', productCode: 'N/A'},
         {productName: 'Variable Data Postcard',      productCode: 'VDP'},
         {productName: 'VDP + Email',                 productCode: 'N/A'},
         {productName: 'Red Plum Wrap',               productCode: 'SM Wrap'}
      ];

      this.categories = [
         {name: 'N/A',                            code: 'NA'},
         {name: 'Auto Service/Parts',             code: 'AS03'},
         {name: 'Discount Stores',                code: 'DS01'},
         {name: 'Education',                      code: 'ED01'},
         {name: 'Financial Services',             code: 'FS01'},
         {name: 'Full Service Restaurants',       code: 'FSR03'},
         {name: 'Hardware_Home Improvement Ctrs', code: 'HI03'},
         {name: 'Health and Beauty',              code: 'HB01'},
         {name: 'Healthcare',                     code: 'HC01'},
         {name: 'Healthcare_Optical',             code: 'OP01'},
         {name: 'Home Furnishing_Mattress',       code: 'HF01'},
         {name: 'Home Services',                  code: 'HS01'},
         {name: 'Non-profit',                     code: 'NP01'},
         {name: 'Professional',                   code: 'PF01'},
         {name: 'QSR Pizza',                      code: 'QSR01'},
         {name: 'Quick Service Restaurants',      code: 'FSR01'},
         {name: 'Reminder',                       code: 'REM'},
         {name: 'Research',                       code: 'RES'},
         {name: 'Ritual',                         code: 'RIT'},
         {name: 'Specialty Stores',               code: 'SP01'},
         {name: 'Telecommunications',             code: 'TE03'}
         ];

      this.analysisLevels = [
         {label: 'Digital ATZ', value: 'Digital ATZ'},
         {label: 'ATZ', value: 'ATZ'},
         {label: 'ZIP', value: 'ZIP'},
         {label: 'PCR', value: 'PCR'}
      ];

      this.seasons = [
         {label: 'Summer', value: 'SUMMER'},
         {label: 'Winter', value: 'WINTER'}
      ];

      // Get a reference to the project
      if (this.impProjectService.length() === 0)
      // TODO: Should the service do this?
      {
         console.log('projectService was empty, creating new project');
         this.impProject = new ImpProject();
         this.impProject.projectId = null;
         this.impProject.projectName = null;
         this.impProjectService.add([this.impProject]);
      }
      else
      this.impProject = this.impProjectService.get()[0];

      // console.log('selectedAnalysisLevel: ' + this.selectedAnalysisLevel);
      // console.log('DiscoveryInputComponent constructed');
      this.impDiscoveryService.storeObservable.subscribe(disco => this.onDiscoChange(disco[0]));
      this.valMapService.onReady$.subscribe(ready => this.mapReady = ready);
      this.esriLayerService.layersReady$.subscribe(ready => this.layersReady = ready);
  }

   /**
    * Subscribe to changes in the discovery service to be able to reflect those changes in the UI
    * @param discoData The data from the discovery service
    */
    private onDiscoChange(discoData: ImpDiscoveryUI) {
          if (discoData[0] == null) return;
          const selectItem: SelectItem = {value: discoData.analysisLevel, label: discoData.analysisLevel};
          this.onAnalysisSelectType(null);
    }

   ngOnInit()
   {
      // Set default values
      this.selectedAnalysisLevel = null;
     // MapService.analysisLevlDiscInput = this.selectedAnalysisLevel.value;
     this.calcProductCatRadData = '';
     this.productCategoryTooltip = 'Used to calculate Performance metrics';


      // If the current date + 28 days is summer
      if (this.isSummer())
         this.selectedSeason = this.seasons[0].value;
      else
         this.selectedSeason = this.seasons[1].value;

      // Subscribe to the data stores
      this.impProjectService.storeObservable.subscribe(impProject => {
         if (impProject != null && impProject.length > 0)
         {
            this.impProject = impProject[0];
            this.mapFromProject();
         }
      });
      this.impRadLookupService.storeObservable.subscribe(radData => { 
            this.storeRadData = radData; 
      });
      this.impDiscoveryService.storeObservable.subscribe(impDiscoveryUI => this.onChangeDiscovery(impDiscoveryUI));
      this.impRadLookupService.get(true);

      const sub = this.getImsProjectTrackerData().subscribe(data => {
            this.impDiscoveryService.storeProjectTrackerData = data;
      });
     
      // console.log('Discovery defaults: ', this.impDiscoveryUI);
      /*  Currently disabled in favor of hard coded categories until we identify the true source
      this.impRadLookupService.fetchData().subscribe(data => {
         console.log('DiscoveryInputComponent - impRadLookupService.fetchData returned: ' + data);
         console.log('DiscoveryInputComponent - impRadLookupService.impRadLookups.length: ' + this.impRadLookupService.impRadLookups.length);
         }) ; */
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   // TODO: This component's controls should either be mapped right from the project or a UI composite model
   public mapToProject()
   {
      // If there is nothing to map, bail early
      if (this.impDiscoveryUI == null)
      {
         console.log ('discovery-input.component - fired, but impDiscoveryUI was null, exiting');
         return;
      }
      else
         console.log ('discovery-input.component - mapToProject - fired');

      // If there is no project, create one
      if (this.impProject == null)
         this.impProject = new ImpProject();

      // Set persistence flags
      this.impProject.dirty = true;
      this.impProject.baseStatus = (this.impProject.projectId) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;

      // Update audit columns
      if (this.impProject.createUser == null)
         this.impProject.createUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
      if (this.impProject.createDate == null)
         this.impProject.createDate = new Date(Date.now());
      this.impProject.modifyUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
      this.impProject.modifyDate = new Date(Date.now());

      // Populate the ImpProject model
      this.impProject.clientIdentifierTypeCode = 'CAR_LIST';
      this.impProject.consumerPurchFreqCode    = 'REMINDER';
      this.impProject.goalCode                 = 'ACQUISITION';
      this.impProject.objectiveCode            = 'INCREASE_PENETRATION';
      this.impProject.industryCategoryCode     = this.impDiscoveryUI.industryCategoryCode,

      this.impProject.methAnalysis       = this.impDiscoveryUI.analysisLevel;
      this.impProject.totalBudget        = (this.impDiscoveryUI.totalBudget != null) ? this.impDiscoveryUI.totalBudget : this.impDiscoveryUI.circBudget;
      this.impProject.isValidated        = true;
      this.impProject.isCircBudget       = (this.impDiscoveryUI.totalBudget != null) ? false : true;
      this.impProject.isActive           = true;
      this.impProject.isSingleDate       = true;
      this.impProject.isMustCover        = true;
      this.impProject.isDollarBudget     = !this.impProject.isCircBudget;
      this.impProject.isRunAvail         = true;
      this.impProject.isHardPdi          = true;
      this.impProject.isIncludeNonWeekly = (this.impDiscoveryUI.includeNonWeekly) ? true  : false;
      this.impProject.isIncludeValassis  = (this.impDiscoveryUI.includeValassis)  ? true  : false;
      this.impProject.isExcludePob       = (this.impDiscoveryUI.includePob)       ? false : true;
      this.impProject.isIncludeAnne      = (this.impDiscoveryUI.includeAnne)      ? true  : false;
      this.impProject.isIncludeSolo      = (this.impDiscoveryUI.includeSolo)      ? true  : false;
      this.impProject.projectTrackerId   = this.impDiscoveryUI.projectTrackerId;
      this.impProject.estimatedBlendedCpm = this.impDiscoveryUI.cpm;
      this.impProject.smValassisCpm = this.impDiscoveryUI.valassisCPM;
      this.impProject.smAnneCpm = this.impDiscoveryUI.anneCPM;
      this.impProject.smSoloCpm = this.impDiscoveryUI.soloCPM;

      // TODO: This needs to be in product allocations, hijacking description for product code for now
      //this.impProject.description    = this.impDiscoveryUI.productCode;
      this.impProject.radProduct     = this.impDiscoveryUI.productCode;
   }

   public mapFromProject()
   {
      // Bail if there is no project to map from
      if (this.impProject == null || this.impProject.projectId == null)
         return;

      console.log ('discovery-input.component - mapFromProject - fired');
      this.impDiscoveryUI.industryCategoryCode = this.impProject.industryCategoryCode;
      this.selectedCategory = this.categories.filter(category => category.code === this.impProject.industryCategoryCode)[0];
      this.selectedProduct = this.products.filter(product => product.productCode === this.impProject.radProduct)[0];
      this.selectedRadLookupValue = ((this.selectedCategory != null) ? this.selectedCategory.name + ' - ' : '')
                                  + ((this.selectedProduct  != null) ? this.selectedProduct.productCode   : '');

      this.impDiscoveryUI.analysisLevel        = this.impProject.methAnalysis;
      this.selectedAnalysisLevel               = this.analysisLevels.filter(level => level.value === this.impProject.methAnalysis)[0];
      // TODO: This belongs in product allocations, which doesn't exist yet.  Using project description
      this.impDiscoveryUI.productCode          = this.impProject.description;
//    this.selectedProduct = this.products.filter(product => product.productCode = this.impProject.description)[0];
      console.log('this.impDiscoveryUI.productCode: ', this.impDiscoveryUI.productCode);

      if (this.impProject.isCircBudget)
      {
         this.impDiscoveryUI.circBudget = this.impProject.totalBudget;
         this.impDiscoveryUI.totalBudget = null;
      }
      else
      {
         this.impDiscoveryUI.circBudget = null;
         this.impDiscoveryUI.totalBudget = this.impProject.totalBudget;
      }

      // Map flags
      this.impDiscoveryUI.includeNonWeekly = this.impProject.isIncludeNonWeekly;
      this.impDiscoveryUI.includeValassis  = this.impProject.isIncludeValassis;
      this.impDiscoveryUI.includePob       = !this.impProject.isExcludePob;
      this.impDiscoveryUI.includeAnne      = this.impProject.isIncludeAnne;
      this.impDiscoveryUI.includeSolo      = this.impProject.isIncludeSolo;
      this.impDiscoveryUI.projectTrackerId = this.impProject.projectTrackerId;
      
      if (isNumber(this.impProject.estimatedBlendedCpm)){
            this.impDiscoveryUI.selectCpmType = 'isBlended';
            this.impDiscoveryUI.isCpmBlended = true;
            this.onClickCPM('Blended');
      } 
      if (isNumber(this.impProject.smValassisCpm) || isNumber(this.impProject.smAnneCpm) || isNumber(this.impProject.smSoloCpm)) {
            this.impDiscoveryUI.selectCpmType = 'isDefinedbyOwnerGroup';
            this.impDiscoveryUI.isCpmBlended = false;
            this.onClickCPM('Owner');
      }
      
      this.impDiscoveryUI.cpm = this.impProject.estimatedBlendedCpm;
      this.impDiscoveryUI.valassisCPM = this.impProject.smValassisCpm;
      this.impDiscoveryUI.anneCPM = this.impProject.smAnneCpm;
      this.impDiscoveryUI.soloCPM = this.impProject.smSoloCpm;

      console.log ('discovery-input.component - mapFromProject - finished');
      //saving the metric
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'save' });
      this.usageService.createCounterMetric(usageMetricName, null, this.impProject.projectId);
   }

   public onAnalysisSelectType(event: SelectItem) {
      this.impDiscoveryService.needsGeoRefresh = true;
      if ((!this.mapReady || !this.layersReady) && this.analysisLevelRetries < 29) {
            this.analysisLevelRetries++;
            setTimeout((() => this.onAnalysisSelectType(event)), 1000);
            return;
         }
         this.impDiscoveryService.needsGeoRefresh = true;
         console.log('Analysis level:::' , event);
         const metricsText = 'New=' + event.value + '~Old=' + this.impDiscoveryUI.analysisLevel;
         this.selectedAnalysisLevel = event;
         this.impDiscoveryUI.analysisLevel = event.value;
         this.onChangeField(null);
         const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'analysis-level', action: 'changed' });
         this.usageService.createCounterMetric(usageMetricName, metricsText, 1);
   }

   private handleError (error: any) {
      console.error(error);
      return Observable.throw(error);
   }

   // Used to make categories dependent on the value in products
   public filterCategories(productCode: string)
   {
      console.log('filterRadLookups by ' + productCode);

      this.radData = new Array();
      for (let i: number = 0; i < this.impRadLookupService.get().length; i++)
      {
         console.log (this.impRadLookupService.storeObservable[i].product + ' vs ' + this.selectedProduct.productCode);
         if (this.impRadLookupService.storeObservable[i].product == this.selectedProduct.productCode)
            this.radData.push(this.impRadLookupService.storeObservable[i]);
      }
   }

   // TODO: move to the discovery service and use to initialize selectedSeason
   public isSummer(startDate: Date = null, plusDays: number = 28) : boolean
   {
      const today: Date = new Date(startDate);
      today.setDate(today.getDate() + plusDays);
//    console.log('today + ' + plusDays + ' = ' + today + ', month: ' + today.getMonth());

      // May(4) - September (8) is Summer
      if (today.getMonth() >= 4 && today.getMonth() <= 8)
         return true;
      else
         return false;
   }

   // -----------------------------------------------------------
   // SUBSCRIPTION CALLBACK METHODS
   // -----------------------------------------------------------

   /**
    * Assigns the local cache of discovery ui data from the subscription.
    *
    * @param impDiscoveryUI The array of discovery objects received from the observable
    */
   onChangeDiscovery(impDiscoveryUI: ImpDiscoveryUI[])
   {
//    console.log('----------------------------------------------------------------------------------------');
//    console.log('discovery-input.component - onChangeDiscovery - Before: ', this.impDiscoveryUI);
      this.impDiscoveryUI = impDiscoveryUI[0]; // Array.from(impDiscoveryUI);

      // Keep the project updated
      this.mapToProject();
//    console.log('discovery-input.component - onChangeDiscovery - After:  ', this.impDiscoveryUI);
//    console.log('----------------------------------------------------------------------------------------');
   }

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
   public onClickCPM(radioName: string){
      if (radioName === 'Blended'){
            this.isCpmBlended = true;
            this.impDiscoveryUI.valassisCPM = null;
            this.impDiscoveryUI.anneCPM = null;
            this.impDiscoveryUI.soloCPM = null;
            this.selectCpmType = 'isBlended';
      }
      else{
            this.isCpmBlended = false;
            this.impDiscoveryUI.cpm =  null;
            this.selectCpmType = 'isDefinedbyOwnerGroup';
      }
   }

   public onChangeField(event?: SelectItem)
   {
      if (this.selectedCategory){
            this.impDiscoveryUI.industryCategoryCode = this.selectedCategory.code;
            this.impDiscoveryUI.industryCategoryName = this.selectedCategory.name;
      }
      
      this.impDiscoveryService.updateAt(this.impDiscoveryUI);

     /* this.impRadLookupService.storeObservable.subscribe(res => {
            //console.log('good:', res);
            let isvalid = false;
            res.forEach(radLookup => {
                  if (!isvalid){
                        if (this.impDiscoveryUI.industryCategoryCode &&
                            this.impDiscoveryUI.industryCategoryCode['name'] === radLookup['category'] &&
                            this.impDiscoveryUI.productCode['productCode'] ===  radLookup['product']){
                              this.productCategoryTooltip = '';
                              isvalid = true;
                        }
                        else{
                              this.productCategoryTooltip = 'Performance data is not available';
                        }
                  }
            });
      });*/
   }

   public onChangeSeason(event){
      const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.selectedSeason;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'seasonality', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.impDiscoveryUI.selectedSeason = event;
      this.onChangeField(event);
   }
   
   public onChangePob(event){
      this.impDiscoveryService.needsGeoRefresh = true;   
      const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.includePob;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'include-pob-geo', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.impDiscoveryUI.includePob = event;
      this.localCopydiscoverUI.includePob = this.impDiscoveryUI.includePob;
      this.impDiscoveryService.needsGeoRefresh = true;
      this.onChangeField(event);
   }
   public onChangeIncludeVal(event){
      this.impDiscoveryService.needsGeoRefresh = true;   
      const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.includeValassis;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'include-valassis-geo', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.impDiscoveryUI.includeValassis = event;
      this.impDiscoveryService.needsGeoRefresh = true;
      this.onChangeField(event);
   }
   public onChangeIncludeAnne(event){
      this.impDiscoveryService.needsGeoRefresh = true;   
      const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.includeAnne;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'include-anne-geo', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.impDiscoveryUI.includeAnne = event;
      this.impDiscoveryService.needsGeoRefresh = true;
      this.onChangeField(event);
   }
   public onChangeIncludeSolo(event){
      this.impDiscoveryService.needsGeoRefresh = true;   
      const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.includeSolo;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'include-solo-geo', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.impDiscoveryUI.includeSolo = event;
      this.impDiscoveryService.needsGeoRefresh = true;
      this.onChangeField(event);
   }
   public dollarBudgetChange(event){
      let metricsText = null;
      if (this.localCopydiscoverUI.totalBudget != null )
             metricsText = 'New=' + this.impDiscoveryUI.totalBudget + '~Old=' + this.localCopydiscoverUI.totalBudget;
      else 
             metricsText = 'New=' + this.impDiscoveryUI.totalBudget + '~Old=' + null;       
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'dollar-budget', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.totalBudget = this.impDiscoveryUI.totalBudget;
      this.onChangeField(event);
   }
   public onChangecircBudget(event){
      let  metricsText = null;
      if (this.localCopydiscoverUI.circBudget != null )
             metricsText = 'New=' + this.impDiscoveryUI.circBudget + '~Old=' + this.localCopydiscoverUI.circBudget;
      else 
             metricsText = 'New=' + this.impDiscoveryUI.circBudget + '~Old=' + null;  
     // 'New=' + event + '~Old=' + this.impDiscoveryUI.circBudget;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'circ-budget', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.circBudget = this.impDiscoveryUI.circBudget;
      this.onChangeField(event);
   }
   public onChangeBlendedCpm(event){
      let  metricsText = null;
      if (this.localCopydiscoverUI.cpm != null)
            metricsText = 'New=' + this.impDiscoveryUI.cpm + '~Old=' + this.localCopydiscoverUI.cpm;
      else 
            metricsText = 'New=' + this.impDiscoveryUI.cpm + '~Old=' + null;  
     // const metricsText = 'New=' + event + '~Old=' + this.impDiscoveryUI.cpm;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'blended-cpm', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.cpm = this.impDiscoveryUI.cpm;
      this.onChangeField(event);
   }

   public onChangeValCpm(event){
      let  metricsText = null;
      if (this.localCopydiscoverUI.valassisCPM != null )
             metricsText = 'New=' + this.impDiscoveryUI.valassisCPM + '~Old=' + this.localCopydiscoverUI.valassisCPM;
      else 
             metricsText = 'New=' + this.impDiscoveryUI.valassisCPM + '~Old=' + null;  
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'valassis-cpm', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.valassisCPM = this.impDiscoveryUI.valassisCPM;
      this.onChangeField(event);
   }
   public onChangeAnneCpm(event){
      let  metricsText = null;
      if (this.localCopydiscoverUI.anneCPM != null )
             metricsText = 'New=' + this.impDiscoveryUI.anneCPM + '~Old=' + this.localCopydiscoverUI.anneCPM;
      else 
             metricsText = 'New=' + this.impDiscoveryUI.anneCPM + '~Old=' + null;  
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'anne-cpm', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.anneCPM = this.impDiscoveryUI.anneCPM;
      this.onChangeField(event);
   }
   public onChangeSoloCpm(event){
      let  metricsText = null;
      if (this.localCopydiscoverUI.soloCPM != null )
             metricsText = 'New=' + this.impDiscoveryUI.soloCPM + '~Old=' + this.localCopydiscoverUI.soloCPM;
      else 
             metricsText = 'New=' + this.impDiscoveryUI.soloCPM + '~Old=' + null;     
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'solo-cpm', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.localCopydiscoverUI.soloCPM = this.localCopydiscoverUI.soloCPM;
      this.onChangeField(event);
   }

   public onChangeProjectId(event: SelectItem)
   {
      // Conditionally display the load button if the projectId has a value
      this.showLoadBtn = (this.impProject && this.impProject.projectId) ? true : false;
   }

   public onChangeProduct(event: SelectItem)
   {
      console.log('Product was changed - ' + this.selectedProduct + ' (' + event.value.productCode + ')');
      const metricsText = 'New=' + this.selectedProduct.productName + '~Old=' + this.impDiscoveryUI.productCode;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'product', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      if (event.value != null)
      {
         this.radDisabled = false;
         //this.filterCategories(event.value.productCode);
         this.impDiscoveryUI.productCode = event.value.productCode;
      }
      else
      {
         this.radDisabled = true;
         this.selectedRadLookup = null;
      }

      this.onChangeField(event);
      this.radDataCalc();

   }

   public onChangeCategory(event: SelectItem){
      const metricsText = 'New=' + this.selectedCategory.name + '~Old=' + this.impDiscoveryUI.industryCategoryName;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'category', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);

      this.radDataCalc();
      this.onChangeField(event);
      //this.impDiscoveryUI.industryCategoryCode
   }

   public onStopTransaction()
   {
      this.impProjectService.transactionManager.stopTransaction();
   }

   public onLogTradeAreas()
   {
      this.impGeofootprintTradeAreaService.debugLogStore('TRADE AREAS');
   }

   public loadProject()
   {
      this.messagingService.startSpinnerDialog('PROJECTLOAD', 'Loading project ' + this.impProject.projectId);
      if ((!this.mapReady || !this.layersReady) && this.loadRetries < 29) {
            this.loadRetries++;
            setTimeout((() => this.loadProject()), 1000);
            return;
      }
      this.loadRetries = 0;

      if ( this.impDiscoveryUI.projectTrackerId != null){
            this.trackerId = this.impDiscoveryUI.projectTrackerId;
      }
      console.log('discovery-input.component - loadProject fired');
            // Load the project
      this.impProjectService.loadProject(this.impProject.projectId);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'load' });
      this.usageService.createCounterMetric(usageMetricName, null, this.impProject.projectId);
      // set local copy of discovery ui
      //this.localCopydiscoverUI = this.impDiscoveryService.get()[0];
       this.localCopydiscoverUI.totalBudget = this.impProject.totalBudget;
       this.localCopydiscoverUI.cpm  = this.impProject.estimatedBlendedCpm;
       this.localCopydiscoverUI.valassisCPM = this.impProject.smValassisCpm;
       this.localCopydiscoverUI.anneCPM = this.impProject.smAnneCpm;
       this.localCopydiscoverUI.soloCPM = this.impProject.smSoloCpm;
       this.localCopydiscoverUI.projectTrackerId = this.impProject.projectTrackerId;
      //  this.impGeofootprintGeoService.storeObservable.subscribe (geos => {
      //       if (geos != null && geos.length > 0) this.valTradeAreaService.ZoomToTA();
      //   }
      //   )
   }

   public saveProject()
   {
      console.log('discovery-input.component.saveProject - fired');
      let errorString = '';
      // Map the discovery data to the project
      this.mapToProject();

      // check for required fields
      if (this.impProject.projectName == null || this.impProject.projectName == '')
            errorString = 'imPower Project Name is required<br>';
      if (this.impProject.methAnalysis == null || this.impProject.methAnalysis == '')
            errorString += 'Analysis level is required';
      if (errorString !== '') {
            this.messagingService.showGrowlError('Error Saving Project', errorString);
            return;
      }

      // Save the project
      this.impProjectService.saveProject();


   }

   fetchRadData() {
      console.log('discovery-input-component calling imsRadLookupStore.get');
      this.impRadLookupService.get(true);
   }

   addRadData() {
      console.log('discovery-input-component calling imsRadLookupStore.addRadData');

      const impRadLookup: ImpRadLookup = new ImpRadLookup();
      impRadLookup.radId = 99;
      impRadLookup.category = 'Shark Week DvDs';

      this.impRadLookupService.add([impRadLookup], this.addPreOp);

   //   add(impRadLookups: ImpRadLookup[], preOperation?: callbackElementType, postOperation?: callbackSuccessType)
   }


   addRadDataOneBad() {
      console.log('discovery-input-component calling imsRadLookupStore.addRadDataOneBad');

      const impRadLookup: ImpRadLookup = new ImpRadLookup();
      impRadLookup.radId = 99;
      impRadLookup.category = 'Shark Week DvDs';
      const impRadLookup2: ImpRadLookup = new ImpRadLookup();
      impRadLookup.radId = 142;
      impRadLookup.category = 'Save the Sharks button';

      const impRadLookups: ImpRadLookup[] = [new ImpRadLookup({radId: 99, category: 'Shark Week DvDs', product: null}),
                                             new ImpRadLookup({radId: 120, category: 'Kung Fu Shrimp Backpack'}),
                                             new ImpRadLookup({radId: 142, category: 'Save the Sharks button'})];

      this.impRadLookupService.add(impRadLookups, this.addPreOp2);

   //   add(impRadLookups: ImpRadLookup[], preOperation?: callbackElementType, postOperation?: callbackSuccessType)
   }

   addPreOp (impRadLookup: ImpRadLookup) : boolean
   {
      console.log('Fired addPreOp on ', impRadLookup);
      return true;
   }

   addPreOp2 (impRadLookup: ImpRadLookup) : boolean
   {
      console.log('Fired addPreOp2 on ', impRadLookup);
      console.log('addPreOp2 returning: ', (impRadLookup.radId === 99) ? false : true);

      if (impRadLookup.radId === 99)
         console.log('addPreOp2 returning: false');
      else
         console.log('addPreOp2 returning: true');

      if (impRadLookup.radId === 99)
         return false;
      else
         return true;
      // return (impRadLookup.radId === 99) ? false : true;
   }

   clearRadData() {
      console.log('discovery-input-component calling imsRadLookupStore.clearAll');
      this.impRadLookupService.clearAll();
   }

   removeRadData() {
      console.log('discovery-input-component calling imsRadLookupStore.remove');

      const impRadLookup: ImpRadLookup = new ImpRadLookup();
      impRadLookup.radId = 99;
      impRadLookup.category = 'Shark Week DvDs';

      this.impRadLookupService.remove(impRadLookup);
   }

   removeRadDataAt() {
      console.log('discovery-input-component calling imsRadLookupStore.remove');

      this.impRadLookupService.removeAt(0);
   }

   radDataCalc(){
      this.impRadLookupService.storeObservable.subscribe(res => {
            let isvalid = false;
            res.forEach(radLookup => {
                  if (!isvalid){
                     if (this.impDiscoveryUI.industryCategoryCode !== '' && this.impDiscoveryUI.productCode !== ''){
                        if (this.impDiscoveryUI.industryCategoryName === radLookup['category'] &&  this.impDiscoveryUI.productCode ===  radLookup['product']){
                              this.calcProductCatRadData = '';
                              isvalid = true;
                         }
                         else{
                               this.calcProductCatRadData = 'Performance data is not available for the selected Product and Industry Category.';
                         }
                     }
                  }
            });
      });

   }

   // -----------------------------------------------------------
   // UNIT TEST METHODS (MOVE TO SPEC.TS)
   // -----------------------------------------------------------
   testIsSummer(aDate: Date = new Date(), numDays: number = 28)
   {
      const newDate: Date = new Date(aDate);
      newDate.setDate(aDate.getDate() + 28);
      console.log(aDate + ' plus ' + numDays + ' days ' + newDate + ', isSummer = ' + this.isSummer(aDate, numDays));
   }

   unitTestIsSummer()
   {
      console.log('DATE IS SUMMER TESTS');
      console.log('--------------------');
      this.testIsSummer();
      this.testIsSummer(new Date('01 Jan 2018'));
      this.testIsSummer(new Date('01 May 2018'));
      this.testIsSummer(new Date('01 Sep 2018'));
      this.testIsSummer(new Date('01 Oct 2018'));
      this.testIsSummer(new Date('01 Apr 2018'));
   }

   filterRadData(event) {
      const value = event.query; 
      this.radSearchList = [];
      const excludeList: string[] = [];
      const excludeSet = new Set(['reminder', 'research', 'ritual']);
      //if (value.length > 2) {
            let matchingValues = this.storeRadData.filter( item => {
                  return item.category.toLowerCase().includes(value.toLowerCase()) || item.product.toLowerCase().includes(value.toLowerCase());
            }).map(item => {
                  if (!excludeSet.has(item.category.toLowerCase())){
                        return item.category + ' - ' + item.product;
                  }else{
                        excludeList.push(item.category + ' - ' + item.product);
                  }
            }).sort();
            
            excludeList.sort();
            //matchingValues.reduce().concat(...excludeList);
            matchingValues.push(...excludeList);
            matchingValues = matchingValues.filter(x => x != null);
           /* sort((n1 , n2 ) => {
                  if (n1.includes('Ritual')){
                        return 1;
                  }
                  if (n2.includes('Ritual')){
                        return 1;
                  }
            });*/
            this.radSearchList.push(...matchingValues);
     // }
   }

   onSelectRadData(event: string){
        
         const data: string[] = event.split('-');
         this.impDiscoveryUI.productCode = data[1].trim();
         const categoryValue = this.categories.filter(category => {  
            if (category.name.toLowerCase().trim() == data[0].toLowerCase().trim()){
                  this.impDiscoveryUI.industryCategoryCode = category.code;
                  this.impDiscoveryUI.industryCategoryName = category.name;
                  return category;
            }
         });
      let metricsText = 'New=' + this.selectedProduct.productName + '~Old=' + this.impDiscoveryUI.productCode;
      let usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'product', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);

      metricsText = 'New=' + this.selectedCategory.name + '~Old=' + this.impDiscoveryUI.industryCategoryName;
      usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'category', action: 'changed' });
      this.usageService.createCounterMetric(usageMetricName, metricsText, null);
      this.onChangeField();         
   }

   filterProjectTracker(event) {
      const value = event.query; 
      this.searchList = [];
      if (value.length > 2) {
            const respList: string[] = [];
            const matchingValues = this.impDiscoveryService.storeProjectTrackerData.filter(item => {
                  if (item['targetor'] != null){
                        return item['projectId'].toString().toLowerCase().includes(value.toLowerCase()) || item['projectName'].toLowerCase().includes(value.toLowerCase()) || item['targetor'].toLowerCase().includes(value.toLowerCase());
                  }
                  else{
                        return item['projectId'].toString().toLowerCase().includes(value.toLowerCase()) || item['projectName'].toLowerCase().includes(value.toLowerCase()) ;
                  }
                  
            }).map(item => {
                  return item['targetor'] != null ? item['projectId'] + '   ' + item['projectName'] + '  (' + item['targetor'] + ')' : item['projectId'] + '   ' + item['projectName'] + '  (Unassigned)' ;
            });
            this.searchList.push(...matchingValues);

           /* this.projectTrackerData.forEach((item => {
                  //console.log('item value::::', item);
                  let dataString = null;
                  if ( item['targetor'] != null){
                        dataString = item['projectId'] + '   ' + item['projectName'] + '  (' + item['targetor'] + ')'  ;
                  }
                  else{
                        dataString = item['projectId'] + '   ' + item['projectName'] + '  (Unassigned)'  ;
                  }

                  
                  if (dataString.toLowerCase().indexOf(value.toLowerCase()) > -1){
                        this.searchList.push(dataString);
                  }
            }));*/
          
      }
    }

    public onChangeProjectTracker(event){
          let clientName: string = event.substring(0, event.indexOf(' '));  
          clientName = clientName.trim(); 
          if (event.length > 6){
            let  metricsText = null;
            this.impDiscoveryUI.projectTrackerId  = parseFloat(event);
            if (this.localCopydiscoverUI.projectTrackerId != null )
                  metricsText = 'New=' + this.impDiscoveryUI.projectTrackerId + '~Old=' + this.localCopydiscoverUI.projectTrackerId;
            else 
                  metricsText = 'New=' + this.impDiscoveryUI.projectTrackerId + '~Old=' + null;  
            const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project-tracker-id', action: 'changed' });
            this.usageService.createCounterMetric(usageMetricName, metricsText, null);
            this.localCopydiscoverUI.projectTrackerId = this.impDiscoveryUI.projectTrackerId;
            
            if (this.impProject.projectName == null && this.impProject.projectId == null){
                  this.impProject.projectName = event.substring(this.impDiscoveryUI.projectTrackerId.toString().length, event.indexOf('('));
                  this.impProject.projectName = this.impProject.projectName.trim();
            }
           if (this.impProject.clientIdentifierName == null){
                const temp = this.impDiscoveryService.storeProjectTrackerData.filter(id => {
                                                                                                if (id['projectId'] === Number(clientName)){
                                                                                                      this.impProject.clientIdentifierName = id['clientName'];
                                                                                                      this.impProject.customerNumber = id['projectId'];
                                                                                                } else return false;
                                                                                          }); 
           } 
           this.onChangeField(event);
          }
          else{
            this.impDiscoveryUI.projectTrackerId = event;
            this.onChangeField(event);
          }       
    }

    public getImsProjectTrackerData() : Observable<Response>{
          let updatedDateFrom = null;
          let updatedDateTo = null;
         updatedDateTo = new Date();
         updatedDateTo.setDate(updatedDateTo.getDate() + 1);
         updatedDateTo = this.formatDate(updatedDateTo);
          updatedDateFrom = new Date();
          updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);
          updatedDateFrom = this.formatDate(updatedDateFrom);
         return this.restService.get(`v1/targeting/base/impimsprojectsview/search?q=impimsprojectsview&fields=PROJECT_ID projectId,PROJECT_NAME projectName,
          TARGETOR targetor,CLIENT_NAME%20clientName&updatedDateFrom=${updatedDateFrom}&updatedDateTo=${updatedDateTo}&sort=UPDATED_DATE&sortDirection=desc`).pipe(
           map((result: any) => result.payload.rows)
          // console.log('result.payload.rows::::', result.payload.rows))
          );
     
    }
    public formatDate(date) {
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 101).toString().substring(1);
      const day = (date.getDate() + 100).toString().substring(1);
      return year + '-' + month + '-' + day;
}
   
}
