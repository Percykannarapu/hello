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
   productItems: SelectItem[];

   selectedProduct: Product;

   radData: ImpRadLookup[];
   radDataItems: SelectItem[];
   selectedRadLookup: ImpRadLookup;

   constructor(public impRadLookupService: ImpRadLookupService)
   {
      this.products = [
         {productName: 'Display Advertising',         productCode: 'DISPLAY'},
         {productName: 'Email',                       productCode: 'EMAIL'},
         {productName: 'Insert - Newspaper',          productCode: 'INS_NEWS'},
         {productName: 'Insert - Shared Mail',        productCode: 'SM Insert'}, // 'INS_SHARED'},
         {productName: 'RedPlum Plus Dynamic Mobile', productCode: 'RPDM'},
         {productName: 'Variable Data Postcard',      productCode: 'VDP'},
         {productName: 'VDP + Email',                 productCode: 'VDP_EMAIL'},
         {productName: 'Red Plum Wrap',               productCode: 'WRAP'}
      ];

      // Build the SelectItem API label-value pairs array
      this.productItems = new Array(this.products.length);
      for (let i: number = 0; i < this.products.length; i++)
         this.productItems[i] = {label: this.products[i].productName, value: {id: i, name: this.products[i].productName, code: this.products[i].productCode} };
      console.log('DiscoveryInputComponent constructed');
   }

   ngOnInit() {
      this.impRadLookupService.fetchData().subscribe(data => {
         console.log('DiscoveryInputComponent - impRadLookupService.fetchData returned: ' + data);
         console.log('DiscoveryInputComponent - impRadLookupService.impRadLookups.length: ' + this.impRadLookupService.impRadLookups.length);

         this.radDataItems = new Array(this.impRadLookupService.impRadLookups.length);
         for (let i: number = 0; i < this.impRadLookupService.impRadLookups.length; i++)
//            if (this.productItems[i].value == this.selectedProduct.productCode)
               this.productItems[i] = {label: this.impRadLookupService.impRadLookups[i].category, value: {id: i, name: this.impRadLookupService.impRadLookups[i].category, code: this.impRadLookupService.impRadLookups[i].radId} };            
      }) ;
      /*
      this.impRadLookupService
      .get<ImpRadLookup[]>()
      .subscribe((data: ImpRadLookup[]) => this.radData = data,
       error => () => {
         console.error('An error occurred', error);
       },
       () => {
         console.log('impRadLookupService success');
       });*/
   }


//    getRadLookupData() : Observable<ImpRadLookup[]> {
//       console.log('getRadLookupData fired');
//       return this.http.get(radDataUrl)
//         .do(data => console.log(data)) // view results in the console
//   //      .map(res => res.json())
//         .catch(this.handleError);
//     }
  
  /*
    getGeos(): Observable <any> {
      console.log('GfGeoService.getGeos fired');
      return this.http.get(geofootprintGeosUrl)
                      .subscribe*/
  /*                    .map(response => response.json().contents)
                      .catch((err: Response|any) => {
                                                      return Observable.throw(err.statusText);
                                                    });*/
  // }
  
    private handleError (error: any) {
      // In a real world app, we might send the error to remote logging infrastructure
      // and reformat for user consumption
      console.error(error); // log to console instead
      return Observable.throw(error);
    }   
}
