import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../../val-modules/targeting/targeting.enums';

@Component({
  selector: 'val-site-type-selector',
  templateUrl: './site-type-selector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteTypeSelectorComponent implements OnInit {

  @Input() label: string = '';

  SiteType = ImpClientLocationTypeCodes;
  selectedSiteType: ImpClientLocationTypeCodes;

  ngOnInit() {
    this.selectedSiteType = ImpClientLocationTypeCodes.Site;
  }
}
