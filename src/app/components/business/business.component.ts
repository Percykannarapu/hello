// Added nallana: US6087
import { Component, OnInit } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { AppService } from '../../services/app.service';


@Component({
  selector: 'val-business',
  templateUrl: './business.component.html',
  styleUrls: ['./business.component.css']
})
export class BusinessComponent implements OnInit {
      
  title: string;
  leftList: any[] = [];
  rightList: any[] = [];
  filteredList: any[] = [];
  businessObj: any = {};
  dropdownList:any = [  {name: 'Building Materials & Hardware'}, 
                        {name: 'General Merchandise Stores'}, 
                        {name:'Food Stores'},
                        {name:'Apparel & Accessory Stores'},
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

  constructor(public bsModalRef: BsModalRef, private appservice: AppService) { }

  ngOnInit() {
    setTimeout(() => {
      this.assignCopy();
    })
  }

  assignCopy(){
    this.filteredList = Object.assign([], this.leftList);
  }
/**
  * Performs a request with `post` http method.
  */
  searchBusinesses(){
    //post(url: string, body:any, options?: RequestOptionsArgs): Obserable<Response>;
    console.log(this.businessObj);
    let paramObj = {};
    this.appservice.getbusinesses().subscribe((data) => {
      console.log(data);
    });
  }

  onAddToRightList() {
    let rightList = [];
    for (var i = 0; i < this.leftList.length; i++) {
      if (this.leftList[i].selected) {
        rightList.push(this.leftList[i]);
        this.leftList[i].selected = false;
      }
    }
    this.rightList = JSON.parse(JSON.stringify(rightList));
  }

  onRemoveFromLeftList() {
    this.rightList = this.rightList.filter((category) => !category.selected);
  }

  filterCategory(value) {
    if (!value){
      this.assignCopy();
    }
    this.filteredList = Object.assign([], this.leftList).filter((item) => {
      return item.firm ? (item.firm.toLowerCase().indexOf(value.toLowerCase()) > -1) : false;
    })
  }

}

