/* tslint:disable:component-selector */
import { Component, Input, OnInit } from '@angular/core';
import { ControlContainer, FormGroup } from '@angular/forms';
import { getUuid } from '@val/common';
import { ColorPalette, markerStyleValues, markerTypeFriendlyNames, RgbaTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'esri-marker-symbol-input',
  templateUrl: './esri-marker-symbol-input.component.html',
  styleUrls: ['./esri-marker-symbol-input.component.scss']
})
export class EsriMarkerSymbolInputComponent implements OnInit {

  @Input() labelText: string;
  @Input() validationMessage: string;
  @Input() currentPalette: ColorPalette;
  @Input() reversePalette: boolean = false;
  @Input() defaultHalo: RgbaTuple;
  @Input() defaultColor: RgbaTuple;

  controlId = getUuid();
  markerTypes: SelectItem[];
  currentRoot: FormGroup;

  ColorPalette = ColorPalette;

  constructor(private controlContainer: ControlContainer) {
    this.markerTypes = markerStyleValues.map(mt => ({ label: markerTypeFriendlyNames[mt], value: mt, icon: mt }));
  }

  ngOnInit() : void {
    this.currentRoot = this.controlContainer.control as FormGroup;
  }
}
