import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { FormConfig, isConvertibleToNumber, isFunction } from '@val/common';
import { SelectItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil } from 'rxjs/operators';
import {
  ImpClientLocationTypeCodes,
  SuccessfulLocationTypeCodes,
  TradeAreaMergeTypeCodes
} from '../../../../worker-shared/data-model/impower.data-model.enums';
import { ValassisValidators } from '../../../common/valassis-validators';
import { ImpGeofootprintTradeArea } from '../../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { DistanceTradeAreaUiModel, TradeAreaModel } from './distance-trade-area-ui.model';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';

@Component({
  selector: 'val-distance-trade-area',
  templateUrl: './distance-trade-area.component.html'
})
export class DistanceTradeAreaComponent implements OnInit, OnDestroy {
  @Input()
  public set hasLocations(value: boolean) {
    this._hasLocations = value;
    this.setFormValue('hasLocations', this._hasLocations);
  }
  @Input()
  public set analysisLevel(value: string) {
    this._analysisLevel = value;
    this.setFormValue('analysisLevel', this._analysisLevel);
  }
  @Input()
  public set hasProvidedTradeAreas(value: boolean) {
    this._hasProvidedTradeAreas = value;
    this.setFormValue('isReadOnly', this._hasProvidedTradeAreas);
  }
  @Input()
  public set currentMergeType(value: TradeAreaMergeTypeCodes) {
    this._currentMergeType = value;
    this.setFormValue('mergeType', this._currentMergeType);
  }
  @Input()
  public set currentTradeAreas(value: ImpGeofootprintTradeArea[]) {
    if (!(value.length === 0 && this._currentTradeAreas.length === 0)) {
      this._currentTradeAreas = value;
      this.currentTradeAreaCount = this._currentTradeAreas.length;
      this.setupForm();
    }
  }

  @Input() maxRadius: number;
  @Input() maxTradeAreas: number;
  @Input() locationType: SuccessfulLocationTypeCodes;

  @Output() formSubmitted = new EventEmitter<DistanceTradeAreaUiModel>();
  @Output() deleteTradeArea = new EventEmitter<DistanceTradeAreaUiModel>();

  radiusForm: FormGroup;
  tradeAreaMergeTypes: SelectItem[];

  private _analysisLevel: string;
  private _hasLocations: boolean;
  private _currentTradeAreas: ImpGeofootprintTradeArea[] = [];
  private _currentMergeType: TradeAreaMergeTypeCodes;
  private _hasProvidedTradeAreas: boolean;
  private currentTradeAreaCount: number;

  get tradeAreaControls() : FormGroup[] {
    if (this.radiusForm != null && this.radiusForm.get('tradeAreas') != null && (this.radiusForm.get('tradeAreas') as FormArray).controls != null) {
      return (this.radiusForm.get('tradeAreas') as FormArray).controls as FormGroup[];
    }
    return [];
  }

  private destroyed$ = new Subject<void>();
  private cleanup$ = new Subject<void>();

  constructor(private fb: FormBuilder,
              private store$: Store<LocalAppState>) {
    this.tradeAreaMergeTypes = Object.keys(TradeAreaMergeTypeCodes)
      .filter(k => !isFunction(TradeAreaMergeTypeCodes[k]))
      .map(k => ({
        value: TradeAreaMergeTypeCodes[k],
        label: TradeAreaMergeTypeCodes[k]
      }));
  }

  ngOnInit() {
    this.currentTradeAreaCount = this._currentTradeAreas == null || this._currentTradeAreas.length === 0 ? 1 : this._currentTradeAreas.length;
    this.setupForm();
    /*this.store$.select(projectIsReady).subscribe((flag) => {
        if (flag){
          this.setupForm();
        }
    });*/
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  addNewRadius() {
    const formArray = this.radiusForm.get('tradeAreas') as FormArray;
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

  deleteRadius(index: number) {
    const formArray = this.radiusForm.get('tradeAreas') as FormArray;
    this.cleanup$.next();
    formArray.removeAt(index);
    this.currentTradeAreaCount -= 1;
    this.setupRadiusValidations();
    if (index == 0) {
      this.addNewRadius();
      this.deleteTradeArea.emit(this.radiusForm.value);
    }
  }

  private setFormValue<T extends DistanceTradeAreaUiModel, K extends keyof T>(field: K, value: T[K]) : void {
    if (this.radiusForm != null && this.radiusForm.get(field as string) != null) {
      this.radiusForm.get(field as string).setValue(value);
    }
  }

  private setupForm() : void {
    const tradeAreaSetups = [];
    for (let i = 0; i < this.currentTradeAreaCount; ++i) {
      const currentTA: Partial<ImpGeofootprintTradeArea> = this._currentTradeAreas[i] || {};
      const currentTradeAreaSetup: FormConfig<TradeAreaModel> = {
        tradeAreaNumber: i + 1,
        isActive: currentTA.isActive || false,
        radius: currentTA.taRadius || null
      };
      tradeAreaSetups.push(this.fb.group(currentTradeAreaSetup));
    }
    const analysisLevelValidator = this.locationType === ImpClientLocationTypeCodes.Site ? [Validators.required] : undefined;
    const formSetup: FormConfig<DistanceTradeAreaUiModel> = {
      mergeType: this._currentMergeType || TradeAreaMergeTypeCodes.MergeEach,
      isReadOnly: this._hasProvidedTradeAreas || false,
      tradeAreas: new FormArray(tradeAreaSetups),
      hasLocations: new FormControl(this._hasLocations, [Validators.requiredTrue]),
      analysisLevel: new FormControl(this._analysisLevel, analysisLevelValidator)
    };
    this.radiusForm = this.fb.group(formSetup);
    this.setupRadiusValidations();
  }

  private setupRadiusValidations() : void {
    const mergeAllOption = this.tradeAreaMergeTypes.filter(s => s.value === TradeAreaMergeTypeCodes.MergeAll)[0];
    mergeAllOption.disabled = this.currentTradeAreaCount < 2;
    if (this.currentTradeAreaCount === 1 && this.radiusForm.get('mergeType').value === TradeAreaMergeTypeCodes.MergeAll) {
      this.setFormValue('mergeType', TradeAreaMergeTypeCodes.MergeEach);
    }
    for (let i = 0; i < this.currentTradeAreaCount; ++i) {
      const prevRadius = this.radiusForm.get(`tradeAreas.${i - 1}.radius`);
      const currentRadius = this.radiusForm.get(`tradeAreas.${i}.radius`);
      const nextRadius = this.radiusForm.get(`tradeAreas.${i + 1}.radius`);
      const minValue = prevRadius == null ? 0 : Number(prevRadius.value);
      const maxValue = nextRadius == null || !isConvertibleToNumber(nextRadius.value) ? this.maxRadius : Number(nextRadius.value);
      currentRadius.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(minValue), Validators.max(maxValue)]);
      currentRadius.valueChanges.pipe(
        takeUntil(this.destroyed$),
        takeUntil(this.cleanup$),
        filter(() => currentRadius.valid),
        distinctUntilChanged()
      ).subscribe(newRadius => {
        const localPrev = this.radiusForm.get(`tradeAreas.${i - 1}.radius`);
        const localIsActive = this.radiusForm.get(`tradeAreas.${i}.isActive`);
        const localNext = this.radiusForm.get(`tradeAreas.${i + 1}.radius`);
        localIsActive.setValue(true);
        if (localNext != null) {
          const afterNext = this.radiusForm.get(`tradeAreas.${i + 2}.radius`);
          const localMax = afterNext == null ? this.maxRadius : Number(afterNext.value);
          localNext.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(Number(newRadius)), Validators.max(localMax)]);
          localNext.updateValueAndValidity();
        }
        if (localPrev != null) {
          const beforePrev = this.radiusForm.get(`tradeAreas.${i - 2}.radius`);
          const localMin = beforePrev == null ? 0 : Number(beforePrev.value);
          localPrev.setValidators([Validators.required, ValassisValidators.numeric, ValassisValidators.greaterThan(localMin), Validators.max(Number(newRadius))]);
          localPrev.updateValueAndValidity();
        }
      });
    }
  }
}
