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
   
   analysisLevels: SelectItem[];

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
      console.log('DiscoveryInputComponent constructed');
   }

   ngOnInit() {
      this.impRadLookupService.fetchData().subscribe(data => {
         console.log('DiscoveryInputComponent - impRadLookupService.fetchData returned: ' + data);
         console.log('DiscoveryInputComponent - impRadLookupService.impRadLookups.length: ' + this.impRadLookupService.impRadLookups.length);
         }) ;
   }

   // UTILITY METHODS
   private handleError (error: any) {
      console.error(error);
      return Observable.throw(error);
   }   

   public filterRadLookups(productCode: string)
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

   // UI CONTROL EVENTS
   public onChangeProduct(event: SelectItem)
   {       
      console.log('Product was changed - ' + event.value.productName + ' (' + event.value.productCode + ')');      
      if (event.value != null)
      {
         this.radDisabled = false;
         this.filterRadLookups(event.value.productCode);
      }
      else
      {
         this.radDisabled = true;
         this.selectedRadLookup = null;
      }
   }
}
