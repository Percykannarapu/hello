/* tslint:disable:component-selector */
import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { ColorPalette } from '@val/esri';

@Component({
  selector: 'esri-class-break-input',
  templateUrl: './esri-class-break-input.component.html',
  styleUrls: ['./esri-class-break-input.component.scss']
})
export class EsriClassBreakInputComponent implements OnInit {

  @Input() formGroupName: string;
  @Input() currentPalette: ColorPalette;
  @Input() reversePalette: boolean = false;
  @Input() showMinValue: boolean = true;
  @Input() showMaxValue: boolean = true;
  @Input() showCalculatedValue: boolean = true;
  @Input() usesCalculatedValues: boolean = false;
  @Input() calculatedValueMessage: string = 'Calculated values';

  currentRoot: FormGroup;

  constructor(private controlContainer: ControlContainer) { }

  ngOnInit() : void {
    this.currentRoot = this.controlContainer.control as FormGroup;
  }
}
