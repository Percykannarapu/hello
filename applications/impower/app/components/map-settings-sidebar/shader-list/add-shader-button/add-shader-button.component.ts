/* tslint:disable:component-selector */
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { GfpShaderKeys } from '../../../../models/ui-enums';

interface InlineAudience {
  displayName: string;
  identifier: string;
  fieldconte: FieldContentTypeCodes;
}

@Component({
  selector: 'add-shader-button',
  templateUrl: './add-shader-button.component.html',
  styleUrls: ['./add-shader-button.component.scss']
})
export class AddShaderButtonComponent implements OnChanges {

  @Input() audienceCount: number;
  @Input() geoCount: number;
  @Input() tradeAreaCount: number;
  @Input() locationCount: number;
  @Input() currentAnalysisLevel: string;

  buttonOptions: MenuItem[];
  buttonEnabled: boolean = false;

  @Output() addShader = new EventEmitter<{ dataKey: string | InlineAudience, layerName?: string }>();

  constructor() { }

  public ngOnChanges(changes: SimpleChanges) : void {
    this.buttonOptions = this.createButtonMenu();
    this.buttonEnabled = this.buttonOptions.some(m => m.visible);
  }

  private createButtonMenu() : MenuItem[] {
    const atzIndicator: InlineAudience = {
      identifier: '40683',
      displayName: 'ATZ Indicator',
      fieldconte: FieldContentTypeCodes.Char
    };
    return [
      { label: 'Add Owner Site Shading', command: () => this.add(GfpShaderKeys.OwnerSite, 'Owner Site'), visible: this.locationCount > 0 && this.geoCount > 0 },
      { label: 'Add Owner TA Shading', command: () => this.add(GfpShaderKeys.OwnerTA, 'Owner Trade Area'), visible: this.tradeAreaCount > 0 && this.geoCount > 0 },
      { label: 'Add ATZ Indicator Shading', command: () => this.add(atzIndicator, 'ATZ Indicator'), visible: this.currentAnalysisLevel?.toLowerCase() === 'atz' },
      { label: 'Add Variable Shading', command: () => this.add(''), visible: this.audienceCount > 0 }
    ];
  }

  private add(dataKey: string | InlineAudience, layerName?: string) : void {
    this.addShader.emit({ dataKey, layerName });
  }
}
