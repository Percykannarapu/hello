/* tslint:disable:component-selector */
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { GfpShaderKeys } from '../../../../models/ui-enums';

@Component({
  selector: 'add-shader-button',
  templateUrl: './add-shader-button.component.html',
  styleUrls: ['./add-shader-button.component.scss']
})
export class AddShaderButtonComponent {

  @Input() audienceCount: number;
  @Input() geoCount: number;
  @Input() tradeAreaCount: number;
  @Input() locationCount: number;
  @Input() currentAnalysisLevel: string;

  get buttonOptions() : MenuItem[] {
    return this.buttonMenu();
  }

  get buttonEnabled() : boolean {
    return this.buttonMenu().some(m => m.visible);
  }

  @Output() addShader = new EventEmitter<{ dataKey: string, layerName?: string }>();

  constructor() { }

  private buttonMenu() : MenuItem[] {
    const ATZIndicatorVarPk = '40683';
    return [
      { label: 'Add Owner Site Shading', command: () => this.add(GfpShaderKeys.OwnerSite, 'Owner Site'), visible: this.locationCount > 0 && this.geoCount > 0 },
      { label: 'Add Owner TA Shading', command: () => this.add(GfpShaderKeys.OwnerTA, 'Owner Trade Area'), visible: this.tradeAreaCount > 0 && this.geoCount > 0 },
      // { label: 'Add ATZ Indicator Shading', command: () => this.add(ATZIndicatorVarPk, 'ATZ Indicator'), visible: this.currentAnalysisLevel != null && this.currentAnalysisLevel.toLowerCase() === 'atz' },
      { label: 'Add Variable Shading', command: () => this.add(''), visible: this.audienceCount > 0 }
    ];
  }

  private add(dataKey: string, layerName?: string) : void {
    this.addShader.emit({ dataKey, layerName });
  }
}
