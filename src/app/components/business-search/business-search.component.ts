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
  
  selectedCategory: string;
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


  constructor(private appService: AppService, private mapService: MapService) {
    //Dropdown data
    this.dropdownList = [{ label: 'Apparel & Accessory Stores' },
    { label: 'Building Materials & Hardware' },
    { label: 'General Merchandise Stores' },
    { label: 'Food Stores' },
    { label: 'Automotive Dealers & Service Stations' },
    { label: 'Home Furniture & Furnishings Stores' },
    { label: 'Eating & Drinking Places' },
    { label: 'Miscellaneous Retail' },
    { label: 'Depository Institutions' },
    { label: 'Personal Services' },
    { label: 'Auto Services' },
    { label: 'Leisure Services' },
    { label: 'Dentists & Doctors' },
    { label: 'Schools & Universities' }
    ];

  }

  ngOnInit() {
    this.name = 'Business Search';
    this.sourceCategories = this.appService.categoriesList;
    this.filteredCategories = this.appService.categoriesList;
  }
  assignCopy() {
    this.sourceCategories = Object.assign([], this.filteredCategories);
  }
  filterCategory(value) {
    if (!value) {
      this.assignCopy();
    }
    this.sourceCategories = Object.assign([], this.filteredCategories).filter((item) => {
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
  onAddToProject() {
    const color = {
      a: 0.5,
      r: 236,
      g: 1,
      b: 1
    }
    //Close the sidebar after we select the points to be mapped
    this.showSideBar.emit(false);
    this.searchDatageos.forEach(business => {
      if (business.checked && business.checked.length > 0) {
        console.log("In Business Search  componenet GOT ROWS : " + JSON.stringify(business, null, 4));

        this.mapService.plotMarker(business.y, business.x, color);

      }
    });
  }
}
