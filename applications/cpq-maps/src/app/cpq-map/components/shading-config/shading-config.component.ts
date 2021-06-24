import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { mapBy } from '@val/common';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, withLatestFrom } from 'rxjs/operators';
import { FullState } from '../../state/index';
import { NumericVariableShadingMethod, ShadingType, VarDefinition, VariableRanges } from '../../state/app.interfaces';
import { localSelectors } from '../../state/app.selectors';
import { CalculateEqualIntervals, SetAnneShading, SetClassBreakValues, SetNonVariableShading, SetShadingType, SetSoloShading, SetVariableShading } from '../../state/map-ui/map-ui.actions';
import { initialState as mapUIInitialState, MapUIState } from '../../state/map-ui/map-ui.reducer';
import { SetPrefsDirty } from '../../state/shared/shared.actions';
import { SharedState } from '../../state/shared/shared.reducers';

@Component({
  selector: 'cpq-shading-config',
  templateUrl: './shading-config.component.html',
  styleUrls: ['./shading-config.component.css']
})
export class ShadingConfigComponent implements OnInit {

  shadingTypes = ShadingType;
  numericShadingMethods = NumericVariableShadingMethod;

  shadingTypeOptions: Array<SelectItem> = [];
  selectedShadingType: ShadingType;
  variableOptions: Array<SelectItem> = [];
  selectedVar: VarDefinition;
  numericMethodOptions: Array<SelectItem> = [];
  selectedNumericMethod: NumericVariableShadingMethod = NumericVariableShadingMethod.EqualIntervals;
  classBreakOptions: Array<SelectItem> = [];
  selectedClassBreaks: number;

  classBreakValues: number[];

  shadeAnne$: Observable<boolean>;
  shadeSolo$: Observable<boolean>;

  constructor(private store: Store<FullState>) { }

  ngOnInit() {
    this.setupDefaultDropDownOptions();
    this.store.select(localSelectors.getAppReady).pipe(
      filter(ready => ready),
      withLatestFrom(this.store.select(localSelectors.getSharedState), this.store.select(localSelectors.getMapUIState)),
    ).subscribe(([, shared, shading]) => this.setupDynamicDropDownOptions(shared, shading));

    this.store.select(localSelectors.getMapUIState).subscribe(shading => {
      this.classBreakValues = shading.classBreakValues != null && shading.classBreakValues.length == 0 ? [...mapUIInitialState.classBreakValues] : shading.classBreakValues;
      this.setSelectedVar(shading);
      this.selectedNumericMethod = shading.selectedNumericMethod;
    });

    this.shadeAnne$ = this.store.select(localSelectors.getShadeAnne);
    this.shadeSolo$ = this.store.select(localSelectors.getShadeSolo);
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

  private setupDynamicDropDownOptions(state: SharedState, shading: MapUIState) {
    this.selectedClassBreaks = shading.selectedClassBreaks;
    this.classBreakValues = shading.classBreakValues;
    this.selectedShadingType = shading.shadingType;
    this.selectedNumericMethod = shading.selectedNumericMethod;

    if (state.isWrap)
      this.shadingTypeOptions.push({ label: 'Wrap Zone', value: ShadingType.WRAP_ZONE });
    if (state.analysisLevel === 'atz')
      this.shadingTypeOptions.push({ label: 'ATZ Indicator', value: ShadingType.ATZ_INDICATOR });
    if (shading.availableVars.length > 0) {
      this.shadingTypeOptions.push({ label: 'Variable', value: ShadingType.VARIABLE });
      this.variableOptions = shading.availableVars.map(v => ({ label: v.name, value: v }));
      this.selectedVar = shading.selectedVar;
      if (this.selectedNumericMethod === NumericVariableShadingMethod.EqualIntervals){
        this.calculateEqualIntervals(this.selectedClassBreaks, this.selectedNumericMethod);
      }
    }
  }

  private setSelectedVar(shading: MapUIState){
    this.variableOptions = shading.availableVars.map(v => ({ label: v.name, value: v }));
    if (this.variableOptions.length > 0 && this.selectedVar != null){
      const mapVariableOptions = mapBy(this.variableOptions, 'label');
      this.selectedVar = mapVariableOptions.get(this.selectedVar.name).value;
    }
  }

  onShadingOptionChange(event: { value: ShadingType }) {
    this.store.dispatch(new SetShadingType({ shadingType: event.value }));
    this.store.dispatch(new SetPrefsDirty());
    if (event.value !== ShadingType.VARIABLE) {
      this.store.dispatch(new SetNonVariableShading({ shadingType: event.value }));
    } else {
      this.selectedNumericMethod = mapUIInitialState.selectedNumericMethod;
      this.selectedClassBreaks = mapUIInitialState.selectedClassBreaks;
      this.classBreakValues = [...mapUIInitialState.classBreakValues];
    }
    this.store.dispatch(new SetClassBreakValues({
      classBreakValues: this.classBreakValues,
      breakCount: this.selectedClassBreaks,
      selectedVar: this.selectedVar,
      selectedNumericMethod: this.selectedNumericMethod
    }));
  }

  onVariableOptionChanged() {
    this.selectedNumericMethod = mapUIInitialState.selectedNumericMethod;
    this.selectedClassBreaks = mapUIInitialState.selectedClassBreaks;
    this.classBreakValues = [...mapUIInitialState.classBreakValues];
    this.store.dispatch(new SetClassBreakValues({classBreakValues: this.classBreakValues,
      breakCount: this.selectedClassBreaks,
      selectedVar: this.selectedVar,
      selectedNumericMethod: this.selectedNumericMethod}));

    this.store.dispatch(new SetPrefsDirty());
  }

  onMethodOptionChanged(event: { value: NumericVariableShadingMethod }) {
    switch (event.value) {
      case NumericVariableShadingMethod.StandardIndex:
        this.selectedClassBreaks = 4;
        this.classBreakValues = [...mapUIInitialState.classBreakValues];
        this.store.dispatch(new SetClassBreakValues({classBreakValues: this.classBreakValues,
          breakCount: this.selectedClassBreaks,
          selectedVar: this.selectedVar,
          selectedNumericMethod: this.selectedNumericMethod}));
        this.store.dispatch(new SetPrefsDirty());
        break;
      //  case NumericVariableShadingMethod.CustomClassifications:
      //   this.selectedClassBreaks = 4;
      //   this.classBreakValues = [];
      //  break;
      case NumericVariableShadingMethod.EqualIntervals:
        this.selectedClassBreaks = 4;
        this.calculateEqualIntervals(this.selectedClassBreaks, NumericVariableShadingMethod.EqualIntervals);
        this.store.dispatch(new SetPrefsDirty());
        break;
    }
  }

  onBreakCountChanged(classBreaks: number) {
    if (this.selectedNumericMethod === NumericVariableShadingMethod.EqualIntervals) {
      this.calculateEqualIntervals(classBreaks, NumericVariableShadingMethod.EqualIntervals);
      this.store.dispatch(new SetPrefsDirty());
    } else {
      this.classBreakValues = [];
      for (let i = 0; i < classBreaks - 1; ++i) {
        this.classBreakValues.push(null); // have to initialize items so the template ngFor will work;
      }
    }
  }

  private calculateEqualIntervals(breakCount: number, selectedNumericMethod: NumericVariableShadingMethod) {
    this.store.dispatch(new CalculateEqualIntervals({
      breakCount: breakCount,
      selectedVar: this.selectedVar,
      selectedNumericMethod: selectedNumericMethod,
      classBreakValues: this.classBreakValues,
      isRowCheckOrUncheck: false
    }));
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
    this.store.dispatch(new SetPrefsDirty());
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

  anneChanged(shadeAnne: boolean) {
    this.store.dispatch(new SetAnneShading({ shadeAnne }));
    this.store.dispatch(new SetPrefsDirty());
  }

  soloChanged(shadeSolo: boolean) {
    this.store.dispatch(new SetSoloShading({ shadeSolo }));
    this.store.dispatch(new SetPrefsDirty());
  }
}
