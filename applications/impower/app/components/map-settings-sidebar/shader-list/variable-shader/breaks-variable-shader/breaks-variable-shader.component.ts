import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import { ClassBreakDefinition, ClassBreakShadingDefinition, ColorPalette, DynamicAllocationTypes, FillPattern, fillTypeFriendlyNames, getColorPalette, RgbaTuple, RgbTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { getDefaultClassBreaks } from '../../../../../models/class-break-defaults.model';
import { FieldContentTypeCodes } from '../../../../../val-modules/targeting/targeting.enums';
import { VariableBaseComponent } from '../variable-base.component';

@Component({
  selector: 'val-breaks-variable-shader',
  templateUrl: './breaks-variable-shader.component.html',
  styleUrls: ['./breaks-variable-shader.component.scss']
})
export class BreaksVariableShaderComponent extends VariableBaseComponent<ClassBreakShadingDefinition> implements OnInit {

  breakTypes: SelectItem[];
  selectedBreakType: string;

  get breakArray() : FormArray {
    return this.parentForm.get('breakDefinitions') as FormArray;
  }

  get breakDefinitions() : FormGroup[] {
    const breaks = this.breakArray;
    if (breaks != null) return breaks.controls as FormGroup[];
    return [];
  }

  get currentTheme() : ColorPalette {
    if (this.isEditing) {
      return this.parentForm.get('theme').value;
    } else {
      return this.definition.theme;
    }
  }

  private classBreakCleanup$ = new Subject<void>();
  private classBreakCount = 0;

  constructor(private fb: FormBuilder) {
    super();
    this.breakTypes = [
      { label: 'Set Value Ranges', value: 'Set Value Ranges' },
      { label: 'Equal Interval Ranges', value: 'Equal Interval Ranges' },
      { label: 'Equal Class Counts', value: 'Equal Class Counts' }
    ];
  }

  public getHexColor(esriColor: RgbaTuple) : string {
    return rgbToHex(esriColor);
  }

  public getFillName(esriFillType: FillPattern) : string {
    return fillTypeFriendlyNames[esriFillType];
  }

  public ngOnInit() {
    super.ngOnInit();
    if (this.definition.dynamicallyAllocate === true) {
      if (this.definition.dynamicAllocationType === DynamicAllocationTypes.Interval) {
        this.selectedBreakType = this.breakTypes[1].value;
      } else {
        this.selectedBreakType = this.breakTypes[2].value;
      }
    } else {
      if (this.definition.dynamicallyAllocate === false) {
        this.selectedBreakType = this.breakTypes[0].value;
      } else {
        this.selectedBreakType = null;
      }
    }
  }

  protected setupForm() : void {
    const currentTheme = this.definition.theme || ColorPalette.CpqMaps;
    this.parentForm.addControl('theme', new FormControl(currentTheme));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false));
    this.parentForm.addControl('dynamicallyAllocate', new FormControl(this.definition.dynamicallyAllocate, [Validators.required]));
    this.parentForm.addControl('dynamicAllocationType', new FormControl(this.definition.dynamicAllocationType));
    this.parentForm.addControl('dynamicAllocationSlots', new FormControl(this.definition.dynamicAllocationSlots));
    this.setupBreakControls(this.definition.breakDefinitions);
  }

  public breakTypeChanged({ value }) {
    switch (value) {
      case this.breakTypes[0].value:
        this.parentForm.get('dynamicallyAllocate').setValue(false);
        this.parentForm.get('dynamicAllocationType').setValue(null);
        this.parentForm.get('dynamicAllocationSlots').clearValidators();
        this.parentForm.get('theme').setValue(ColorPalette.SixDarkColors);
        const newBreakDefinitions: ClassBreakDefinition[] = getDefaultClassBreaks(this.currentAudience.fieldconte, ColorPalette.SixDarkColors);
        this.setupBreakControls(newBreakDefinitions);
        break;
      case this.breakTypes[1].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.Interval);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        this.parentForm.get('theme').setValue(ColorPalette.CpqMaps);
        if (this.parentForm.get('breakDefinitions') != null) {
          this.classBreakCleanup$.next();
          this.parentForm.removeControl('breakDefinitions');
          this.classBreakCount = 0;
        }
        break;
      case this.breakTypes[2].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.ClassCount);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        this.parentForm.get('theme').setValue(ColorPalette.CpqMaps);
        if (this.parentForm.get('breakDefinitions') != null) {
          this.classBreakCleanup$.next();
          this.parentForm.removeControl('breakDefinitions');
          this.classBreakCount = 0;
        }
        break;
    }
  }

  private setupBreakControls(definitions: ClassBreakDefinition[]) : void {
    if (definitions != null && definitions.length > 0) {
      const breakControls = definitions.map(def => this.createClassBreakControl(def));
      this.parentForm.addControl('breakDefinitions', new FormArray(breakControls));
      this.classBreakCount = breakControls.length;
      this.setupClassBreakValidations();
    }
  }

  private createClassBreakControl(newBreakDefinition: ClassBreakDefinition) : FormGroup {
    return this.fb.group({
      fillColor: new FormControl(newBreakDefinition.fillColor, { updateOn: 'change' }),
      fillType: new FormControl(newBreakDefinition.fillType, { updateOn: 'change' }),
      outlineColor: new FormControl(newBreakDefinition.outlineColor, { updateOn: 'change' }),
      legendName: newBreakDefinition.legendName,
      minValue: new FormControl(newBreakDefinition.minValue),
      maxValue: newBreakDefinition.maxValue
    });
  }

  private setupClassBreakValidations() : void {
    const themeControl = this.parentForm.get('theme');
    themeControl.valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.classBreakCleanup$),
    ).subscribe(newTheme => {
      const palette = getColorPalette(newTheme, false);
      for (let i = 0; i < this.classBreakCount; ++i) {
        this.parentForm.get(`breakDefinitions.${i}.fillColor`).setValue(RgbTuple.withAlpha(palette[i % palette.length], 1));
      }
    });
    for (let i = 0; i < this.classBreakCount; ++i) {
      const maxControl = this.parentForm.get(`breakDefinitions.${i}.maxValue`);
      const minControl = this.parentForm.get(`breakDefinitions.${i}.minValue`);
      if (i < this.classBreakCount - 1) {
        maxControl.setValidators([Validators.required, Validators.min(minControl.value)]);
      }
      minControl.valueChanges.pipe(
        takeUntil(this.destroyed$),
        takeUntil(this.classBreakCleanup$)
      ).subscribe(newMinValue => {
        const localMax = this.parentForm.get(`breakDefinitions.${i}.maxValue`).value;
        this.parentForm.get(`breakDefinitions.${i}.legendName`).setValue(this.generateNewLegend(newMinValue, localMax));
      });
      maxControl.valueChanges.pipe(
        takeUntil(this.destroyed$),
        takeUntil(this.classBreakCleanup$),
      ).subscribe(newMaxValue => {
        const localMin = this.parentForm.get(`breakDefinitions.${i}.minValue`).value;
        this.parentForm.get(`breakDefinitions.${i}.legendName`).setValue(this.generateNewLegend(localMin, newMaxValue));
        const nextClassBreak = this.parentForm.get(`breakDefinitions.${i + 1}`);
        if (nextClassBreak != null) {
          nextClassBreak.get('minValue').setValue(newMaxValue);
          if (i !== this.classBreakCount - 2) {
            nextClassBreak.get('maxValue').setValidators([Validators.required, Validators.min(newMaxValue)]);
            nextClassBreak.get('maxValue').updateValueAndValidity();
          }
        }
      });
    }
  }

  private generateNewLegend(minValue?: number, maxValue?: number) : string {
    let suffix = '';
    if (this.currentAudience.fieldconte === FieldContentTypeCodes.Percent) {
      suffix = '%';
    }
    if (minValue == null) {
      return `Below ${(maxValue).toFixed(0)}${suffix}`;
    }
    if (maxValue == null) {
      return `${(minValue).toFixed(0)}${suffix} and above`;
    }
    return `${(minValue).toFixed(0)}${suffix} to ${(maxValue).toFixed(0)}${suffix}`;
  }

  deleteBreak(index: number) {
    this.classBreakCleanup$.next();
    const previousMax = this.breakDefinitions[index - 1].get('maxValue').value;
    const nextControl = this.breakDefinitions[index + 1];
    this.breakArray.removeAt(index);
    this.classBreakCount -= 1;
    this.setupClassBreakValidations();
    nextControl.get('minValue').setValue(previousMax);
  }

  addBreak() {
    const theme = this.parentForm.get('theme').value;
    const palette = getColorPalette(theme, false);
    this.classBreakCleanup$.next();
    const index = this.classBreakCount - 2;
    const previousMax = this.breakDefinitions[index].get('maxValue').value;
    const newDefinition: ClassBreakDefinition = {
      fillType: 'solid',
      minValue: null, maxValue: null,
      legendName: 'New Break',
      fillColor: RgbTuple.withAlpha(palette[this.classBreakCount % palette.length], 1)
    };
    const newControl = this.createClassBreakControl(newDefinition);
    this.breakArray.insert(index + 1, newControl);
    this.classBreakCount += 1;
    this.setupClassBreakValidations();
    newControl.get('minValue').setValue(previousMax);
    newControl.get('maxValue').setValue(previousMax);
  }
}
