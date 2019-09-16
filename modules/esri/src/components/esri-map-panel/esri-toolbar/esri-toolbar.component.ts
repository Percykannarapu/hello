import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { SelectedButtonTypeCodes } from '../../../core/esri.enums';

@Component({
  selector: 'val-esri-toolbar',
  templateUrl: './esri-toolbar.component.html',
  styleUrls: ['./esri-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriToolbarComponent {
  @Input() showSelectionButtons = true;
  @Input() currentMapState: SelectedButtonTypeCodes;

  states = SelectedButtonTypeCodes;

  @Output() popupButtonClicked = new EventEmitter();
  @Output() singleSelectClicked = new EventEmitter();
  @Output() multiSelectClicked = new EventEmitter();
  @Output() multiUnselectClicked = new EventEmitter();
  @Output() measureToolClicked = new EventEmitter();
  @Output() xyButtonClicked = new EventEmitter();
}
