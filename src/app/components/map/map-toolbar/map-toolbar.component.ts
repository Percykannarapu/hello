import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MapStateTypeCodes } from '../../../models/app.enums';

@Component({
  selector: 'val-map-toolbar',
  templateUrl: './map-toolbar.component.html',
  styleUrls: ['./map-toolbar.component.css']
})
export class MapToolbarComponent {

  @Input() currentAnalysisLevel: string = null;
  @Input() currentMapState: MapStateTypeCodes;

  states = MapStateTypeCodes;

  @Output() popupButtonClicked = new EventEmitter();
  @Output() singleSelectClicked = new EventEmitter();
  @Output() multiSelectClicked = new EventEmitter();
  @Output() measureToolClicked = new EventEmitter();
  @Output() clearGraphicsClicked = new EventEmitter();

  @Output() clearSelectionsClicked = new EventEmitter();
  @Output() revertClicked = new EventEmitter();
  @Output() zoomClicked = new EventEmitter();
}
