/* tslint:disable:component-selector */
import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { getUuid } from '@val/common';
import { ColorPalette } from '@val/esri';

@Component({
  selector: 'esri-class-break-input',
  templateUrl: './esri-class-break-input.component.html',
  styleUrls: ['./esri-class-break-input.component.scss']
})
export class EsriClassBreakInputComponent {

  @Input() parentForm: FormGroup;
  @Input() currentPalette: ColorPalette;
  @Input() showMinValue: boolean = true;
  @Input() showMaxValue: boolean = true;

  minControlId = getUuid();

  constructor() { }

}
