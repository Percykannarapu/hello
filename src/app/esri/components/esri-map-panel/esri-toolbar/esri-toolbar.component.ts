import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MapStateTypeCodes } from '../../../core/esri.enums';

@Component({
  selector: 'val-esri-toolbar',
  templateUrl: './esri-toolbar.component.html',
  styleUrls: ['./esri-toolbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriToolbarComponent {
  @Input() currentMapState: MapStateTypeCodes;

  states = MapStateTypeCodes;

  @Output() popupButtonClicked = new EventEmitter();
  @Output() singleSelectClicked = new EventEmitter();
  @Output() multiSelectClicked = new EventEmitter();
  @Output() measureToolClicked = new EventEmitter();
  @Output() clearGraphicsClicked = new EventEmitter();
}
