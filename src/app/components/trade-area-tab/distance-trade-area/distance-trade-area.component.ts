import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ValidatorFn } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { distinctUntilChanged, pairwise, startWith } from 'rxjs/operators';
import { TradeAreaMergeTypeCodes } from '../../../val-modules/targeting/targeting.enums';
import { DistanceTradeAreaUiModel, TradeAreaModel } from './distance-trade-area-ui.model';

const numberOrNull = (value: any) => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);

@Component({
  selector: 'val-distance-trade-area',
  templateUrl: './distance-trade-area.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DistanceTradeAreaComponent implements OnInit, OnChanges {
  @Input() currentTradeAreas: TradeAreaModel[];
  @Input() currentMergeType: TradeAreaMergeTypeCodes;
  @Input() maxRadius: number;
  @Input() numTradeAreas: number;
  @Input() hasProvidedTradeAreas: boolean;

  @Output() mergeTypeChange = new EventEmitter<TradeAreaMergeTypeCodes>();
  @Output() tradeAreaApply = new EventEmitter<DistanceTradeAreaUiModel>();

  radiusForm: FormGroup;
  get tradeAreaControls() { return (this.radiusForm.get('tradeAreas') as FormArray).controls; }
  get mergeType() { return this.radiusForm.get('mergeType'); }

  tradeAreaMergeTypes: SelectItem[] = [
    { label: 'No Merge', value: TradeAreaMergeTypeCodes.NoMerge },
    { label: 'Merge Each', value: TradeAreaMergeTypeCodes.MergeEach },
    { label: 'Merge All', value: TradeAreaMergeTypeCodes.MergeAll }
  ];

  constructor(private fb: FormBuilder) {}

  private static processRadiusChanges(previousRadius: any, newRadius: any, tradeAreaControl: AbstractControl) : void {
    if (previousRadius === newRadius) return;
    const isShowingControl = tradeAreaControl.get('isShowing');
    if (newRadius == null || newRadius === '' || tradeAreaControl.get('radius').errors != null) {
      isShowingControl.setValue(false);
      isShowingControl.disable();
    } else {
      isShowingControl.setValue(true);
      isShowingControl.enable();
    }
    tradeAreaControl.get('isApplied').setValue(false);
  }

  ngOnInit() {
    this.radiusForm = this.fb.group({
      tradeAreas: this.fb.array([]),
      mergeType: this.currentMergeType
    });
    const arrayRef = this.radiusForm.controls.tradeAreas as FormArray;
    for (let i = 0; i < this.numTradeAreas; ++i) {
      let taControl: FormGroup;
      if (this.currentTradeAreas != null && this.currentTradeAreas[i] != null) {
        taControl = this.fb.group({
          radius: [this.currentTradeAreas[i].radius, [this.isInRange(0, this.maxRadius), this.noDupes(this)]],
          isShowing: { value: this.currentTradeAreas[i].isShowing, disabled: this.currentTradeAreas[i].radius == null },
          isApplied: this.currentTradeAreas[i].isApplied
        });
      } else {
        taControl = this.fb.group({
          radius: [null, [this.isInRange(0, this.maxRadius)]],
          isShowing: { value: false, disabled: true },
          isApplied: false
        });
      }
      // this sets up the radius controls so that when you change the value, we change visibility
      taControl.get('radius').valueChanges.pipe(
        startWith(null),
        pairwise()
      ).subscribe(([previous, current]) => DistanceTradeAreaComponent.processRadiusChanges(previous, current, taControl));
      arrayRef.push(taControl);
    }
    // emit an event when the merge type changes
    this.radiusForm.get('mergeType').valueChanges.pipe(
      distinctUntilChanged()
    ).subscribe(newMergeType => this.mergeTypeChange.emit(newMergeType));
  }

  ngOnChanges(changes: SimpleChanges) : void {
    // this method gets triggered whenever any of the @Input values get changed from outside
    console.log('On Change called', changes);
    if (this.radiusForm == null) return;
    if (changes['currentTradeAreas'] != null && JSON.stringify(changes['currentTradeAreas'].currentValue) !== JSON.stringify(this.radiusForm.get('tradeAreas').value)) {
      this.radiusForm.patchValue({
        tradeAreas: this.currentTradeAreas
      });
    }
    if (changes['currentMergeType'] != null && changes['currentMergeType'] != this.radiusForm.get('mergeType').value) {
      this.radiusForm.patchValue({
        mergeType: this.currentMergeType
      });
    }
  }

  private isInRange(minValue: number, maxValue: number) : ValidatorFn {
    return function(control: AbstractControl) {
      const currentRadius = numberOrNull(control.value);
      if (control.value != null && control.value !== '' && (currentRadius <= minValue || currentRadius > maxValue || Number.isNaN(Number(control.value)))) {
        return  {
          rangeValid: `You must enter a numeric value > ${minValue} and <= ${maxValue} for trade areas you want to apply.`
        };
      }
      return null;
    };
  }

  private noDupes(thisRef: DistanceTradeAreaComponent) : ValidatorFn {
    return function(control: AbstractControl) {
      const radiusControls = thisRef.tradeAreaControls.map(tac => tac.get('radius')).filter(rc => rc !== control);
      const otherRadii = radiusControls.map(rc => numberOrNull(rc.value)).filter(r => r != null);
      const currentRadius = numberOrNull(control.value);
      if (currentRadius != null && otherRadii.includes(currentRadius)) {
        return {
          duplicateTradeArea: 'You must enter a unique value for each trade area you want to apply.'
        };
      }
      return null;
    };
  }
}
