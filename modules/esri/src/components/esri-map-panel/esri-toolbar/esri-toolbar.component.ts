import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { SelectedButtonTypeCodes } from '../../../core/esri.enums';

const buttonTitles: { [key: number] : string } = {
  [SelectedButtonTypeCodes.ShowPopups]: 'Show Popups',
  [SelectedButtonTypeCodes.SelectSinglePoly]: 'Add/Remove Single Geo',
  [SelectedButtonTypeCodes.MeasureDistance]: 'Measure Distance',
  [SelectedButtonTypeCodes.SelectMultiplePolys]: 'Add Multiple Geos',
  [SelectedButtonTypeCodes.UnselectMultiplePolys]: 'Remove Multiple Geos',
  [SelectedButtonTypeCodes.XY]: 'Show XY',
};

const buttonClasses: { [key: number] : string } = {
  [SelectedButtonTypeCodes.ShowPopups]: 'action-button esri-icon-cursor',
  [SelectedButtonTypeCodes.SelectSinglePoly]: 'action-button esri-icon-plus-circled',
  [SelectedButtonTypeCodes.MeasureDistance]: 'action-button esri-icon-measure-line',
  [SelectedButtonTypeCodes.SelectMultiplePolys]: 'action-button fa fa-plus-square-o',
  [SelectedButtonTypeCodes.UnselectMultiplePolys]: 'action-button fa fa-minus-square-o',
  [SelectedButtonTypeCodes.XY]: 'action-button esri-icon-locate',
};

@Component({
  selector: 'val-esri-toolbar',
  templateUrl: './esri-toolbar.component.html',
  styleUrls: ['./esri-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriToolbarComponent {
  @Input() buttonsToShow: SelectedButtonTypeCodes[];
  @Input() currentMapState: SelectedButtonTypeCodes;
  @Input() defaultToolbarState: SelectedButtonTypeCodes;

  states = SelectedButtonTypeCodes;
  titles = buttonTitles;
  classes = buttonClasses;

  @Output() toolButtonClicked = new EventEmitter<SelectedButtonTypeCodes>();

  handleButtonClick(buttonType: SelectedButtonTypeCodes) : void {
    if (buttonType === this.currentMapState) {
      if (buttonType !== this.defaultToolbarState) {
        this.toolButtonClicked.emit(this.defaultToolbarState);
      }
    } else {
      this.toolButtonClicked.emit(buttonType);
    }
  }
}
