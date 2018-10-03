import { Component, OnInit, SimpleChanges, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { AudienceDataDefinition, AudienceTradeAreaConfig } from '../../../models/audience-data.model';
import { Observable } from 'rxjs';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { AppStateService } from '../../../services/app-state.service';
import { ImpMetricName } from '../../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../../services/usage.service';


@Component({
  selector: 'val-audience-tradearea',
  templateUrl: './audience-tradearea.component.html',
  styleUrls: ['./audience-tradearea.component.css']
})
export class AudienceTradeareaComponent implements OnInit, OnChanges {
  public varSelectorOptions: SelectItem[] = [];
  public scoreTypeOptions: SelectItem[] = [];
  public configForm: FormGroup;

  private selectedVars: AudienceDataDefinition[] = []; //the variables that have been selected and come from the TargetAudienceService
  private audienceSourceMap: Map<string, string> = new Map<string, string>();

  @Input() currentAudienceTAConfig: AudienceTradeAreaConfig;
  @Input() currentAudiences: AudienceDataDefinition[];
  @Input() currentLocationsCount: number;
  @Output() updatedFormData: EventEmitter<FormGroup> = new EventEmitter<FormGroup>();
  @Output() runAudienceTA: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private stateService: AppStateService,
    private usageService: UsageService,
    private fb: FormBuilder) { }

  ngOnInit() {

    this.scoreTypeOptions.push({label: 'DMA', value: 'DMA'});
    this.scoreTypeOptions.push({label: 'National', value: 'national'});

    this.configForm = this.fb.group({
      'minRadius': [null, Validators.required],
      'maxRadius': [null, Validators.required],
      'audience': [null, Validators.required],
      'weight': [null, Validators.required],
      'scoreType': ['DMA', Validators.required],
      'includeMustCover': [false]
    });

    this.configForm.valueChanges.pipe(distinctUntilChanged()).subscribe(f => {
      this.updatedFormData.emit(f);
    });

    this.stateService.clearUI$.subscribe(() => {
      this.clearFields();
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.currentAudienceTAConfig != null) {
      this.onConfigChange(changes.currentAudienceTAConfig.currentValue);
    }
    if (changes.currentAudiences != null) {
      this.updateVars(changes.currentAudiences.currentValue);
    }
  }

  private onConfigChange(config: AudienceTradeAreaConfig) {
    if (this.configForm == null) return; // this can happen when the app is first starting up
    this.configForm.patchValue({
      minRadius: config.minRadius,
      maxRadius: config.maxRadius,
      audience: config.audienceName,
      weight: config.weight,
      scoreType: config.scoreType,
      includeMustCover: config.includeMustCover
    });
  }

  private updateVars(targetingVars: AudienceDataDefinition[]) {
    if (this.configForm == null) return; // this can happen when the app is first starting up
    const weight = this.configForm.get('weight').value;
    const vars: SelectItem[] = [];
    for (const targetingVar of targetingVars) {
      const selectItem: SelectItem = {label: targetingVar.audienceName, value: targetingVar.audienceName};
      vars.push(selectItem);
      this.selectedVars.push(targetingVar);
      this.audienceSourceMap.set(targetingVar.audienceName, targetingVar.audienceSourceName);
    }
    this.varSelectorOptions = vars;
    if (this.configForm.get('audience').value == null && this.varSelectorOptions.length > 0) {
      this.configForm.patchValue({ audience: this.varSelectorOptions[0].value });
    }
    if (this.configForm.get('audience').value != null && weight == null) {
      if (this.audienceSourceMap.get(this.configForm.get('audience').value) === 'VLH') {
        this.configForm.patchValue({ weight: 100 });
      } else {
        this.configForm.patchValue({ weight: 65 });
      }
    }
    this.configForm.markAsDirty();
    this.configForm.updateValueAndValidity();
  }

  public onVarDropdownChange(event: any) {
    if (this.audienceSourceMap.has(event.value) && this.audienceSourceMap.get(event.value) === 'VLH') {
      this.configForm.patchValue({ weight: 100 });
    } else {
      this.configForm.patchValue({ weight: 65 });
    }
  }

  private getVarId() : number {
    const targetingVar: AudienceDataDefinition[] = this.selectedVars.filter(v => v.audienceName === this.configForm.get('audience').value);
    let id: number;
    if (targetingVar.length > 0)
      id = Number(targetingVar[0].secondaryId.replace(',', ''));
    if (Number.isNaN(id)) {
      return null;
    }
    return id;
  }

  public onClickApply() {
    this.runAudienceTA.emit(true);
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'audience', action: 'applied' });
    const metricText = `analysisLevel=${this.stateService.analysisLevel$.getValue()}
                        ~siteCount=${this.currentLocationsCount}
                        ~minRadius=${this.currentAudienceTAConfig.minRadius}
                        ~maxRadius=${this.currentAudienceTAConfig.maxRadius}
                        ~varPk=${this.getVarId()}
                        ~audienceName=${this.configForm.get('audience').value}
                        ~source=${this.audienceSourceMap.get(this.configForm.get('audience').value)}
                        ~weight=${this.currentAudienceTAConfig.weight}
                        ~scoreType=${this.currentAudienceTAConfig.scoreType}
                        ~includeAllInMustCover=${this.currentAudienceTAConfig.includeMustCover ? 1 : 0}`;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);
  }

  public clearFields(){
    this.varSelectorOptions = [];
    //this.scoreTypeOptions = [];
    this.selectedVars = [];
    this.audienceSourceMap = new Map<string, string>();
  }

}
