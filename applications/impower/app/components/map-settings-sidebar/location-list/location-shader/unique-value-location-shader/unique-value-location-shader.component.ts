import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { rgbToHex } from '@val/common';
import {
  ColorPalette,
  generateUniqueMarkerValues,
  getColorPalette,
  MarkerSymbolDefinition,
  markerTypeFriendlyNames,
  RgbaTuple,
  UniquePoiConfiguration,
  UniqueValueMarkerDefinition
} from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { extractUniqueAttributeValues } from '../../../../../common/model.transforms';
import { ValassisValidators } from '../../../../../common/valassis-validators';
import { ImpGeofootprintLocation } from '../../../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-unique-value-location-shader',
  templateUrl: './unique-value-location-shader.component.html',
  styleUrls: ['./unique-value-location-shader.component.scss']
})
export class UniqueValueLocationShaderComponent implements OnInit, OnDestroy {

  @Input() isEditing: boolean;
  @Input() configuration: UniquePoiConfiguration;
  @Input() defaultColor: RgbaTuple;
  @Input() defaultHalo: RgbaTuple;
  @Input() parentForm: FormGroup;
  @Input() poiData: ImpGeofootprintLocation[] = [];
  @Input() featureAttributeChoices: SelectItem[] = [];

  showUniqueValueUI: boolean = false;

  get breakDefinitions() : FormGroup[] {
    const breaks = this.parentForm.get('breakDefinitions') as FormArray;
    if (breaks != null) return (breaks.controls || []) as FormGroup[];
    return [];
  }

  get currentTheme() : ColorPalette {
    return ColorPalette.Symbology;
  }

  private destroyed$ = new Subject<void>();

  constructor(private fb: FormBuilder,
              private cd: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.isEditing) this.setupForm();
  }

  ngOnDestroy() : void {
    if (this.parentForm) {
      this.parentForm.removeControl('breakDefinitions');
      this.parentForm.removeControl('theme');
      this.parentForm.removeControl('reverseTheme');
      this.parentForm.removeControl('featureAttribute');
    }
    this.destroyed$.next();
  }

  getMarkerDescription(symbolDef: MarkerSymbolDefinition) : string {
    return markerTypeFriendlyNames[symbolDef.markerType];
  }

  getMarkerColor(symbolDef: MarkerSymbolDefinition) : string {
    return rgbToHex(symbolDef.color || this.defaultColor || [0, 0, 0, 1]);
  }

  getMarkerHalo(symbolDef: MarkerSymbolDefinition) : string {
    return rgbToHex(symbolDef.outlineColor || this.defaultHalo || [255, 255, 255, 1]);
  }

  private setupForm() : void {
    this.parentForm.addControl(
      'featureAttribute',
      new FormControl(this.configuration.featureAttribute, { validators: [Validators.required], updateOn: 'change' })
    );
    if (this.configuration.featureAttribute != null && this.configuration.featureAttribute.length > 0) {
      this.setUpFormBreaks(this.configuration.featureAttribute, true);
    }
    this.parentForm.get('featureAttribute').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe(featureAttribute => this.setUpFormBreaks(featureAttribute, false));
  }

  private setUpFormBreaks(featureAttribute: string, useExisting: boolean) {
    const newBreaks = generateUniqueMarkerValues(extractUniqueAttributeValues(this.poiData, featureAttribute), getColorPalette(ColorPalette.Symbology, false));
    const configBreaks = this.configuration.breakDefinitions || [];
    const currentBreaks = configBreaks.length > 0 && useExisting ? configBreaks : newBreaks;
    this.addOrSetControl('breakDefinitions', this.getDefaultUniqueSymbolFormControl(currentBreaks));
    this.showUniqueValueUI = true;
    this.cd.markForCheck();
  }

  private addOrSetControl(name: string, control: AbstractControl) : void {
    if (this.parentForm.get(name) == null) {
      this.parentForm.addControl(name, control);
    } else {
      this.parentForm.setControl(name, control);
    }
  }

  private getDefaultUniqueSymbolFormControl(breakDefinitions: UniqueValueMarkerDefinition[]) : FormArray {
    return this.fb.array(breakDefinitions.map(bd => {
      return this.fb.group({
        value: new FormControl(bd.value),
        legendName: new FormControl(bd.legendName, [Validators.required]),
        outlineColor: new FormControl(bd.outlineColor),
        color: new FormControl(bd.color, { updateOn: 'change' }),
        size: new FormControl(bd.size || 10, [Validators.required, ValassisValidators.numeric]),
        markerType: new FormControl(bd.markerType, { updateOn: 'change' })
      });
    }));
  }
}
