import { Component, OnInit, SimpleChanges, OnChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { ValAudienceTradeareaService } from '../../../services/app-audience-tradearea.service';
import { AudienceDataDefinition, AudienceTradeAreaConfig } from '../../../models/audience-data.model';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { Store } from '@ngrx/store';
import { CreateTradeAreaUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { AppTradeAreaService } from '../../../services/app-trade-area.service';


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
  private isLoadingData: boolean = false;

  @Input() currentAudienceTAConfig: AudienceTradeAreaConfig;
  @Input() currentAudiences: AudienceDataDefinition[];
  @Input() currentLocationsCount: number;
  @Output() updatedFormData: EventEmitter<FormGroup> = new EventEmitter<FormGroup>();
  @Output() runAudienceTA: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(private stateService: AppStateService,
    private store$: Store<LocalAppState>,
    private audienceTradeareaService: ValAudienceTradeareaService,
    private tradeareaService: AppTradeAreaService,
    private fb: FormBuilder) { }

  ngOnInit() {

    this.scoreTypeOptions.push({label: 'DMA', value: 'DMA'});
    this.scoreTypeOptions.push({label: 'National', value: 'national'});
     
    this.configForm = this.fb.group({
      'minRadius': [null, Validators.required],
      'maxRadius': [null, Validators.required],
      'audience': [null, Validators.required],
      'weight': [null, Validators.required],
      'scoreType': [null, Validators.required],
      'includeMustCover': [false]
    });

    this.configForm.valueChanges.subscribe(f => {
      this.updatedFormData.emit(f);
    });

    // this.configForm.valueChanges.pipe(
    //   filter(() => this.configForm.valid && !this.isLoadingData),
    //   distinctUntilChanged()).subscribe(f => {
    //   this.updatedFormData.emit(f);
    // });

    this.stateService.clearUI$.subscribe(() => {
      this.clearFields();
    });

    this.stateService.analysisLevel$.subscribe(() => {
      const config = this.audienceTradeareaService.getAudienceTAConfig();
      let currentAnalysis = this.stateService.analysisLevel$.getValue();
      if (currentAnalysis) currentAnalysis = currentAnalysis.toLowerCase();
      if ( config && config.analysisLevel && config.analysisLevel != currentAnalysis && this.tradeareaService.tradeareaType == 'audience') {
        config.analysisLevel = currentAnalysis;
        this.audienceTradeareaService.updateAudienceTAConfig(config);
        this.runAudienceTA.emit(true);
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isLoadingData = true;
    if (changes.currentAudienceTAConfig != null) {
      this.onConfigChange(changes.currentAudienceTAConfig.currentValue);
    }
    if (changes.currentAudiences != null) {
      this.updateVars(changes.currentAudiences.currentValue);
    }
    this.isLoadingData = false;
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
    }, {emitEvent: false});
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
    this.tradeareaService.tradeareaType = 'audience';
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
    this.store$.dispatch(new CreateTradeAreaUsageMetric('audience', 'applied', metricText));
  }

  public clearFields(){
    this.varSelectorOptions = [];
    //this.scoreTypeOptions = [];
    this.selectedVars = [];
    this.audienceSourceMap = new Map<string, string>();
  }

}
