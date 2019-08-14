import { Component, OnInit } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { SelectItem } from 'primeng/api';
import { filter, withLatestFrom } from 'rxjs/operators';
import { FullState } from '../../state';
import { localSelectors } from '../../state/app.selectors';
import { SetNonVariableShading, SetVariableShading, CalculateEqualIntervals, SetClassBreakValues } from '../../state/shading/shading.actions';
import { ShadingState, ShadingType, VarDefinition, VariableRanges } from '../../state/shading/shading.reducer';
import { SharedState } from '../../state/shared/shared.reducers';
import { of } from 'rxjs';
import { mapBy } from '@val/common';

export enum NumericVariableShadingMethod {
  StandardIndex = 'Standard Index',
  CustomClassifications = 'Custom Classifications',
  EqualIntervals = 'Equal Intervals'
}

const DEFAULT_SHADING_TYPE = ShadingType.SITE;
const DEFAULT_NUMERIC_METHOD = NumericVariableShadingMethod.StandardIndex;
const DEFAULT_CLASS_BREAKS = 4;
const DEFAULT_BREAK_VALUES = [80, 120, 140];

@Component({
  selector: 'val-shading-config',
  templateUrl: './shading-config.component.html',
  styleUrls: ['./shading-config.component.css']
})
export class ShadingConfigComponent implements OnInit {

  shadingTypes = ShadingType;
  numericShadingMethods = NumericVariableShadingMethod;

  shadingTypeOptions: Array<SelectItem> = [];
  selectedShadingType: ShadingType = DEFAULT_SHADING_TYPE;
  variableOptions: Array<SelectItem> = [];
  selectedVar: VarDefinition;
  numericMethodOptions: Array<SelectItem> = [];
  selectedNumericMethod: NumericVariableShadingMethod = DEFAULT_NUMERIC_METHOD;
  classBreakOptions: Array<SelectItem> = [];
  selectedClassBreaks: number = DEFAULT_CLASS_BREAKS;

  classBreakValues: number[] = [...DEFAULT_BREAK_VALUES];

  constructor(private store: Store<FullState>) { }

  ngOnInit() {
    this.setupDefaultDropDownOptions();
    this.store.pipe(
      select(localSelectors.getAppReady),
      withLatestFrom(this.store.select(localSelectors.getSharedState), this.store.select(localSelectors.getShadingState)),
      filter(([ready]) => ready)
    ).subscribe(([, shared, shading]) => this.setupDynamicDropDownOptions(shared, shading));

    this.store.pipe(
      withLatestFrom(this.store.select(localSelectors.getShadingState)),
    ).subscribe(([,  shading]) => {
      this.classBreakValues = shading.classBreakValues.length == 0 ? [...DEFAULT_BREAK_VALUES] : shading.classBreakValues;
      this.setSelectedVar(shading);
      this.selectedNumericMethod = shading.selectedNumericMethod;
    });

  }

  indexTracker(index: number) {
    return index;
  }

  private setupDefaultDropDownOptions() {
    this.shadingTypeOptions.push({ label: 'Site', value: ShadingType.SITE });
    this.shadingTypeOptions.push({ label: 'Zip', value: ShadingType.ZIP });
    this.numericMethodOptions.push({ label: NumericVariableShadingMethod.StandardIndex, value: NumericVariableShadingMethod.StandardIndex });
    this.numericMethodOptions.push({ label: NumericVariableShadingMethod.CustomClassifications, value: NumericVariableShadingMethod.CustomClassifications });
    this.numericMethodOptions.push({ label: NumericVariableShadingMethod.EqualIntervals, value: NumericVariableShadingMethod.EqualIntervals });
    this.classBreakOptions.push({ label: '3 Classes', value: 3 });
    this.classBreakOptions.push({ label: '4 Classes', value: 4 });
    this.classBreakOptions.push({ label: '5 Classes', value: 5 });
    this.classBreakOptions.push({ label: '6 Classes', value: 6 });
  }

  private setupDynamicDropDownOptions(state: SharedState, shading: ShadingState) {
    if (state.isWrap)
      this.shadingTypeOptions.push({ label: 'Wrap Zone', value: ShadingType.WRAP_ZONE });
    if (state.analysisLevel === 'atz')
      this.shadingTypeOptions.push({ label: 'ATZ Indicator', value: ShadingType.ATZ_INDICATOR });
    if (shading.availableVars.length > 0) {
      this.shadingTypeOptions.push({ label: 'Variable', value: ShadingType.VARIABLE });
      this.variableOptions = shading.availableVars.map(v => ({ label: v.name, value: v }));
      this.selectedVar = shading.availableVars[0];
    }
    this.selectedClassBreaks = shading.selectedClassBreaks;
    this.classBreakValues = shading.classBreakValues;

  }

  private setSelectedVar(shading: ShadingState){
    this.variableOptions = shading.availableVars.map(v => ({ label: v.name, value: v }));
    if (this.variableOptions.length > 0 && this.selectedVar != null){
      const mapVariableOptions = mapBy(this.variableOptions, 'label');
      this.selectedVar = mapVariableOptions.get(this.selectedVar.name).value;
    }
    
  }

  onShadingOptionChange(event: { value: ShadingType }) {
    if (event.value !== ShadingType.VARIABLE) {
      this.store.dispatch(new SetNonVariableShading({ shadingType: event.value }));
    } else {
      this.selectedNumericMethod = DEFAULT_NUMERIC_METHOD;
      this.selectedClassBreaks = DEFAULT_CLASS_BREAKS;
      this.classBreakValues = [...DEFAULT_BREAK_VALUES];
    }
  }

  onVariableOptionChanged() {
    this.selectedNumericMethod = DEFAULT_NUMERIC_METHOD;
    this.selectedClassBreaks = DEFAULT_CLASS_BREAKS;
    this.classBreakValues = [...DEFAULT_BREAK_VALUES];
    this.store.dispatch(new SetClassBreakValues({classBreakValues: this.classBreakValues, 
      breakCount: this.selectedClassBreaks, 
      selectedVar: this.selectedVar,
      selectedNumericMethod: this.selectedNumericMethod}));
  }

  onMethodOptionChanged(event: { value: NumericVariableShadingMethod }) {
    switch (event.value) {
      case NumericVariableShadingMethod.StandardIndex:
        this.selectedClassBreaks = 4;
        this.classBreakValues = [...DEFAULT_BREAK_VALUES];
        break;
      //  case NumericVariableShadingMethod.CustomClassifications:
      //   this.selectedClassBreaks = 4;
      //   this.classBreakValues = [];
      //  break;
      case NumericVariableShadingMethod.EqualIntervals:
        this.selectedClassBreaks = 4;
        this.calculateEqualIntervals(this.selectedClassBreaks, NumericVariableShadingMethod.EqualIntervals);
        break;
    }
  }

  onBreakCountChanged(classBreaks: number) {
    if (this.selectedNumericMethod === NumericVariableShadingMethod.EqualIntervals) {
      this.calculateEqualIntervals(classBreaks, NumericVariableShadingMethod.EqualIntervals);
    } else {
      this.classBreakValues = [];
      for (let i = 0; i < classBreaks - 1; ++i) {
        this.classBreakValues.push(null); // have to initialize items so the template ngFor will work;
      }
    }
  }

  private calculateEqualIntervals(breakCount: number, selectedNumericMethod: NumericVariableShadingMethod) {
    this.store.dispatch(new CalculateEqualIntervals({breakCount: breakCount, selectedVar: this.selectedVar, selectedNumericMethod: selectedNumericMethod}));
    
  }

  applyVariableShading() {
    const classifications: VariableRanges[] = [];
    this.store.dispatch(new SetClassBreakValues({classBreakValues: this.classBreakValues, 
                              breakCount: this.selectedClassBreaks, 
                              selectedVar: this.selectedVar,
                              selectedNumericMethod: this.selectedNumericMethod}));
    classifications.push({ minValue: null, maxValue: this.classBreakValues[0] });
    for (let i = 1; i < this.classBreakValues.length; ++i) {
      classifications.push({ minValue: this.classBreakValues[i - 1], maxValue: this.classBreakValues[i] });
    }
    classifications.push({ minValue: this.classBreakValues[this.classBreakValues.length - 1], maxValue: null });
    this.store.dispatch(new SetVariableShading({ classifications, selectedVarName: this.selectedVar.name }));
    
  }

  isNotValid(currentBreak: number, previousBreak: number) {
    return !(currentBreak == null || previousBreak == null || (currentBreak > previousBreak));
  }

  breaksAreInvalid() {
    let result = false;
    for (let i = 0; i < this.classBreakValues.length; ++i) {
      result = result || this.classBreakValues[i] == null;
      if (i !== 0) {
        result = result || this.classBreakValues[i] < this.classBreakValues[i - 1];
      }
    }
    return result;
  }

  setBreak(index: number, value: string) {
    const noCommaValue = value.replace(/,/gi, '');
    this.classBreakValues[index] = Number(noCommaValue);
  }
}
