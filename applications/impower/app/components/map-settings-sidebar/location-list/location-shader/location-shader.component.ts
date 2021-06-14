import { Component, EventEmitter, Input, OnDestroy, Output, ViewEncapsulation } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig, isConvertibleToNumber, rgbToHex } from '@val/common';
import {
  completeEsriFaces,
  duplicatePoiConfiguration,
  LabelDefinition,
  PoiConfiguration,
  PoiConfigurationTypes,
  RadiiTradeAreaDrawDefinition,
  RgbaTuple,
  RgbTuple,
  TradeAreaModel
} from '@val/esri';
import { ImpGeofootprintTradeArea } from 'app/val-modules/targeting/models/ImpGeofootprintTradeArea';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import { ValassisValidators } from '../../../../common/valassis-validators';
import { ImpGeofootprintLocation } from '../../../../val-modules/targeting/models/ImpGeofootprintLocation';

@Component({
  selector: 'val-location-shader',
  templateUrl: './location-shader.component.html',
  styleUrls: ['./location-shader.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LocationShaderComponent implements OnDestroy {

  @Input() labelChoices: SelectItem[];
  @Input() defaultColor: RgbaTuple;
  @Input() poiData: ImpGeofootprintLocation[];
  @Input() configuration: PoiConfiguration;
  @Output() applyConfiguration: EventEmitter<PoiConfiguration> = new EventEmitter<PoiConfiguration>();

  @Input() maxTradeAreas: number;
  @Input() maxRadius: number;

  private currentTradeAreaCount: number;
  private _currentTradeAreas: ImpGeofootprintTradeArea[] = [];

  public get symbologyAttributes() : SelectItem[] {
    return this._symbologyAttributes;
  }

  @Input()
  public set symbologyAttributes(value: SelectItem[]) {
    value.sort((a, b) => {
      if (a.label.toLowerCase() === 'icon') return -1;
      if (b.label.toLowerCase() === 'icon') return 1;
      return a.label.localeCompare(b.label);
    });
    this._symbologyAttributes = value;
  }

  @Input()
  public set currentTradeAreas(value: ImpGeofootprintTradeArea[]) {
    if (!(value.length === 0 && this._currentTradeAreas.length === 0)) {
      this._currentTradeAreas = value;
      this.currentTradeAreaCount = this._currentTradeAreas.length;
      this.setupForm();
    }
  }

  configForm: FormGroup;
  isEditing: boolean = false;
  defaultHalo: RgbaTuple = [255, 255, 255, 1];
  PoiConfigurationTypes = PoiConfigurationTypes;
  shaderTypeChoices: SelectItem[] = [
    { label: 'Same for All', value: PoiConfigurationTypes.Simple },
    { label: 'Based on Attribute', value: PoiConfigurationTypes.Unique }
  ];
  fontFaces: SelectItem[];

  private _symbologyAttributes: SelectItem[];
  private destroyed$ = new Subject<void>();

  private cleanup$ = new Subject<void>();

  constructor(private fb: FormBuilder) {
    this.fontFaces = completeEsriFaces.map(f => ({ label: f, value: f }));
    this.currentTradeAreaCount = this._currentTradeAreas == null || this._currentTradeAreas.length === 0 ? 1 : this._currentTradeAreas.length;
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public edit() : void {
    this.setupForm();
    this.isEditing = true;
  }

  public cancel() : void {
    this.isEditing = false;
  }

  public apply(form: FormGroup) : void {
    if (form.valid) {
      const newDef: PoiConfiguration = duplicatePoiConfiguration(this.configuration);
      const convertedForm = this.convertForm(form);
      Object.assign(newDef, convertedForm);
      this.applyConfiguration.emit(newDef);
    }
  }

  protected setupForm() : void {
    const defaultLabelDefinition: Partial<LabelDefinition> = this.configuration.labelDefinition || {};

    const formSetup: any = {
      layerName: new FormControl(this.configuration.layerName, [Validators.required]),
      poiType: new FormControl(this.configuration.poiType, [Validators.required]),
      opacity: new FormControl(this.configuration.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
      showLabels: new FormControl(this.configuration.showLabels || false, { updateOn: 'change' }),
      visibleRadius: new FormControl(this.configuration.visibleRadius || false, {updateOn: 'change'}),
      radiiColor: new FormControl(this.configuration.radiiColor),
      labelDefinition: this.fb.group({
        isBold: new FormControl(defaultLabelDefinition.isBold || false, { updateOn: 'change' }),
        isItalic: new FormControl(defaultLabelDefinition.isItalic || false, { updateOn: 'change' }),
        usesStaticColor: new FormControl(defaultLabelDefinition.usesStaticColor || false, { updateOn: 'change' }),
        family: new FormControl(defaultLabelDefinition.family || 'Noto Sans', { updateOn: 'change', validators: [Validators.required] }),
        size: new FormControl(defaultLabelDefinition.size || 12, [Validators.required, ValassisValidators.numeric, Validators.min(6), Validators.max(48)]),
        color: new FormControl(defaultLabelDefinition.color),
        haloColor: new FormControl(defaultLabelDefinition.haloColor),
        featureAttribute: new FormControl(defaultLabelDefinition.featureAttribute, { updateOn: 'change', validators: [Validators.required] })
      })
    };
    this.configForm = this.fb.group(formSetup);

    if (this.configuration.visibleRadius) {
      const tradeAreaSetups = this.setupDefaultRadiiTas();
      this.configForm.addControl('tradeAreas', this.fb.array(tradeAreaSetups));
      this.setupRadiusValidations();
    }
    this.configForm.get('visibleRadius').valueChanges.pipe(
      takeUntil(this.destroyed$),
      distinctUntilChanged()
    ).subscribe((showRadiiControls: boolean) => {
      if (showRadiiControls) {
        const tradeAreaSetups = this.setupDefaultRadiiTas();
        this.configForm.addControl('tradeAreas', this.fb.array(tradeAreaSetups));
        this.setupRadiusValidations();
      } else {
        this.cleanup$.next();
        this.configForm.removeControl('tradeAreas');
        this.configForm.updateValueAndValidity();
      }
    });
  }

  protected convertForm(form: FormGroup) : PoiConfiguration {
    const result: PoiConfiguration = form.value;
    switch (result.poiType) {
      case PoiConfigurationTypes.Simple:
        result.symbolDefinition.outlineColor = RgbTuple.duplicate(result.symbolDefinition.outlineColor || this.defaultHalo);
        break;
      case PoiConfigurationTypes.Unique:
        result.breakDefinitions.forEach(bd => {
          bd.outlineColor = RgbTuple.duplicate(bd.outlineColor || this.defaultHalo);
          bd.outlineWidth = bd.outlineWidth || 1;
        });
        break;
    }
    return result;
  }

  getLabelDescription(labelDef: LabelDefinition) : string {
    const foundItem = (this.labelChoices || []).filter(l => l.value === labelDef.featureAttribute)[0];
    return foundItem == null ? 'n/a' : foundItem.label;
  }

  getFontWeight(labelDef: LabelDefinition) : string {
    const fontItems: string[] = [];
    if (labelDef.isBold) fontItems.push('Bold');
    if (labelDef.isItalic) fontItems.push('Italic');
    return fontItems.length > 0 ? fontItems.join(' ') : 'Regular';
  }

  getLabelColor(symbolDef: LabelDefinition) : string {
    return rgbToHex(symbolDef.color || this.defaultColor || [0, 0, 0, 1]);
  }

  getLabelHalo(symbolDef: LabelDefinition) : string {
    return rgbToHex(symbolDef.haloColor || this.defaultHalo || [255, 255, 255, 1]);
  }

  getRadiusDescription(radiiDef: RadiiTradeAreaDrawDefinition[]) : string {
    const radiiString = radiiDef.map(r => r.buffer[0]).join('/');
    return `${radiiString} miles`;
  }

  deleteRadius(index: number) {
    const formArray = this.configForm.get('tradeAreas') as FormArray;
    formArray.removeAt(index);
    this.currentTradeAreaCount -= 1;
    this.cleanup$.next();
    this.setupRadiusValidations();
  }

  addNewRadius(){
    const formArray = this.configForm.get('tradeAreas') as FormArray;
    const newControlValues: FormConfig<TradeAreaModel> = {
      tradeAreaNumber: this.currentTradeAreaCount + 1,
      isActive: false,
      radius: null
    };
    formArray.insert(this.currentTradeAreaCount, this.fb.group(newControlValues));
    this.currentTradeAreaCount += 1;
    this.cleanup$.next();
    this.setupRadiusValidations();
  }

  get tradeAreaControls() : FormGroup[] {
    //console.log('remove the log:tradeAreaControls :::', this.configForm);
    if (this.configForm != null && this.configForm.get('tradeAreas') != null && (this.configForm.get('tradeAreas') as FormArray).controls != null) {
      return (this.configForm.get('tradeAreas') as FormArray).controls as FormGroup[];
    }
    return [];
  }

  private setupRadiusValidations() : void {
    //const mergeAllOption = this.tradeAreaMergeTypes.filter(s => s.value === TradeAreaMergeTypeCodes.MergeAll)[0];
    //mergeAllOption.disabled = this.currentTradeAreaCount < 2;
    //if (this.currentTradeAreaCount === 1 && this.configForm.get('mergeType').value === TradeAreaMergeTypeCodes.MergeAll) {
     // this.setFormValue('mergeType', TradeAreaMergeTypeCodes.MergeEach);
    //}
    for (let i = 0; i < this.currentTradeAreaCount; ++i) {
      const prevRadius = this.configForm.get(`tradeAreas.${i - 1}.radius`);
      const currentRadius = this.configForm.get(`tradeAreas.${i}.radius`);
      const nextRadius = this.configForm.get(`tradeAreas.${i + 1}.radius`);
      const minValue = prevRadius == null ? 0 : Number(prevRadius.value);
      const maxValue = nextRadius == null || !isConvertibleToNumber(nextRadius.value) ? this.maxRadius : Number(nextRadius.value);
      currentRadius.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(minValue), Validators.max(maxValue)]);
      currentRadius.valueChanges.pipe(
        takeUntil(this.destroyed$),
        takeUntil(this.cleanup$),
        filter(() => currentRadius.valid),
        distinctUntilChanged()
      ).subscribe(newRadius => {
        const localPrev = this.configForm.get(`tradeAreas.${i - 1}.radius`);
        const localIsActive = this.configForm.get(`tradeAreas.${i}.isActive`);
        const localNext = this.configForm.get(`tradeAreas.${i + 1}.radius`);
        localIsActive.setValue(true);
        if (localNext != null) {
          const afterNext = this.configForm.get(`tradeAreas.${i + 2}.radius`);
          const localMax = afterNext == null ? this.maxRadius : Number(afterNext.value);
          localNext.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(Number(newRadius)), Validators.max(localMax)]);
          localNext.updateValueAndValidity();
        }
        if (localPrev != null) {
          const beforePrev = this.configForm.get(`tradeAreas.${i - 2}.radius`);
          const localMin = beforePrev == null ? 0 : Number(beforePrev.value);
          localPrev.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(localMin), Validators.max(Number(newRadius))]);
          localPrev.updateValueAndValidity();
        }
      });
    }
  }

  private setupDefaultRadiiTas(){
    //const radiiTaDef = this.configuration.radiiTradeareaDefination;
    const tradeAreaSetups = [];

    if (this.configuration.radiiTradeAreaDefinition != null && this.configuration.radiiTradeAreaDefinition.length > 0){
      this.currentTradeAreaCount = this.configuration.radiiTradeAreaDefinition.length;
      this.configuration.radiiTradeAreaDefinition.forEach(def => {
        const currentTradeAreaSetup: FormConfig<TradeAreaModel> = {
          tradeAreaNumber: def.taNumber,
          isActive: true,
          radius: def.buffer[0] || null
        };
        tradeAreaSetups.push(this.fb.group(currentTradeAreaSetup));
       });
    }
    else
      for (let i = 0; i < this.currentTradeAreaCount; ++i) {
        const currentTA: Partial<ImpGeofootprintTradeArea> = this._currentTradeAreas[i] || {};
        const currentTradeAreaSetup: FormConfig<TradeAreaModel> = {
          tradeAreaNumber: `radii${i + 1}`,
          isActive: currentTA.isActive || false,
          radius: currentTA.taRadius || null
        };
        tradeAreaSetups.push(this.fb.group(currentTradeAreaSetup));
      }

     return tradeAreaSetups;
  }
}
