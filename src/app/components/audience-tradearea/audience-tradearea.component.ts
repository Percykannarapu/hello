import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SelectItem } from 'primeng/primeng';
import { SmartTile, ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { AudienceDataDefinition, AudienceTradeAreaConfig } from '../../models/audience-data.model';
import { map, distinctUntilChanged, filter } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';


@Component({
  selector: 'val-audience-tradearea',
  templateUrl: './audience-tradearea.component.html',
  styleUrls: ['./audience-tradearea.component.css']
})
export class AudienceTradeareaComponent implements OnInit {
  public varSelectorOptions: SelectItem[] = [];
  public selectedVar: string; //the variable that has been selected in the UI dropdown menu
  public scoreTypeOptions: SelectItem[] = [];
  public source: string = null;

  public configForm: FormGroup;

  private selectedVars: AudienceDataDefinition[] = []; //the variables that have been selected and come from the TargetAudienceService
  private errorTitle: string = 'Audience Trade Area Error';
  private audienceSourceMap: Map<string, string> = new Map<string, string>();

  constructor(private audienceTradeareaService: ValAudienceTradeareaService,
    private messagingService: AppMessagingService,
    private targetAudienceService: TargetAudienceService,
    private stateService: AppStateService,
    private usageService: UsageService,
    private impLocationService: ImpGeofootprintLocationService,
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

    this.configForm.valueChanges.pipe(distinctUntilChanged()).subscribe(f => this.onFormChange(f));

    this.targetAudienceService.audiences$.pipe(
      map(audiences => audiences.filter(audience => audience.audienceSourceName !== 'Audience-TA'))
    ).subscribe(targetingVar => this.updateVars(targetingVar));

    this.stateService.getClearUserInterfaceObs().subscribe(() => {
      this.clearFields();
    });
  }

  public onFormChange(form: any) {
    const audienceTAConfig: AudienceTradeAreaConfig = {
      analysisLevel: this.stateService.analysisLevel$.getValue() ? this.stateService.analysisLevel$.getValue().toLowerCase() : null,
      digCategoryId: this.getVarId(),
      locations: null,
      maxRadius: form.maxRadius,
      minRadius: form.minRadius,
      scoreType: form.scoreType,
      weight: form.weight,
      includeMustCover: form.includeMustCover
    };
    this.audienceTradeareaService.updateAudienceTAConfig(audienceTAConfig);
  }

  private updateVars(targetingVars: AudienceDataDefinition[]) {
    const weight = this.configForm.get('weight');
    const vars: SelectItem[] = [];
    for (const targetingVar of targetingVars) {
      const selectItem: SelectItem = {label: targetingVar.audienceName, value: targetingVar.audienceName};
      vars.push(selectItem);
      this.selectedVars.push(targetingVar);
      this.audienceSourceMap.set(targetingVar.audienceName, targetingVar.audienceSourceName);
    }
    this.varSelectorOptions = vars;
    if (this.selectedVar == null && this.varSelectorOptions.length > 0) {
      this.selectedVar = this.varSelectorOptions[0].value;
    }
    if (this.selectedVar != null && weight == null) {
      if (this.audienceSourceMap.get(this.selectedVar) === 'VLH') {
        this.configForm.patchValue({ weight: 100 });
      } else {
        this.configForm.patchValue({ weight: 65 });
      }
    }
  }

  public onVarDropdownChange(event: any) {
    this.source = event.value;
    if (this.audienceSourceMap.has(event.value) && this.audienceSourceMap.get(event.value) === 'VLH') {
      this.configForm.patchValue({ weight: 100 });
    } else {
      this.configForm.patchValue({ weight: 65 });
    }
  }

  private getVarId() : number {
    const targetingVar: AudienceDataDefinition[] = this.selectedVars.filter(v => v.audienceName === this.selectedVar);
    const id: number = Number(targetingVar[0].secondaryId.replace(',', ''));
    if (Number.isNaN(id)) {
      return null;
    }
    return id;
  }

  public onClickApply() {
    const siteCount = this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Site').length;
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'audience', action: 'applied' });
    const audienceTAConfig = this.audienceTradeareaService.getAudienceTAConfig();
    
    

    const metricText = `analysisLevel=${this.stateService.analysisLevel$.getValue()}~siteCount=${siteCount}~minRadius=${audienceTAConfig.minRadius}
~maxRadius=${audienceTAConfig.maxRadius}~varPk=${this.getVarId()}~audienceName=${this.selectedVar}~source=${this.audienceSourceMap.get(this.selectedVar)}~weight=${audienceTAConfig.weight}
~scoreType=${audienceTAConfig.scoreType}~includeAllInMustCover=${audienceTAConfig.includeMustCover ? 1 : 0}`;

    this.usageService.createCounterMetric(usageMetricName, metricText, null);
    this.audienceTradeareaService.createAudienceTradearea(this.audienceTradeareaService.getAudienceTAConfig())
      .subscribe(result => {
        
        if (!result) {
          this.messagingService.showGrowlError(this.errorTitle, 'Error while creating Audience Trade Area');
        }
      },
      error => {
        console.error('Error while creating audience tradearea', error);
        this.messagingService.showGrowlError(this.errorTitle, 'Error while creating Audience Trade Area');
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
      });
  }

  public clearFields(){
    this.varSelectorOptions = [];
    this.selectedVar = null;
    //this.scoreTypeOptions = [];
    this.source = null;
    this.selectedVars = [];
    this.errorTitle = 'Audience Trade Area Error';
    this.audienceSourceMap = new Map<string, string>();
  }

}
