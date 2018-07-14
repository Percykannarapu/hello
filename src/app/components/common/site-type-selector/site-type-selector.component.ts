import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'val-site-type-selector',
  templateUrl: './site-type-selector.component.html'
})
export class SiteTypeSelectorComponent implements OnInit {

  selectedSiteType: 'Site' | 'Competitor' = 'Site';
  constructor() { }

  ngOnInit() {
  }

}
