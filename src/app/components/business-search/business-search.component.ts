import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {
  public name: string;

  constructor() { }

  ngOnInit() {
    this.name = 'Business Search';
  }

}
