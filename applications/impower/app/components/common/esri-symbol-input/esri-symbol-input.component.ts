/* tslint:disable:component-selector */
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { getUuid } from '@val/common';
import { ColorPalette, FillPattern, fillTypeFriendlyNames, RgbaTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
export class EsriSymbolInputComponent implements OnInit, OnDestroy {
  @Input() parentForm: FormGroup;
  @Input() valueName: string;
  @Input() labelText: string;

  @Input() defaultCrossHatchColor: RgbaTuple = [0, 0, 0, 1];
  @Input() currentPalette: ColorPalette;

  controlId = getUuid();
  fillTypes: SelectItem[];
  defaultSolidColor: RgbaTuple;

  get selectedColor() : Rgb {
    return esriToRgb(this.fillColorControl.value || [0, 0, 0, 1]);
  }
  set selectedColor(value: Rgb) {
    this.fillColorControl.setValue(rgbToEsri(value));
  }

  get currentRoot() : FormGroup {
    const root = this.valueName == null ? this.parentForm : this.parentForm.get(this.valueName);
    return root as FormGroup;
  }

  private get fillColorControl() : AbstractControl {
    return this.currentRoot.get('fillColor');
  }

  private destroyed$ = new Subject<void>();

  constructor() {
    const fillTypeOrdered: FillPattern[] = ['solid', 'backward-diagonal', 'forward-diagonal', 'diagonal-cross', 'cross', 'horizontal', 'vertical'];
    this.fillTypes = fillTypeOrdered.map(ft => ({ label: fillTypeFriendlyNames[ft], value: ft, icon: ft === 'solid' ? null : ft }));
  }

  ngOnInit() : void {
    const root = this.valueName == null ? this.parentForm : this.parentForm.get(this.valueName);
    if (!(root instanceof FormGroup)) throw new Error('EsriSymbolInput ValueName property must refer to a FormGroup instance on the parentForm');
    this.defaultSolidColor = [ ...this.fillColorControl.value] as RgbaTuple;
    this.currentRoot.get('fillType').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe(newFillType => {
      if (newFillType === 'solid') {
        this.fillColorControl.setValue(Array.from(this.defaultSolidColor));
      } else {
        this.fillColorControl.setValue(Array.from(this.defaultCrossHatchColor));
      }
    });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }
}
