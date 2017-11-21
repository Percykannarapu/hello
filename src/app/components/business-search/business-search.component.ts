import { Component, OnInit } from '@angular/core';

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
  sourceCars: any;
  targetCars: any;
  geofootprintGeos: any;
  competitors: any;
  sites: any;

  constructor() { }

  ngOnInit() {
    this.name = 'Business Search';
  }

}
