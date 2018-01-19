import { Observable } from 'rxjs/Observable';
import {HttpClient} from '@angular/common/http';
import {ImpProduct} from './../../val-modules/mediaplanning/models/ImpProduct';
import {Component, OnInit} from '@angular/core';
import {SelectItem} from 'primeng/primeng';
import {ImpRadLookup} from './../../val-modules/targeting/models/ImpRadLookup';

interface Product {
   productName: string;
   productCode: string;
}

const radDataUrl = 'https://servicesdev.valassislab.com/services/v1/targeting/base/impradlookup/search?q=impRadLookup';

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

   radData: ImpRadLookup[];

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
      console.log('Firing off a call to impRadLookup');
      this.http.get(radDataUrl).subscribe(data => {
         console.log(data);
       });
   }


   getRadLookupData() : Observable<ImpRadLookup[]> {
      return this.http.get(radDataUrl)
        .do(data => console.log(data)) // view results in the console
  //      .map(res => res.json())
        .catch(this.handleError);
    }
  
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
