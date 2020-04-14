import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import { ClassBreakFillDefinition, ClassBreakShadingDefinition, ColorPalette, DynamicAllocationTypes, FillPattern, FillSymbolDefinition, fillTypeFriendlyNames, getColorPalette, RgbaTuple, RgbTuple } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { getFillPalette } from '../../../../../../../../modules/esri/src/models/color-palettes';
import { getDefaultClassBreaks, getDefaultUserBreaks } from '../../../../../models/class-break-defaults.model';
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

  get userBreakArray() : FormArray {
    return this.parentForm.get('userBreakDefaults') as FormArray;
  }

  get userBreakDefaults() : FormGroup[] {
    const breaks = this.userBreakArray;
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

  get reverseTheme() : boolean {
    if (this.isEditing) {
      return this.parentForm.get('reverseTheme').value;
    } else {
      return this.definition.reverseTheme;
    }
  }

  private classBreakCleanup$ = new Subject<void>();
  private userBreakCleanup$ = new Subject<void>();
  private classBreakCount = 0;

  constructor(private fb: FormBuilder) {
    super();
    this.breakTypes = [
      { label: 'Set Value Ranges', value: 'Set Value Ranges' },
      { label: 'Equal Interval Ranges', value: 'Equal Interval Ranges' },
      { label: 'Equal Class Counts', value: 'Equal Class Counts' }
    ];
  }

  public getAllocationName(index: number, isFirst: boolean, isLast: boolean) : string {
    const prefix = this.getAllocationPrefix();
    if (isFirst) return `Lowest`;
    if (isLast) return `Highest`;
    return `${prefix} ${index + 1}`;
  }

  public getHexColor(esriColor: RgbaTuple) : string {
    return rgbToHex(esriColor);
  }

  public getFillName(esriFillType: FillPattern) : string {
    return fillTypeFriendlyNames[esriFillType];
  }

  public ngOnInit() {
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
    super.ngOnInit();
  }

  protected setupForm() : void {
    const currentTheme = this.definition.theme || ColorPalette.SixDarkColors;
    this.parentForm.addControl('theme', new FormControl(currentTheme, { updateOn: 'change' }));
    this.parentForm.addControl('reverseTheme', new FormControl(this.definition.reverseTheme || false, { updateOn: 'change' }));
    this.parentForm.addControl('dynamicallyAllocate', new FormControl(this.definition.dynamicallyAllocate, [Validators.required]));
    this.parentForm.addControl('dynamicAllocationType', new FormControl(this.definition.dynamicAllocationType || DynamicAllocationTypes.Interval));
    this.parentForm.addControl('dynamicAllocationSlots', new FormControl(this.definition.dynamicAllocationSlots || 3));
    const dynamicLegendValue = this.definition.dynamicLegend == null ? true : this.definition.dynamicLegend;
    this.parentForm.addControl('dynamicLegend', new FormControl(dynamicLegendValue));
    this.setupBreakControls(this.definition.breakDefinitions);
    this.setupUserBreakControls(this.definition.userBreakDefaults);
  }

  public breakTypeChanged(value: any) {
    const currentTheme = this.parentForm.get('theme').value;
    const currentReverse = this.parentForm.get('reverseTheme').value;
    switch (value) {
      case this.breakTypes[0].value:
        this.parentForm.get('dynamicallyAllocate').setValue(false);
        this.parentForm.get('dynamicAllocationType').setValue(null);
        this.parentForm.get('dynamicAllocationSlots').clearValidators();
        this.classBreakCleanup$.next();
        const newBreakDefinitions: ClassBreakFillDefinition[] = getDefaultClassBreaks(this.currentAudience.fieldconte, currentTheme, currentReverse);
        this.setupBreakControls(newBreakDefinitions);
        if (this.parentForm.get('userBreakDefaults') != null) {
          this.userBreakCleanup$.next();
          this.parentForm.removeControl('userBreakDefaults');
        }
        break;
      case this.breakTypes[1].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.Interval);
        this.parentForm.get('dynamicAllocationSlots').setValue(3);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        this.parentForm.get('dynamicLegend').setValue(true);
        this.userBreakCleanup$.next();
        this.setupUserBreakValidations();
        if (this.parentForm.get('breakDefinitions') != null) {
          this.classBreakCleanup$.next();
          this.parentForm.removeControl('breakDefinitions');
          this.classBreakCount = 0;
        }
        break;
      case this.breakTypes[2].value:
        this.parentForm.get('dynamicallyAllocate').setValue(true);
        this.parentForm.get('dynamicAllocationType').setValue(DynamicAllocationTypes.ClassCount);
        this.parentForm.get('dynamicAllocationSlots').setValue(3);
        this.parentForm.get('dynamicAllocationSlots').setValidators([Validators.required, Validators.min(2), Validators.max(20)]);
        this.parentForm.get('dynamicLegend').setValue(true);
        this.userBreakCleanup$.next();
        this.setupUserBreakValidations();
        if (this.parentForm.get('breakDefinitions') != null) {
          this.classBreakCleanup$.next();
          this.parentForm.removeControl('breakDefinitions');
          this.classBreakCount = 0;
        }
        break;
    }
  }

  private setupBreakControls(definitions: ClassBreakFillDefinition[]) : void {
    if (definitions != null && definitions.length > 0) {
      const breakControls = definitions.map(def => this.createClassBreakControl(def));
      this.parentForm.addControl('breakDefinitions', new FormArray(breakControls));
      this.classBreakCount = breakControls.length;
      this.setupClassBreakValidations();
    }
  }

  private setupUserBreakControls(definitions: FillSymbolDefinition[]) : void {
    if (definitions != null && definitions.length > 0) {
      const breakControls = definitions.map(def => this.createUserBreakControl(def));
      if (this.parentForm.contains('userBreakDefaults')) this.parentForm.removeControl('userBreakDefaults');
      this.parentForm.addControl('userBreakDefaults', new FormArray(breakControls));
      this.setupUserBreakValidations();
    }
  }

  private createClassBreakControl(newBreakDefinition: ClassBreakFillDefinition) : FormGroup {
    return this.fb.group({
      fillColor: new FormControl(newBreakDefinition.fillColor, { updateOn: 'change' }),
      fillType: new FormControl(newBreakDefinition.fillType, { updateOn: 'change' }),
      outlineColor: new FormControl(newBreakDefinition.outlineColor, { updateOn: 'change' }),
      legendName: new FormControl(newBreakDefinition.legendName, [Validators.required]),
      minValue: new FormControl(newBreakDefinition.minValue),
      maxValue: newBreakDefinition.maxValue
    });
  }

  private createUserBreakControl(newBreakDefinition: FillSymbolDefinition) : FormGroup {
    return this.fb.group({
      fillColor: new FormControl(newBreakDefinition.fillColor, { updateOn: 'change' }),
      fillType: new FormControl(newBreakDefinition.fillType, { updateOn: 'change' }),
      outlineColor: new FormControl(newBreakDefinition.outlineColor, { updateOn: 'change' }),
      legendName: new FormControl(newBreakDefinition.legendName)
    });
  }

  private setupUserBreakValidations() : void {
    const themeControl = this.parentForm.get('theme');
    const breakControl = this.parentForm.get('dynamicAllocationSlots');
    const dynamicLegendControl = this.parentForm.get('dynamicLegend');

    themeControl.valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.userBreakCleanup$),
      filter(() => !this.parentForm.get('dynamicLegend').value)
    ).subscribe(newTheme => {
      const reverseValue = this.parentForm.get('reverseTheme').value;
      const colorPalette = getColorPalette(newTheme, reverseValue);
      const fillPalette = getFillPalette(newTheme, reverseValue);
      const cm = colorPalette.length;
      const lm = fillPalette.length;
      const currentBreakControl = this.parentForm.get('dynamicAllocationSlots');
      if (currentBreakControl.valid) {
        for (let i = 0; i < currentBreakControl.value; ++i) {
          this.parentForm.get(`userBreakDefaults.${i}.fillColor`).setValue(RgbTuple.withAlpha(colorPalette[i % cm], 1));
          this.parentForm.get(`userBreakDefaults.${i}.fillType`).setValue(fillPalette[i % lm]);
        }
      }
    });

    breakControl.valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.userBreakCleanup$),
      filter(() => !this.parentForm.get('dynamicLegend').value && this.parentForm.get('dynamicAllocationSlots').valid)
    ).subscribe(newBreakCount => {
      const currentThemeValue = this.parentForm.get('theme').value;
      const reverseValue = this.parentForm.get('reverseTheme').value;
      this.userBreakCleanup$.next();
      const newDefinitions = getDefaultUserBreaks(newBreakCount, this.getAllocationPrefix(), currentThemeValue, reverseValue);
      this.setupUserBreakControls(newDefinitions);
    });

    dynamicLegendControl.valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.userBreakCleanup$),
    ).subscribe(newValue => {
      if (!newValue) {
        const currentThemeValue = this.parentForm.get('theme').value;
        const reverseValue = this.parentForm.get('reverseTheme').value;
        const currentBreakControl = this.parentForm.get('dynamicAllocationSlots');
        if (currentBreakControl.valid) {
          this.userBreakCleanup$.next();
          const newDefinitions = getDefaultUserBreaks(currentBreakControl.value, this.getAllocationPrefix(), currentThemeValue, reverseValue);
          this.setupUserBreakControls(newDefinitions);
        }
      } else {
        this.parentForm.removeControl('userBreakDefaults');
      }
    });
  }

  private setupClassBreakValidations() : void {
    const themeControl = this.parentForm.get('theme');
    themeControl.valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.classBreakCleanup$),
    ).subscribe(newTheme => {
      const reverseValue = this.parentForm.get('reverseTheme').value;
      const colorPalette = getColorPalette(newTheme, reverseValue);
      const fillPalette = getFillPalette(newTheme, reverseValue);
      const cm = colorPalette.length;
      const lm = fillPalette.length;
      for (let i = 0; i < this.classBreakCount; ++i) {
        this.parentForm.get(`breakDefinitions.${i}.fillColor`).setValue(RgbTuple.withAlpha(colorPalette[i % cm], 1));
        this.parentForm.get(`breakDefinitions.${i}.fillType`).setValue(fillPalette[i % lm]);
      }
    });
    for (let i = 0; i < this.classBreakCount; ++i) {
      const maxControl = this.parentForm.get(`breakDefinitions.${i}.maxValue`);
      const minControl = this.parentForm.get(`breakDefinitions.${i}.minValue`);
      if (i < this.classBreakCount - 1) {
        maxControl.setValidators([Validators.required, Validators.min(minControl.value)]);
      }
      maxControl.valueChanges.pipe(
        takeUntil(this.destroyed$),
        takeUntil(this.classBreakCleanup$),
      ).subscribe(newMaxValue => {
        this.setControlValues(i, newMaxValue);
      });
    }
  }

  private setControlValues(currentIndex: number, newMinValue: number) : void {
    const nextIndex = currentIndex + 1;
    const currentBreak = this.breakDefinitions[currentIndex];
    const nextBreak = this.breakDefinitions[nextIndex];
    const nextIsLastBreak = nextIndex === this.classBreakCount - 1;
    if (currentBreak != null) {
      const currentMin = currentBreak.get('minValue');
      const currentMax = currentBreak.get('maxValue');
      const currentLegend = currentBreak.get('legendName');
      currentLegend.setValue(this.generateNewLegend(currentMin.value, currentMax.value));
    }
    if (nextBreak != null) {
      const minControl = nextBreak.get('minValue');
      const maxControl = nextBreak.get('maxValue');
      const legendControl = nextBreak.get('legendName');
      minControl.setValue(newMinValue);
      legendControl.setValue(this.generateNewLegend(minControl.value, maxControl.value));
      if (!nextIsLastBreak) {
        maxControl.setValidators([Validators.required, Validators.min(newMinValue)]);
        maxControl.updateValueAndValidity();
        // for the css to work on a control that the user is not currently editing, we have mark it as touched
        if (maxControl.invalid) maxControl.markAsTouched();
      }
    }
  }

  private generateNewLegend(minValue?: number, maxValue?: number) : string {
    let suffix = '';
    if (this.currentAudience.fieldconte === FieldContentTypeCodes.Percent) {
      suffix = '%';
    }
    if (minValue == null) {
      return `Below ${maxValue}${suffix}`;
    }
    if (maxValue == null) {
      return `${minValue}${suffix} and above`;
    }
    return `${minValue}${suffix} to ${maxValue}${suffix}`;
  }

  private getAllocationPrefix() : string {
    const allocationType: DynamicAllocationTypes = this.isEditing ? this.parentForm.get('dynamicAllocationType').value : this.definition.dynamicAllocationType;
    switch (allocationType) {
      case DynamicAllocationTypes.Interval:
        return `Interval`;
      case DynamicAllocationTypes.ClassCount:
        return `Class`;
    }
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
    const colorPalette = getColorPalette(theme, false);
    const fillPalette = getFillPalette(theme, false);
    const cm = colorPalette.length;
    const lm = fillPalette.length;
    this.classBreakCleanup$.next();
    const index = this.classBreakCount - 2;
    const previousMax = this.breakDefinitions[index].get('maxValue').value;
    const newDefinition: ClassBreakFillDefinition = {
      fillType: fillPalette[this.classBreakCount % lm],
      minValue: null, maxValue: null,
      legendName: 'New Break',
      fillColor: RgbTuple.withAlpha(colorPalette[this.classBreakCount % cm], 1)
    };
    const newControl = this.createClassBreakControl(newDefinition);
    this.breakArray.insert(index + 1, newControl);
    this.classBreakCount += 1;
    this.setupClassBreakValidations();
    newControl.get('minValue').setValue(previousMax);
    newControl.get('maxValue').setValue(previousMax);
    newControl.get('maxValue').setValidators([Validators.required, Validators.min(previousMax)]);
  }

  formSubmit() {
    const dynamicLegendControl = this.parentForm.get('dynamicLegend');
    if (!dynamicLegendControl.value) {
      this.userBreakDefaults.forEach(c => {
        if (c.get('legendName') && (c.get('legendName').value == null || c.get('legendName').value === '')) c.removeControl('legendName');
      });
    }
  }
}
