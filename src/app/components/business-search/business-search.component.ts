import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import {DropdownModule} from 'primeng/primeng';

@Component({
  providers: [AppService],
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {
  public name: string;  // Used by parent as a header
  public numFound: number = 2;
  dropdownList: any[];
  
  selectedCategory: string;
  searchDatageos: any[];//
  // As we wire the component up to real sources, we can remove the below
  selectedCity: string;
  model: any = {};
  sourceCategories: any = [];
  targetCategories: any = [];
  filteredCategories: any = [];
  geofootprintGeos: any;
  competitors: any;
  sites: any;

  constructor(private appService: AppService) { 
    this.dropdownList = [  {name:'Apparel & Accessory Stores'},
    {name: 'Building Materials & Hardware'}, 
    {name: 'General Merchandise Stores'}, 
    {name:'Food Stores'},
    {name:'Automotive Dealers & Service Stations'},
    {name:'Home Furniture & Furnishings Stores'},
    {name:'Eating & Drinking Places'},
    {name:'Miscellaneous Retail'},
    {name:'Depository Institutions'},
    {name:'Personal Services'},
    {name:'Auto Services'},
    {name:'Leisure Services'},
    {name:'Dentists & Doctors'},
    {name:'Schools & Universities'}
];

  }

  ngOnInit() {
    this.name = 'Business Search';
    this.sourceCategories = this.appService.categoriesList;
    this.filteredCategories = this.appService.categoriesList;
  }
  assignCopy(){
    this.sourceCategories = Object.assign([], this.filteredCategories);
  }
  filterCategory(value) {
    if (!value){
      this.assignCopy();
    }
    this.sourceCategories = Object.assign([], this.filteredCategories).filter((item) => {
      return item.name ? (item.name.toLowerCase().indexOf(value.toLowerCase()) > -1) : false;
    })
  }

  onSearchBusiness(){
    let paramObj = {
      "sites": [
      
        {
          "x": "-90.38018",
          "y": "38.557349"
        },
        {
          "x": "-118.361572",
          "y": "34.068947"
        }    
          
      ],
      
    // "radius" : "3",
    // "name" : "INSTITUTE",
    // "city" : "ST LOUIS",
    // "state" : "MO",
    // "zip" : "63127",
    // "countyName" : "SAINT LOUIS",
    // "eliminateBlankFirmNames" : "True",
    // "siteLimit" : "200"
    // };

      "radius": this.model.radius,
      "name": this.model.name,
      "city": this.model.city,
      "state": this.model.state,
      "zip": this.model.zip,
      "countyName": this.model.countyName,
      "eliminateBlankFirmNames": "True",
      "siteLimit": "200"
  };
  paramObj['sics'] = this.targetCategories.map((obj) => {
    return {
      'sic': obj.sic
    }
  });
  console.log(paramObj);
    this.appService.getbusinesses(paramObj).subscribe((data) => {
      console.log('returnData'+ data.payload); 
      //let searchDatageos = [(resp:Response) => resp.json().data.payload.rows];
  
    });
  }

}
