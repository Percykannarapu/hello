/* tslint:disable:component-selector */
import { Component, Input } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FillPattern, fillTypeFriendlyNames, SymbolDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';

interface Rgb { r: number; g: number; b: number; }

function esriToRgb(esriColor: [number, number, number, number]) : Rgb {
  return { r: esriColor[0], g: esriColor[1], b: esriColor[2] };
}

function rgbToEsri(rgbColor: Rgb) : [number, number, number, number] {
  return [ rgbColor.r, rgbColor.g, rgbColor.b, 1.0 ];
}

@Component({
  selector: 'esri-symbol-input',
  templateUrl: './esri-symbol-input.component.html',
  styleUrls: ['./esri-symbol-input.component.scss']
})
export class EsriSymbolInputComponent {
  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  @Input() labelText: string;

  fillTypes: SelectItem[];

  get selectedColor() : Rgb {
    return esriToRgb(this.currentSymbol.fillColor || [0, 0, 0, 1]);
  }
  set selectedColor(value: Rgb) {
    this.currentControl.setValue({ ...this.currentSymbol, fillColor: rgbToEsri(value) });
  }

  get selectedFillType() : FillPattern {
    return this.currentSymbol.fillType || 'solid';
  }

  set selectedFillType(value: FillPattern) {
    if (value === 'solid') {
      this.currentControl.setValue({ ...this.currentSymbol, fillType: value });
    } else {
      this.currentControl.setValue({ ...this.currentSymbol, fillType: value, fillColor: [0, 0, 0, 1] });
    }
  }

  private get currentSymbol() : SymbolDefinition {
    return this.currentControl.value || {};
  }

  private get currentControl() : AbstractControl {
    return this.parentForm.get(this.valueName);
  }

  constructor() {
    const fillTypeOrdered: FillPattern[] = ['solid', 'backward-diagonal', 'forward-diagonal', 'diagonal-cross', 'cross', 'horizontal', 'vertical'];
    this.fillTypes = fillTypeOrdered.map(ft => ({ label: fillTypeFriendlyNames[ft], value: ft, icon: ft === 'solid' ? null : ft }));
  }
}
