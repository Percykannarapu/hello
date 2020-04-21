import { Component, Input } from '@angular/core';
import { getUuid } from '@val/common';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../val-modules/targeting/targeting.enums';

@Component({
  selector: 'val-site-type-selector',
  templateUrl: './site-type-selector.component.html'
})
export class SiteTypeSelectorComponent {

  @Input() label: string = '';

  controlId = getUuid();

  AllSiteTypes = ImpClientLocationTypeCodes;
  selectedSiteType: SuccessfulLocationTypeCodes = this.AllSiteTypes.Site;
}
