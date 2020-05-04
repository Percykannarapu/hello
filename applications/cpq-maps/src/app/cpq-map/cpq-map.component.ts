import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SelectedButtonTypeCodes } from '@val/esri';

@Component({
  selector: 'cpq-map',
  templateUrl: './cpq-map.component.html',
  styleUrls: ['./cpq-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpqMapComponent {

  sideNavVisible = false;
  gridSize = 'small';

  toolbarButtons = [
    SelectedButtonTypeCodes.ShowPopups,
    SelectedButtonTypeCodes.XY,
    SelectedButtonTypeCodes.MeasureDistance
  ];

  get gridIsSmall() { return this.gridSize === 'small'; }
  get gridIsLarge() { return this.gridSize === 'large'; }
  get gridIsVisible() { return this.gridSize !== 'none'; }

  constructor() { }

}
