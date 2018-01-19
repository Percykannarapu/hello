import {HttpClient} from '@angular/common/http';
import {ImpProduct} from './../../val-modules/mediaplanning/models/ImpProduct';
import {Component, OnInit} from '@angular/core';
import {SelectItem} from 'primeng/primeng';

interface Product {
   productName: string;
   productCode: string;
}

 @Component({
  selector: 'val-discovery-input',
  templateUrl: './discovery-input.component.html',
  styleUrls: ['./discovery-input.component.css']
})
export class DiscoveryInputComponent implements OnInit
{
   products: Product[];
   productItems: SelectItem[];

   selectedProduct: Product;

   constructor(public http: HttpClient)
   {
      this.products = [
         {productName: 'Display Advertising',         productCode: 'DISPLAY'},
         {productName: 'Email',                       productCode: 'EMAIL'},
         {productName: 'Insert - Newspaper',          productCode: 'INS_NEWS'},
         {productName: 'Insert - Shared Mail',        productCode: 'INS_SHARED'},
         {productName: 'RedPlum Plus Dynamic Mobile', productCode: 'RPDM'},
         {productName: 'Variable Data Postcard',      productCode: 'VDP'},
         {productName: 'VDP + Email',                 productCode: 'VDP_EMAIL'},
         {productName: 'Red Plum Wrap',               productCode: 'WRAP'}
      ];

      // Build the SelectItem API label-value pairs array
      this.productItems = new Array(this.products.length);
      for (let i: number = 0; i < this.products.length; i++)
         this.productItems[i] = {label: this.products[i].productName, value: {id: i, name: this.products[i].productName, code: this.products[i].productCode} };
   }

   ngOnInit() {
   }

}
