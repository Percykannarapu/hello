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
  RgbTuple,
  UniquePoiConfiguration,
  UniqueValueMarkerDefinition
} from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil } from 'rxjs/operators';
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

  poiThemes: SelectItem[] = [];
  showUniqueValueUI: boolean = false;

  get breakDefinitions() : FormGroup[] {
    const breaks = this.parentForm.get('breakDefinitions') as FormArray;
    if (breaks != null) return (breaks.controls || []) as FormGroup[];
    return [];
  }

  get currentTheme() : ColorPalette {
    if (this.isEditing) {
      return this.parentForm.get('theme').value;
    } else {
      return this.configuration.theme;
    }
  }

  get reverseTheme() : boolean {
    if (this.isEditing) {
      return this.parentForm.get('reverseTheme').value;
    } else {
      return this.configuration.reverseTheme;
    }
  }

  private destroyed$ = new Subject<void>();
  private formBreaksChanged$ = new Subject<void>();

  constructor(private fb: FormBuilder,
              private cd: ChangeDetectorRef) {
    const allThemes = Object.keys(ColorPalette)
      .map(key => ({
        label: ColorPalette[key],
        value: ColorPalette[key]
      }));
    const gradientThemes = new Set([ColorPalette.Blue, ColorPalette.Orange, ColorPalette.Red, ColorPalette.EsriPurple, ColorPalette.CrossHatching]);
    this.poiThemes = allThemes.filter(k => !gradientThemes.has(k.value));
  }

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
      this.setUpFormBreaks(this.configuration.featureAttribute);
    }
    this.parentForm.get('featureAttribute').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe(featureAttribute => this.setUpFormBreaks(featureAttribute));
  }

  private setUpFormBreaks(featureAttribute: string) {
    const currentTheme = this.configuration.theme || ColorPalette.CpqMaps;
    const currentReverse = this.configuration.reverseTheme || false;
    const newBreaks = generateUniqueMarkerValues(this.getBreakValues(featureAttribute), getColorPalette(currentTheme, currentReverse));
    const configBreaks = this.configuration.breakDefinitions || [];
    const currentBreaks = configBreaks.length > 0 ? configBreaks : newBreaks;

    this.addOrSetControl('theme', new FormControl(currentTheme, { updateOn: 'change' }));
    this.addOrSetControl('reverseTheme', new FormControl(currentReverse));
    this.addOrSetControl('breakDefinitions', this.getDefaultUniqueSymbolFormControl(currentBreaks));

    this.formBreaksChanged$.next(); // cleans up the previous subscriptions
    this.showUniqueValueUI = true;

    this.parentForm.get('theme').valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.formBreaksChanged$),
      distinctUntilChanged(),
      map(theme => getColorPalette(theme, this.parentForm.get('reverseTheme').value))
    ).subscribe(palette => this.updatePalette(palette));

    this.parentForm.get('reverseTheme').valueChanges.pipe(
      takeUntil(this.destroyed$),
      takeUntil(this.formBreaksChanged$),
      distinctUntilChanged(),
      map(reverse => getColorPalette(this.parentForm.get('theme').value, reverse))
    ).subscribe(palette => this.updatePalette(palette));
  }

  private addOrSetControl(name: string, control: AbstractControl) : void {
    if (this.parentForm.get(name) == null) {
      this.parentForm.addControl(name, control);
    } else {
      this.parentForm.setControl(name, control);
    }
  }

  private getBreakValues(featureAttribute: string) : string[] {
    const dedupedResults = new Set<string>();
    this.poiData.forEach(loc => {
      const directField = loc[featureAttribute];
      const attribute = loc.impGeofootprintLocAttribs.filter(a => a.attributeCode === featureAttribute)[0];
      if (directField != null) {
        dedupedResults.add(directField);
      } else if (attribute != null) {
        dedupedResults.add(attribute.attributeValue);
      }
    });
    const result = Array.from(dedupedResults);
    result.sort();
    return result;
  }

  private getDefaultUniqueSymbolFormControl(breakDefinitions: UniqueValueMarkerDefinition[]) : FormArray {
    return this.fb.array(breakDefinitions.map(bd => {
      return this.fb.group({
        value: new FormControl(bd.value),
        legendName: new FormControl(bd.legendName, [Validators.required]),
        outlineColor: new FormControl(bd.outlineColor),
        color: new FormControl(bd.color, { updateOn: 'change' }),
        markerType: new FormControl(bd.markerType, { updateOn: 'change' })
      });
    }));
  }

  private updatePalette(palette: RgbTuple[]) {
    this.breakDefinitions.forEach((b, i) => {
      b.patchValue({
        color: RgbTuple.withAlpha(palette[i % palette.length], 1)
      });
    });
    this.cd.markForCheck();
  }
}
