import { Component, OnInit } from '@angular/core';
import { AppService } from '../../services/app.service';


@Component({
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {
  public name: string;  // Used by parent as a header
  public numFound: number = 2;

  // As we wire the component up to real sources, we can remove the below
  selectedCity: string;
  sourceCategories: any = [];
  targetCategories: any = [];
  geofootprintGeos: any;
  competitors: any;
  sites: any;

  constructor(private appService: AppService) { }

  ngOnInit() {
    this.name = 'Business Search';
    this.sourceCategories = this.appService.categoriesList;
  }

}
