import { Component, Input, OnInit } from '@angular/core';
import { getUuid } from '@val/common';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../val-modules/targeting/targeting.enums';
import { AppStateService } from 'app/services/app-state.service';

@Component({
  selector: 'val-site-type-selector',
  templateUrl: './site-type-selector.component.html'
})
export class SiteTypeSelectorComponent implements OnInit{

  @Input() label: string = '';

  controlId = getUuid();

  AllSiteTypes = ImpClientLocationTypeCodes;
  selectedSiteType: SuccessfulLocationTypeCodes = this.AllSiteTypes.Site;

  constructor(private appStateService: AppStateService){}

  ngOnInit(){

    this.appStateService.clearUI$.subscribe(() => this.selectedSiteType = this.AllSiteTypes.Site);

  }
}
