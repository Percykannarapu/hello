import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { SmartTile, ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { AudienceDataDefinition } from '../../models/audience-data.model';
import { map } from 'rxjs/operators';
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
  public sliderVal: number = null;
  public tileSelectorOptions: SelectItem[] = [];
  public tileSelectorValues: SmartTile[] = [];
  public varSelectorOptions: SelectItem[] = [];
  public selectedVar: string; //the variable that has been selected in the UI dropdown menu
  public scoreTypeOptions: SelectItem[] = [];
  public selectedScoreType: string = 'DMA';
  public minRadius: number;
  public maxRadius: number;
  public includeMustCover: boolean = false;
  public source: string = null;

  private selectedVars: AudienceDataDefinition[] = []; //the variables that have been selected and come from the TargetAudienceService
  private errorTitle: string = 'Audience Trade Area Error';
  private audienceSourceMap: Map<string, string> = new Map<string, string>();

  constructor(private audienceTradeareaService: ValAudienceTradeareaService,
    private messagingService: AppMessagingService,
    private targetAudienceService: TargetAudienceService,
    private stateService: AppStateService,
    private usageService: UsageService,
    private impLocationService: ImpGeofootprintLocationService) { }

  ngOnInit() {
    this.tileSelectorOptions.push({label: SmartTile.EXTREMELY_HIGH, value: SmartTile.EXTREMELY_HIGH});
    this.tileSelectorOptions.push({label: SmartTile.HIGH, value: SmartTile.HIGH});
    this.tileSelectorOptions.push({label: SmartTile.ABOVE_AVERAGE, value: SmartTile.ABOVE_AVERAGE});
    this.tileSelectorOptions.push({label: SmartTile.AVERAGE, value: SmartTile.AVERAGE});
    this.tileSelectorOptions.push({label: SmartTile.BELOW_AVERAGE, value: SmartTile.BELOW_AVERAGE});
    this.tileSelectorOptions.push({label: SmartTile.LOW, value: SmartTile.LOW});
    this.tileSelectorOptions.push({label: SmartTile.EXTREMELY_LOW, value: SmartTile.EXTREMELY_LOW});
    this.scoreTypeOptions.push({label: 'DMA', value: 'DMA'});
    this.scoreTypeOptions.push({label: 'National', value: 'national'});

    this.targetAudienceService.audiences$.pipe(
      map(audiences => audiences.filter(audience => audience.audienceSourceName !== 'Audience-TA'))
    ).subscribe(targetingVar => this.updateVars(targetingVar));

    this.stateService.getClearUserInterfaceObs().subscribe(() => {
      this.clearFields();
    });
  }

  private updateVars(targetingVars: AudienceDataDefinition[]) {
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
    if (this.selectedVar != null && this.sliderVal == null) {
      if (this.audienceSourceMap.get(this.selectedVar) === 'VLH') {
        this.sliderVal = 100;
      } else {
        this.sliderVal = 65;
      }
    }
  }

  public onVarDropdownChange(event: any) {
    this.source = event.value;
    if (this.audienceSourceMap.has(event.value) && this.audienceSourceMap.get(event.value) === 'VLH') {
      this.sliderVal = 100;
    } else {
      this.sliderVal = 65;
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

  public onSelectMustCover() {
    this.includeMustCover = !this.includeMustCover;
    console.log('AARON: MUST COVER', this.includeMustCover);
  }

  public onClickApply() {
    const siteCount = this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === 'Site').length;
    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'audience', action: 'applied' });

    if (!this.minRadius || !this.maxRadius) {
      this.messagingService.showErrorNotification(this.errorTitle, 'You must include both a minumum trade area and a maximum trade area');
      return;
    }
    if (isNaN(this.maxRadius) || isNaN(this.minRadius)) {
      this.messagingService.showErrorNotification(this.errorTitle, 'Invalid input, please enter a valid minimum trade area and a valid maximum trade area');
      return;
    }
    if (Number(this.maxRadius) <= Number(this.minRadius)) {
      this.messagingService.showErrorNotification(this.errorTitle, 'The maximum radius must be larger than the minimum radius');
      return;
    }
    if (!this.selectedVar) {
      this.messagingService.showErrorNotification(this.errorTitle, 'You must select a variable before creating a trade area');
      return;
    }
    const id: number = this.getVarId();
    if (!id) {
      this.messagingService.showErrorNotification(this.errorTitle, 'Unable to determine ID for the selected variable');
      return;
    }
    if (this.stateService.analysisLevel$.getValue() == null || this.stateService.analysisLevel$.getValue().length === 0) {
      this.messagingService.showErrorNotification(this.errorTitle, 'You must select an Analysis Level before applying a trade area to Sites');
      return;
    }
    this.messagingService.startSpinnerDialog('AUDIENCETA', 'Creating Audience Trade Area');

    const metricText = `analysisLevel=${this.stateService.analysisLevel$.getValue()}~siteCount=${siteCount}~minRadius=${this.minRadius}
~maxRadius=${this.maxRadius}~varPk=${id}~audienceName=${this.selectedVar}~source=${this.audienceSourceMap.get(this.selectedVar)}~weight=${this.sliderVal}
~scoreType=${this.selectedScoreType}~includeAllInMustCover=${this.includeMustCover ? 1 : 0}`;

    this.usageService.createCounterMetric(usageMetricName, metricText, null);
    this.audienceTradeareaService.createAudienceTradearea(this.minRadius, this.maxRadius, this.tileSelectorValues, id, this.sliderVal, this.selectedScoreType, this.includeMustCover)
      .subscribe(result => {
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
        if (!result) {
          this.messagingService.showErrorNotification(this.errorTitle, 'Error while creating Audience Trade Area');
        }
      },
      error => {
        console.error('Error while creating audience tradearea', error);
        this.messagingService.showErrorNotification(this.errorTitle, 'Error while creating Audience Trade Area');
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
      });
  }

  public clearFields(){
    this.sliderVal = null;
    this.tileSelectorOptions = [];
    this.tileSelectorValues = [];
    this.varSelectorOptions = [];
    this.selectedVar = null;
    //this.scoreTypeOptions = [];
    this.selectedScoreType = 'DMA';
    this.minRadius = null;
    this.maxRadius = null;
    this.includeMustCover = false;
    this.source = null;
    this.selectedVars = [];
    this.errorTitle = 'Audience Trade Area Error';
    this.audienceSourceMap = new Map<string, string>();
  }

}
