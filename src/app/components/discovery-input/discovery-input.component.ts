import { ImpDiscoveryUI } from './../../models/ImpDiscoveryUI';
import { ImpDiscoveryService } from './../../services/ImpDiscoveryUI.service';
import { AppState } from './../../app.state';
import { ImpRadLookupService } from './../../val-modules/targeting/services/ImpRadLookup.service';
import { ImpRadLookupStore } from './../../val-modules/targeting/services/ImpRadLookup.store';

import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';

import {ImpProduct} from './../../val-modules/mediaplanning/models/ImpProduct';
import { Component, OnInit, Pipe, PipeTransform, Input } from '@angular/core';
import {SelectItem} from 'primeng/primeng';
import {ImpRadLookup} from './../../val-modules/targeting/models/ImpRadLookup';
import { MapService } from '../../services/map.service';

interface Product {
   productName: string;
   productCode: string;
}

interface Category {
   name: string;
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

   summer: boolean = true;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public impDiscoveryService: ImpDiscoveryService, 
               public impRadLookupService: ImpRadLookupService, 
               private appState: AppState, private mapservice: MapService)
   {
      //this.impDiscoveryService.analysisLevel.subscribe(data => this.onAnalysisSelectType(data));

      this.products = [
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
         {name: 'Auto Service/Parts'},
         {name: 'Discount Stores'},
         {name: 'Education'},
         {name: 'Financial Services'},
         {name: 'Full Service Restaurants'},
         {name: 'Hardware_Home Improvement Ctrs'},
         {name: 'Health and Beauty'},
         {name: 'Healthcare'},
         {name: 'Healthcare_Optical'},
         {name: 'Home Furnishing_Mattress'},
         {name: 'Home Services'},
         {name: 'Non-profit'},
         {name: 'Professional'},
         {name: 'QSR Pizza'},
         {name: 'Quick Service Restaurants'},
         {name: 'Reminder'},
         {name: 'Research'},
         {name: 'Ritual'},
         {name: 'Specialty Stores'},
         {name: 'Telecommunications'}
         ];

      this.analysisLevels = [
         {label: 'ATZ', value: 'ATZ'},
         {label: 'ZIP', value: 'ZIP'},
         {label: 'PCR', value: 'PCR'}
      ];

      this.seasons = [
         {label: 'Summer', value: 'SUMMER'},
         {label: 'Winter', value: 'WINTER'}
      ];

      // console.log('selectedAnalysisLevel: ' + this.selectedAnalysisLevel);
      // console.log('DiscoveryInputComponent constructed');
   }

   ngOnInit()
   {
      // Set default values
      this.selectedAnalysisLevel = null;
     // MapService.analysisLevlDiscInput = this.selectedAnalysisLevel.value;

      // If the current date + 28 days is summer
      if (this.isSummer())
         this.selectedSeason = this.seasons[0].value;
      else
         this.selectedSeason = this.seasons[1].value;

      // Subscribe to the data stores
      this.impRadLookupService.storeObservable.subscribe(radData => this.storeRadData = radData);
      this.impDiscoveryService.storeObservable.subscribe(impDiscoveryUI => this.onChangeDiscovery(impDiscoveryUI));

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
      this.impDiscoveryService.updateAt(this.impDiscoveryUI);
//    console.log('Local Discovery data: ', this.impDiscoveryUI);
//    console.log('Store Discovery data: ', this.impDiscoveryService.get());
   }

   public onChangeProduct(event: SelectItem)
   {
      console.log('Product was changed - ' + event.value.productName + ' (' + event.value.productCode + ')');
      if (event.value != null)
      {
         this.radDisabled = false;
         //this.filterCategories(event.value.productCode);
      }
      else
      {
         this.radDisabled = true;
         this.selectedRadLookup = null;
      }

      this.onChangeField(event);
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
