import { ImpProjectService } from './../../val-modules/targeting/services/ImpProject.service';
import { UserService } from './../../services/user.service';
import { AuthService } from './../../services/auth.service';
import { GeofootprintMaster } from './../../models/GeofootprintMaster';
import { ImpProductService } from './../../val-modules/mediaplanning/services/ImpProduct.service';
import { ImpGeofootprintLocationService } from './../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from './../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpDiscoveryUI } from './../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from './../../services/ImpDiscoveryUI.service';
import { AppState } from './../../app.state';
import { ImpRadLookupService } from './../../val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookupStore } from './../../val-modules/targeting/services/ImpRadLookup.store';

import { Observable } from 'rxjs/Observable';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {ImpProduct} from './../../val-modules/mediaplanning/models/ImpProduct';
import { Component, OnInit, Pipe, PipeTransform, Input } from '@angular/core';
import {SelectItem} from 'primeng/primeng';
import {ImpRadLookup} from './../../val-modules/targeting/models/ImpRadLookup';
import { MapService } from '../../services/map.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ClientIdentifierType } from '../../val-modules/mediaexpress/models/ClientIdentifierType';
import { ConsumerPurchasingFreq } from '../../val-modules/mediaexpress/models/ConsumerPurchasingFreq';
import { Goal } from '../../val-modules/mediaexpress/models/Goal';
import { Objective } from '../../val-modules/mediaexpress/models/Objective';
import { ImpGeofootprintMaster } from '../../val-modules/targeting/models/ImpGeofootprintMaster';
import { RestResponse } from '../../models/RestResponse';
import { DAOBaseStatus } from '../../val-modules/api/models/BaseModel';

interface Product {
   productName: string;
   productCode: string;
}

interface Category {
   name: string;
   code: string;
}

@Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.css'],
  providers: [ImpRadLookupService, ImpRadLookupStore]
})
export class DiscoveryInputComponent implements OnInit
{
   @Input() debugMode: boolean = false;

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

   public productCategoryTooltip: string;

   summer: boolean = true;
   
   showLoadBtn: boolean = false;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public impDiscoveryService: ImpDiscoveryService,
               public impProjectService: ImpProjectService,
               public impRadLookupService: ImpRadLookupService,
               public impGeofootprintLocationService: ImpGeofootprintLocationService,
               public userService: UserService,
               private http: HttpClient,
               private appState: AppState,
               private mapservice: MapService)
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
//      if (this.impProject == null)
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
   }

   ngOnInit()
   {
      // Set default values
      this.selectedAnalysisLevel = null;
     // MapService.analysisLevlDiscInput = this.selectedAnalysisLevel.value;
      this.productCategoryTooltip = 'Used to calculate Performance metrics';

      // If the current date + 28 days is summer
      if (this.isSummer())
         this.selectedSeason = this.seasons[0].value;
      else
         this.selectedSeason = this.seasons[1].value;

      // Subscribe to the data stores
      this.impProjectService.storeObservable.subscribe(impProject => { this.impProject = impProject[0]; this.mapFromProject(); });
      this.impRadLookupService.storeObservable.subscribe(radData => this.storeRadData = radData);
      this.impDiscoveryService.storeObservable.subscribe(impDiscoveryUI => this.onChangeDiscovery(impDiscoveryUI));
      this.impRadLookupService.get(true);

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
      if (this.impProject == null)
         return;

      console.log ('discovery-input.component - mapToProject - fired');
      this.impProject.dirty = true;
      this.impProject.baseStatus = (this.impProject.projectId) ? DAOBaseStatus.UPDATE : DAOBaseStatus.INSERT;
      if (this.impProject.createUser == null)
         this.impProject.createUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
      if (this.impProject.createDate == null)
         this.impProject.createDate = new Date(Date.now());
      this.impProject.modifyUser = (this.userService.getUser().userId) ? (this.userService.getUser().userId) : -1;
      this.impProject.modifyDate = new Date(Date.now());
      this.impProject.clientIdentifierTypeCode = 'CAR_LIST';
      this.impProject.consumerPurchFreqCode = 'REMINDER';
      this.impProject.goalCode = 'ACQUISITION';
      this.impProject.objectiveCode = 'INCREASE_PENETRATION';
      this.impProject.industryCategoryCode = this.impDiscoveryUI.industryCategoryCode,
//      this.impProject.projectName    = 'Whee Look at me!  I\'m Angie Dickenson';
//      this.impProject.description    = 'Yep, this is a project description';
      this.impProject.methAnalysis   = this.impDiscoveryUI.analysisLevel;
      this.impProject.totalBudget    = (this.impDiscoveryUI.totalBudget != null) ? this.impDiscoveryUI.totalBudget : this.impDiscoveryUI.circBudget;
      this.impProject.isValidated    = true;
      this.impProject.isCircBudget   = (this.impDiscoveryUI.totalBudget != null) ? false : true;
      this.impProject.isSingleDate   = true;
      this.impProject.isExcludePob   = (this.impDiscoveryUI.includePob) ? true : false;
      this.impProject.isActive       = true;
      this.impProject.isSingleDate   = true;
      this.impProject.isMustCover    = true;
      this.impProject.isDollarBudget = true;
      this.impProject.isRunAvail     = true;
      this.impProject.isHardPdi      = true;

      // TODO: This needs to be in product allocations, hijacking description for product code for now
      this.impProject.description    = this.impDiscoveryUI.productCode;
   }

   public mapFromProject()
   {
      // Bail if there is no project to map from
      if (this.impProject == null || this.impProject.projectId == null)
         return;
      
      console.log ('discovery-input.component - mapFromProject - fired');
      this.impDiscoveryUI.industryCategoryCode = this.impProject.industryCategoryCode;
      this.selectedCategory = this.categories.filter(category => category.code === this.impProject.industryCategoryCode)[0];

      this.impDiscoveryUI.analysisLevel        = this.impProject.methAnalysis;
      this.selectedAnalysisLevel               = this.analysisLevels.filter(level => level.value === this.impProject.methAnalysis)[0];
      // TODO: This belongs in product allocations, which doesn't exist yet.  Using project description
      this.impDiscoveryUI.productCode          = this.impProject.description
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
      
      this.impDiscoveryUI.includePob = this.impProject.isExcludePob;
      console.log ('discovery-input.component - mapFromProject - finished');
   }

   public onAnalysisSelectType(event: SelectItem) {
         console.log('Analysis level:::' , event);
         this.selectedAnalysisLevel = event;
         this.impDiscoveryUI.analysisLevel = event.value;
         this.onChangeField(null);
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
      for (let i: number = 0; i < this.impRadLookupService.get(true).length; i++)
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
//    console.log('discovery-input.component - onChangeDiscovery - After:  ', this.impDiscoveryUI);
//    console.log('----------------------------------------------------------------------------------------');
   }

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------   
   public onChangeField(event: SelectItem)
   {
      this.impDiscoveryUI.industryCategoryCode = this.selectedCategory.code;

      this.impDiscoveryService.updateAt(this.impDiscoveryUI);

      this.impRadLookupService.storeObservable.subscribe(res => {
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
      });
   }

   public onChangeProjectId(event: SelectItem)
   {
      // Conditionally display the load button if the projectId has a value
      this.showLoadBtn = (this.impProject && this.impProject.projectId) ? true : false;
   }

   public onChangeProduct(event: SelectItem)
   {
      console.log('Product was changed - ' + event.value.productName + ' (' + event.value.productCode + ')');
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
   }

   public loadProject()
   {
      console.log('discovery-input.component - loadProject fired');

      // Load the project
      this.impProjectService.loadProject(this.impProject.projectId);
   }

   public saveProject()
   {
      // Map the discovery data to the project
      this.mapToProject();

      // Save the project
      this.impProjectService.saveProject();      
      this.impProject = this.impProjectService.get()[0];
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

   debugLogStore() {
      this.impRadLookupService.debugLogStore();
   }

   // -----------------------------------------------------------
   // UNIT TEST METHODS (MOVE SOMEWHERE ELSE)
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
}
