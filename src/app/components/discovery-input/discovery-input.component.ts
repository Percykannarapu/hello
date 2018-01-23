import { ImpRadLookupService } from './../../val-modules/targeting/services/ImpRadLookup.service';

import { Observable } from 'rxjs/Observable';
import { HttpClient } from '@angular/common/http';
//import {HttpClientModule} from '@angular/common/http';  // replaces previous Http service
import {ImpProduct} from './../../val-modules/mediaplanning/models/ImpProduct';
import {Component, OnInit} from '@angular/core';
import {SelectItem} from 'primeng/primeng';
import {ImpRadLookup} from './../../val-modules/targeting/models/ImpRadLookup';

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
  providers: [ImpRadLookupService]
})
export class DiscoveryInputComponent implements OnInit
{
   products: Product[];
   selectedProduct: Product;

   radData: ImpRadLookup[];
   selectedRadLookup: ImpRadLookup;
   radDisabled: boolean = true;

   categories: Category[];
   selectedCategory: Category;
   
   analysisLevels: SelectItem[];
   selectedAnalysisLevel: string;
   
   summer: boolean = true;

   // -----------------------------------------------------------
   // LIFECYCLE METHODS
   // -----------------------------------------------------------
   constructor(public impRadLookupService: ImpRadLookupService)
   {
      this.products = [
         {productName: 'Display Advertising',         productCode: 'SM Insert'},
         {productName: 'Email',                       productCode: 'SM Insert'},
         {productName: 'Insert - Newspaper',          productCode: 'NP Insert'},
         {productName: 'Insert - Shared Mail',        productCode: 'SM Insert'},
         {productName: 'RedPlum Plus Dynamic Mobile', productCode: 'SM Insert'},
         {productName: 'Variable Data Postcard',      productCode: 'VDP'},
         {productName: 'VDP + Email',                 productCode: 'SM Postcard'},
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
         {label: 'Atz', value: 'ATZ'},
         {label: 'Zip', value: 'ZIP'},
         {label: 'Pcr', value: 'PCR'}
      ];
      this.selectedAnalysisLevel = this.analysisLevels[1].value;

      console.log('selectedAnalysisLevel: ' + this.selectedAnalysisLevel);
      console.log('DiscoveryInputComponent constructed');
   }

   ngOnInit() {
      /*  Currently disabled in favor of hard coded categories until we identify the true source
      this.impRadLookupService.fetchData().subscribe(data => {
         console.log('DiscoveryInputComponent - impRadLookupService.fetchData returned: ' + data);
         console.log('DiscoveryInputComponent - impRadLookupService.impRadLookups.length: ' + this.impRadLookupService.impRadLookups.length);
         }) ; */
   }

   // -----------------------------------------------------------
   // UTILITY METHODS
   // -----------------------------------------------------------
   private handleError (error: any) {
      console.error(error);
      return Observable.throw(error);
   }   

   // Used to make categories dependent on the value in products
   public filterCategories(productCode: string)
   {
      console.log('filterRadLookups by ' + productCode);

      this.radData = new Array();
      for (let i: number = 0; i < this.impRadLookupService.impRadLookups.length; i++)
      {
         console.log (this.impRadLookupService.impRadLookups[i].product + ' vs ' + this.selectedProduct.productCode);
         if (this.impRadLookupService.impRadLookups[i].product == this.selectedProduct.productCode)
            this.radData.push(this.impRadLookupService.impRadLookups[i]);
      }
   }

   // -----------------------------------------------------------
   // UI CONTROL EVENTS
   // -----------------------------------------------------------
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
   }
}
