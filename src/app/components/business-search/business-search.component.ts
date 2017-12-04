import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { AppService } from '../../services/app.service';
import { DropdownModule } from 'primeng/primeng';
import { MapService } from '../../services/map.service';

@Component({
  providers: [AppService, MapService],
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {


  @Output()
  showSideBar: EventEmitter<any> = new EventEmitter<any>();
  public name: string;  // Used by parent as a header
  public numFound: number;
  
  public mapView: __esri.MapView;
  dropdownList: any[];
  public color :any ;
  selectedCategory: any;
  selector: any;
  searchDatageos: any = [];//
  // As we wire the component up to real sources, we can remove the below
  selectedCity: string;
  model: any = {};
  sourceCategories: any = [];
  targetCategories: any = [];
  filteredCategories: any = [];
  geofootprintGeos: any;
  competitors: any;
  sites: any;
  businessCategories: any;


  constructor(private appService: AppService, private mapService: MapService) {
    //Dropdown data
    // this.dropdownList = [{ label: 'Apparel & Accessory Stores' , value: '56' },
    // { label: 'Building Materials & Hardware' , value: '52' }
    // ];
    this.dropdownList = [
    { label: 'Apparel & Accessory Stores' , value:{name: 'Apparel & Accessory Stores', category: 56} },
    { label: 'Building Materials & Hardware' , value:{name: 'Building Materials & Hardware', category: 52} },
    { label: 'General Merchandise Stores' , value:{name: 'General Merchandise Stores', category: 53} },
    { label: 'Food Stores' , value:{name: 'Food Stores', category: 54} },
    { label: 'Automotive Dealers & Service Stations' , value:{name: 'Automotive Dealers & Service Stations', category: 55} },
    { label: 'Home Furniture & Furnishings Stores' , value:{name: 'Home Furniture & Furnishings Stores', category: 57} },
    { label: 'Eating & Drinking Places' , value:{name: 'Eating & Drinking Places', category: 58} },
    { label: 'Miscellaneous Retail' , value:{name: 'Miscellaneous Retail', category: 59} },
    { label: 'Depository Institutions' , value:{name: 'Depository Institutions', category: 60} },
    { label: 'Personal Services' , value:{name: 'Personal Services', category: 72} },
    { label: 'Business Services' , value:{name: 'Business Services', category: 73} },
    { label: 'Auto Services' , value:{name: 'Auto Services', category: 75} },
    { label: 'Leisure Services' , value:{name: 'Leisure Services', category: 79} },
    { label: 'Dentists & Doctors' , value:{name: 'Dentists & Doctors', category: 80} },
    { label: 'Schools & Universities' , value:{name: 'Schools & Universities', category: 82} }
    ];
    

  }

  ngOnInit() {
    this.name = 'Business Search';
    this.appService.getList().subscribe((data) =>{
      this.filteredCategories = data.rows;
      this.selectedCategory = this.dropdownList[0].value;
      this.categoryChange();
    })
    //this.sourceCategories = this.appService.categoryList;
    //this.filteredCategories = this.appService.categoryList;
  }
  categoryChange(){
    console.log(this.selectedCategory)
    this.businessCategories = this.filteredCategories.filter((item) => {
      return item.category === this.selectedCategory.category;
    });
    this.sourceCategories = this.businessCategories;
  }
  assignCopy() {
    this.sourceCategories = Object.assign([], this.businessCategories);
  }
  filterCategory(value) {
    if (!value) {
      this.assignCopy();
    }
    this.sourceCategories = Object.assign([], this.businessCategories).filter((item) => {
      return item.name ? (item.name.toLowerCase().indexOf(value.toLowerCase()) > -1) : false;
    })
  }

  onSearchBusiness() {
    let paramObj = {

      "radius": this.model.radius,
      "name": this.model.name,
      "city": this.model.city,
      "state": this.model.state,
      "zip": this.model.zip,
      "countyName": this.model.countyName,
      "eliminateBlankFirmNames": "True",
      "siteLimit": "200"
    };

    this.mapView = this.mapService.getMapView();
    let sites = this.mapView.graphics.map((obj) => {
    
      return {
        x: obj.geometry['x'],
        y: obj.geometry['y']
      }
    });
    paramObj['sites'] = sites['items'];

    paramObj['sics'] = this.targetCategories.map((obj) => {
      
      return {
        'sic': obj.sic
      }
    });

    if(paramObj['sites'].length === 0){
        alert('please select a site');
      } 
    if(paramObj['sics'].length === 0){
        alert('please select an sic');
      }
    if(paramObj['radius'] === undefined){
        alert('miles from site cannot be blank');
      }

    console.log("request to business search", paramObj);

    //Using TypeScript would help for code optimization : reverting to original code
    this.appService.getBusinesses(paramObj).subscribe((res) => {
      let data = res.payload;
      console.log("In Business Search  componenet GOT ROWS : " + JSON.stringify(data.rows, null, 4));
      this.searchDatageos = data.rows;
      this.searchDatageos.forEach((obj) => {
        //Building label to show adresses
        obj['businessLabel'] = `${obj.firm} (${Math.round(obj.dist_to_site * 100) / 100} miles)
          ${obj.address}, ${obj.city}, ${obj.state}, ${obj.zip}`;
      })
    });
    

  }
  //adding color to the points
  onAddToProject(selector) {
    console.log('selector: ',selector);
    
    if(selector === 'Sites'){
      this.color = {
        a: 0.5,
        r: 35,
        g: 93,
        b: 186
      }
    }else if(selector === 'Competitors'){
    this.color = {
      a: 0.5,
      r: 236,
      g: 1,
      b: 1
    }
  }
  else{
    alert('Please select');
  }
    //Close the sidebar after we select the points to be mapped
    this.showSideBar.emit(false);
    this.searchDatageos.forEach(business => {
      if (business.checked && business.checked.length > 0) {
        console.log("In Business Search  componenet GOT ROWS : " + JSON.stringify(business, null, 4));
        console.log(business.x,business.y);
        //this.mapService.plotMarker(42.412941,-83.374309,color);

        this.mapService.plotMarker(business.y, business.x, this.color);

      }
    });
  }
}
