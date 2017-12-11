import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { AppService } from '../../services/app.service';
import { DropdownModule } from 'primeng/primeng';
import { MapService } from '../../services/map.service';
import { GrowlModule } from 'primeng/primeng';
import { SelectItem } from 'primeng/components/common/api';
import { Message } from 'primeng/components/common/api';
import { MessageService } from 'primeng/components/common/messageservice';
import { EsriLoaderWrapperService } from '../../services/esri-loader-wrapper.service';
import { DefaultLayers } from '../../Models/DefaultLayers';
import { forEach } from '@angular/router/src/utils/collection';

@Component({
  providers: [AppService, MapService, MessageService],
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
  public color: any;
  dropdownList: any[];
  selectedCategory: any;
  selector: any;
  searchDatageos: any = [];//
  msgs: Message[] = [];
  // As we wire the component up to real sources, we can remove the below
  selectedCity: string;
  model: any = {};
  sourceCategories: any = [];
  targetCategories: any = [];
  filteredCategories: any = [];
  geofootprintGeos: any;
  competitors: any = [];
  sites: any;
  businessCategories: any;

  public plottedPoints: any = [];
  showLoader: boolean = false;


  constructor(private appService: AppService, private mapService: MapService, private messageService: MessageService) {
    //Dropdown data
    // this.dropdownList = [{ label: 'Apparel & Accessory Stores' , value: '56' },
    // { label: 'Building Materials & Hardware' , value: '52' }
    // ];
    this.dropdownList = [
      { label: 'Apparel & Accessory Stores', value: { name: 'Apparel & Accessory Stores', category: 56 } },
      { label: 'Auto Services', value: { name: 'Auto Services', category: 75 } },
      { label: 'Automotive Dealers & Service Stations', value: { name: 'Automotive Dealers & Service Stations', category: 55 } },
      { label: 'Building Materials & Hardware', value: { name: 'Building Materials & Hardware', category: 52 } },
      { label: 'Business Services', value: { name: 'Business Services', category: 73 } },
      { label: 'Dentists & Doctors', value: { name: 'Dentists & Doctors', category: 80 } },
      { label: 'Depository Institutions', value: { name: 'Depository Institutions', category: 60 } },
      { label: 'Eating & Drinking Places', value: { name: 'Eating & Drinking Places', category: 58 } },
      { label: 'Food Stores', value: { name: 'Food Stores', category: 54 } },
      { label: 'General Merchandise Stores', value: { name: 'General Merchandise Stores', category: 53 } },
      { label: 'Home Furniture & Furnishings Stores', value: { name: 'Home Furniture & Furnishings Stores', category: 57 } },
      { label: 'Leisure Services', value: { name: 'Leisure Services', category: 79 } },
      { label: 'Miscellaneous Retail', value: { name: 'Miscellaneous Retail', category: 59 } },
      { label: 'Personal Services', value: { name: 'Personal Services', category: 72 } },
      { label: 'Schools & Universities', value: { name: 'Schools & Universities', category: 82 } }
    ];

  }

  ngOnInit() {
    this.name = 'Business Search';
    this.appService.getList().subscribe((data) => {
      this.filteredCategories = data.rows;
      this.selectedCategory = this.dropdownList[0].value;
      this.categoryChange();
    })
    //this.sourceCategories = this.appService.categoryList;
    //this.filteredCategories = this.appService.categoryList;
  }
  categoryChange() {
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
    } else if (value.length > 2) {
      this.sourceCategories = Object.assign([], this.filteredCategories).filter((item) => {
        return item.name ? (item.name.toLowerCase().indexOf(value.toLowerCase()) > -1) : false;
      })
    }

  }

  async onSearchBusiness() {
    const loader = EsriLoaderWrapperService.esriLoader;
    const [Collection] = await loader.loadModules(['esri/core/Collection']);
    this.showLoader = true;
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
    /*let sites = this.mapView.graphics.map((obj) => {

      return {
        x: obj.geometry['x'],
        y: obj.geometry['y']
      }
    });*/

    //get the coordinates for all sites from the sites layer
    var sites: __esri.Collection<{x: any; y: any;}> = new Collection();
    MapService.layers.forEach(layer => {
      if (layer.title == DefaultLayers.SITES) {
        (<__esri.FeatureLayer>layer).source.forEach(graphic => {
          sites.add({
            x: graphic.geometry['x'], 
            y: graphic.geometry['y']
          });
        });
      }
    });

    paramObj['sites'] = sites['items'];

    paramObj['sics'] = this.targetCategories.map((obj) => {

      return {
        'sic': obj.sic
      }
    });
    this.msgs = [];

    if (paramObj['sites'].length === 0) {
      this.msgs.push({ severity: 'error', summary: 'Error Message', detail: 'Sites cannot be empty' });
    }
    if (paramObj['sics'].length === 0) {
      this.msgs.push({ severity: 'error', summary: 'Error Message', detail: 'There should be atleast one selection of SIC"s' });
    }
    if (paramObj['radius'] === undefined || paramObj['radius'] === "") {
      this.msgs.push({ severity: 'error', summary: 'Error Message', detail: 'Radius cannot be left blank' });
    }

    console.log("request to business search", paramObj);

    //Using TypeScript would help for code optimization : reverting to original code
    this.appService.getBusinesses(paramObj).subscribe((res) => {
      this.showLoader = false;
      let data = res.payload;

      //console.log("In Business Search  componenet GOT ROWS : " + JSON.stringify(data.rows, null, 4));
      this.searchDatageos = data.rows;
      this.searchDatageos.forEach((obj) => {
        //Building label to show adresses
        obj['checked'] = false;
        obj['businessLabel'] = `${obj.firm} (${Math.round(obj.dist_to_site * 100) / 100} miles)
          ${obj.address}, ${obj.city}, ${obj.state}, ${obj.zip}`;
      })
    });


  }

  //   showError() {
  //     this.msgs = [];
  //     this.msgs.push({severity:'error', summary:'Error Message', detail:'Validation failed'});
  // }

  // For Enabling selectall functionality for the business found
  onSelectAll(e) {
    this.searchDatageos.forEach((cat) => {
      cat['checked'] = e;
    })
  }


  //adding points on the map
  async onAddToProject(selector) {
    console.log('selector: ', selector);
    //Giving color to the point on the map
    if (selector === 'Sites') {
      this.color = {
        a: 1,
        r: 35,
        g: 93,
        b: 186
      }
      //Close the sidebar after we select the points to be mapped
      this.showSideBar.emit(false);
    } else if (selector === 'Competitors') {
      this.color = {
        a: 1,
        r: 236,
        g: 1,
        b: 1
      }
      this.showSideBar.emit(false);
    }
    else {
      this.msgs.push({ severity: 'error', summary: 'Error Message', detail: 'Please select Sites/Competitors' });
    }
    const loader = EsriLoaderWrapperService.esriLoader;
    const [PopupTemplate, Graphic] = await loader.loadModules(['esri/PopupTemplate', 'esri/Graphic']);
    var graphics: __esri.Graphic[] = new Array<__esri.Graphic>();
    let popupTemplate: __esri.PopupTemplate = new PopupTemplate();
    //await this.searchDatageos.forEach(async business => {
    for(let business of this.searchDatageos) {
      if (business.checked) {
        //console.log("In Business Search  componenet GOT ROWS : " + JSON.stringify(business, null, 4));
        console.log('long: x', business.x + 'lat: y', business.y);
        //this.mapService.plotMarker(42.412941,-83.374309,color);
        this.plottedPoints.push([business.x, business.y]);

        popupTemplate.content = 'Firm: ' + business.firm + '<br>' +
                                'Address: ' + business.address + '<br>' +
                                'City: ' + business.city + '<br>' +
                                'State: ' + business.state + '<br>' +
                                'Zip: ' + business.zip + '<br>' +
                                'Wrap Zone: ' + business.wrap_name + '<br>' +
                                'ATZ: ' + business.atz_name + '<br>' +
                                'Carrier Route: ' + business.carrier_route_name + '<br>';

        console.log('this.plottedPoints', this.plottedPoints);
        await this.mapService.createGraphic(business.y, business.x, this.color).then(async graphic => {
          graphic.popupTemplate = popupTemplate;
          graphics.push(graphic);
        });
      }

    }
    if (selector === 'Competitors') {
      console.log("Adding competitors from store search");
      await this.mapService.updateFeatureLayer(graphics, DefaultLayers.COMPETITORS);
    } else {
      console.log("adding sites from store search")
      await this.mapService.updateFeatureLayer(graphics, DefaultLayers.SITES);
    }
  }
}