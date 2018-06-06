import { Component, OnInit, ViewChild } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { MultiSelectModule, Dropdown } from 'primeng/primeng';
import { SmartTile, ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { AudienceDataDefinition } from '../../models/audience-data.model';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { filter, map } from 'rxjs/operators';


@Component({
  selector: 'val-audience-tradearea',
  templateUrl: './audience-tradearea.component.html',
  styleUrls: ['./audience-tradearea.component.css']
})
export class AudienceTradeareaComponent implements OnInit {
  public sliderVal: number = 65;
  public tileSelectorOptions: SelectItem[] = [];
  public tileSelectorValues: SmartTile[] = [];
  public varSelectorOptions: SelectItem[] = [];
  public selectedVar: string; //the variable that has been selected in the UI dropdown menu
  public scoreTypeOptions: SelectItem[] = [];
  public selectedScoreType: string = 'DMA';
  public minRadius: number;
  public maxRadius: number;

  private selectedVars: AudienceDataDefinition[] = []; //the variables that have been selected and come from the TargetAudienceService
  private errorTitle: string = 'Audience Trade Area Error';

  constructor(private audienceTradeareaService: ValAudienceTradeareaService,
    private messagingService: AppMessagingService,
    private targetAudienceService: TargetAudienceService,
    private discoService: ImpDiscoveryService) { }

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

    this.targetAudienceService.audiences$.subscribe(targetingVar => this.updateVars(targetingVar));
  }

  private updateVars(targetingVars: AudienceDataDefinition[]) {
    const vars: SelectItem[] = [];
    for (const targetingVar of targetingVars) {
      const selectItem: SelectItem = {label: targetingVar.audienceName, value: targetingVar.audienceName};
      vars.push(selectItem);
      this.selectedVars.push(targetingVar);
      this.selectedVar = targetingVar.audienceName;
    }
    this.varSelectorOptions = vars;
  }

  public onVarDropdownChange(event: any) {
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
    if (!this.minRadius || !this.maxRadius) {
      this.messagingService.showGrowlError(this.errorTitle, 'You must include both a minumum trade area and a maximum trade area');
      return;
    }
    if (isNaN(this.maxRadius) || isNaN(this.minRadius)) {
      this.messagingService.showGrowlError(this.errorTitle, 'Invalid input, please enter a valid minimum trade area and a valid maximum trade area');
      return;
    }
    if (Number(this.maxRadius) <= Number(this.minRadius)) {
      this.messagingService.showGrowlError(this.errorTitle, 'The maximum radius must be larger than the minimum radius');
      return;
    }
    if (!this.selectedVar) {
      this.messagingService.showGrowlError(this.errorTitle, 'You must select a variable before creating a trade area');
      return;
    }
    const id: number = this.getVarId();
    if (!id) {
      this.messagingService.showGrowlError(this.errorTitle, 'Unable to determine ID for the selected variable');
      return;
    }
    if (!this.discoService.get()[0].analysisLevel) {
      this.messagingService.showGrowlError(this.errorTitle, 'You must select an Analysis Level before applying a trade area to Sites');
      return;
    }
    this.messagingService.startSpinnerDialog('AUDIENCETA', 'Creating Audience Trade Area');
    this.audienceTradeareaService.createAudienceTradearea(this.minRadius, this.maxRadius, this.tileSelectorValues, id, this.sliderVal, this.selectedScoreType)
      .subscribe(result => {
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
      },
      error => {
        console.error('Error while creating audience tradearea');
        this.messagingService.showGrowlError(this.errorTitle, 'Error while creating Audience Trade Area');
        this.messagingService.stopSpinnerDialog('AUDIENCETA');
      });
  }

}
