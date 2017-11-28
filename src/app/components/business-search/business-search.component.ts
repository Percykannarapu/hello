import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';
import { DropdownModule } from 'primeng/primeng';
import { MapService } from '../../services/map.service';

@Component({
  providers: [AppService,MapService],
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {
  public name: string;  // Used by parent as a header
  public numFound: number = 2;
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

      "radius": "3",
      "name": "INSTITUTE",
      "city": "ST LOUIS",
      "state": "MO",
      "zip": "63127",
      "countyName": "SAINT LOUIS",
      "eliminateBlankFirmNames": "True",
      "siteLimit": "200"
    };

    //     "radius": this.model.radius,
    //     "name": this.model.name,
    //     "city": this.model.city,
    //     "state": this.model.state,
    //     "zip": this.model.zip,
    //     "countyName": this.model.countyName,
    //     "eliminateBlankFirmNames": "True",
    //     "siteLimit": "200"
    // };

    paramObj['sics'] = this.targetCategories.map((obj) => {
      return {
        'sic': obj.sic
      }
    });
    /*this.searchDatageos = [
      {
        firm: "INSTITUTEFORRESEARCH&EDUC",
        address: "4590SLINDBERGHBLVD#2",
        city: "STLOUIS",
        state: "MO",
        zip: 63127,
        zip4: 1834,
        cart: "C008",
        atz: 63127,
        atz_name: 63127,
        carrier_route_name: "63127C008",
        x: -90.381958,
        y: 38.530309,
        location_type: null,
        primarysic: "8011-01",
        primarylob: "PHYSICIANS&SURGEONS",
        fran_1: 198,
        fran_2: null,
        sic2: "8099-12",
        sic_name2: "MEDICALINFORMATIONSERVICES",
        sic3: null,
        sic_name3: null,
        sic4: null,
        sic_name4: null,
        abino: 969900034,
        match_code: 0,
        cbsa_code: 41180,
        cbsa_name: "St.Louis,MO-ILMetro",
        dma_code: "0609",
        dma_name: "StLouisMO",
        county_code: 29189,
        county_name: "SAINTLOUIS,MO",
        wrap_id: 15271849,
        wrap_name: "MOSWStLouis/Fenton/Arnold",
        wrap_secondary_id: null,
        wrap_secondary_name: null,
        sdm_id: 15075968,
        sdm_name: "MOSt.Louis",
        pricing_market_id: 15074534,
        pricing_market_name: "MOSTLOUIS",
        fk_site: null,
        site_name: null,
        dist_to_site: 0.1240286491065102527423829926148792864173
      },
      {
        firm:"PROBST&BEHMOB-GYNSVCINC",
        address:"10345WATSONRD",
        city:"STLOUIS",
        state:"MO",
        zip:63127,
        zip4:1105,
        cart:"C018",
        atz:63127,
        atz_name:63127,
        carrier_route_name:"63127C018",
        x:-90.401576,
        y:38.555877,
        location_type:null,
        primarysic:"8011-01",
        primarylob:"PHYSICIANS&SURGEONS",
        fran_1:213,
        fran_2:null,
        sic2:null,
        sic_name2:null,
        sic3:null,
        sic_name3:null,
        sic4:null,
        sic_name4:null,
        abino:438972580,
        match_code:0,
        cbsa_code:41180,
        cbsa_name:"St.Louis,MO-ILMetro",
        dma_code:"0609",
        dma_name:"StLouisMO",
        county_code:29189,
        county_name:"SAINTLOUIS,MO",
        wrap_id:15271849,
        wrap_name:"MOSWStLouis/Fenton/Arnold",
        wrap_secondary_id:null,
        wrap_secondary_name:null,
        sdm_id:15075968,
        sdm_name:"MOSt.Louis",
        pricing_market_id:15074534,
        pricing_market_name:"MOSTLOUIS",
        fk_site:null,
        site_name:null,
        dist_to_site:1.48495271370609028618270274716592825083
      },
      {
        firm:"SUNSETHILLSSURGERYCTR",
        address:"12399GRAVOISRD#102",
        city:"STLOUIS",
        state:"MO",
        zip:63127,
        zip4:1750,
        cart:"C006",
        atz:63127,
        atz_name:63127,
        carrier_route_name:"63127C006",
        x:-90.402158,
        y:38.523069,
        location_type:null,
        primarysic:"8011-01",
        primarylob:"PHYSICIANS&SURGEONS",
        fran_1:248,
        fran_2:null,
        sic2:"8093-08",
        sic_name2:"SURGICALCENTERS",
        sic3:null,
        sic_name3:null,
        sic4:null,
        sic_name4:null,
        abino:246165013,
        match_code:0,
        cbsa_code:41180,
        cbsa_name:"St.Louis,MO-ILMetro",
        dma_code:"0609",
        dma_name:"StLouisMO",
        county_code:29189,
        county_name:"SAINTLOUIS,MO",
        wrap_id:15271849,
        wrap_name:"MOSWStLouis/Fenton/Arnold",
        wrap_secondary_id:null,
        wrap_secondary_name:null,
        sdm_id:15075968,
        sdm_name:"MOSt.Louis",
        pricing_market_id:15074534,
        pricing_market_name:"MOSTLOUIS",
        fk_site:null,
        site_name:null,
        dist_to_site:1.52543166867479554831772835021064786437
      },
      {
        firm: "INSTITUTEFORRESEARCH&EDUC",
        address: "4590SLINDBERGHBLVD#2",
        city: "STLOUIS",
        state: "MO",
        zip: 63127,
        zip4: 1834,
        cart: "C008",
        atz: 63127,
        atz_name: 63127,
        carrier_route_name: "63127C008",
        x: -90.381958,
        y: 38.530309,
        location_type: null,
        primarysic: "8011-01",
        primarylob: "PHYSICIANS&SURGEONS",
        fran_1: 198,
        fran_2: null,
        sic2: "8099-12",
        sic_name2: "MEDICALINFORMATIONSERVICES",
        sic3: null,
        sic_name3: null,
        sic4: null,
        sic_name4: null,
        abino: 969900034,
        match_code: 0,
        cbsa_code: 41180,
        cbsa_name: "St.Louis,MO-ILMetro",
        dma_code: "0609",
        dma_name: "StLouisMO",
        county_code: 29189,
        county_name: "SAINTLOUIS,MO",
        wrap_id: 15271812,
        wrap_name: "Adithya",
        wrap_secondary_id: null,
        wrap_secondary_name: null,
        sdm_id: 15075968,
        sdm_name: "MOSt.Louis",
        pricing_market_id: 15074534,
        pricing_market_name: "MOSTLOUIS",
        fk_site: null,
        site_name: null,
        dist_to_site: 0.1240286491065102527423829926148792864173
      }
    ];*/
    console.log(paramObj);
    this.appService.getbusinesses(paramObj).subscribe((data)=> {
      console.log('returnData' + data.payload);
      //let searchDatageos = [(resp:Response) => resp.json().rows];
      // this.searchDatageos = ((resp: Response) => (resp.json()));

      // console.log(this.searchDatageos[0].rows);

    });
  }

  onAddToProject() {
    let finalData = this.searchDatageos.map((obj) => {
      if (obj.checked) {
        return { x: obj.x, y: obj.y }
      }
    });
    //this.mapService.plotMarker(finalData.x, finalData.y);
    console.log(finalData);
  }

}
