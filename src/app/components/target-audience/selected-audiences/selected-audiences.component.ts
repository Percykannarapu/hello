import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { SelectItem } from 'primeng/primeng';
import { AppRendererService, SmartMappingTheme } from '../../../services/app-renderer.service';
import { UsageService } from '../../../services/usage.service';
import { ImpMetricName } from '../../../val-modules/metrics/models/ImpMetricName';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { map, take, filter, skip } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MetricService } from '../../../val-modules/common/services/metric.service';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { AppMessagingService } from '../../../services/app-messaging.service';
import { AppDiscoveryService } from '../../../services/app-discovery.service';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.css']
})
export class SelectedAudiencesComponent implements OnInit {

  audiences$: Observable<AudienceDataDefinition[]>;
  showRenderControls: boolean = false;
  hasAudiences: boolean = false;
  allThemes: SelectItem[] = [];
  currentTheme: string;

  constructor(private varService: TargetAudienceService, private usageService: UsageService,
    private appStateService: AppStateService, private metricService: MetricService,
    private appMessagingService: AppMessagingService,
    private confirmationService: ConfirmationService, private impDiscoveryService: AppDiscoveryService) {
    // this is how you convert an enum into a list of drop-down values
    const allThemes = SmartMappingTheme;
    const keys = Object.keys(allThemes);
    for (const key of keys) {
      this.allThemes.push({
        label: key,
        value: allThemes[key]
      });
    }
    this.currentTheme = this.allThemes[0].value;
  }

  public ngOnInit() : void {
    this.audiences$ = this.varService.audiences$;
    // .pipe(
    //   tap(items => console.log('Audience Observable contents:', items))
    // );
    const sub = this.varService.audiences$.pipe(
      map(audiences => audiences.length > 0)
    ).subscribe(res => this.hasAudiences = res, null, () => {
      if (sub) sub.unsubscribe();
    });
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready)
    ).subscribe(() => {
      this.onLoadProject();
    });

    this.appStateService.clearUI$.subscribe(() => this.clearSelectedFields());
  }

  private onLoadProject() {
    let showRender = false;
    this.varService.getAudiences().forEach(audience => {
      if (audience.showOnMap) {
        showRender = true;
      }
    });
    this.showRenderControls = showRender;
  }

  public onApplyClicked() {
    const audiences = this.varService.getAudiences();
    const mappedAudience = audiences.find(a => a.showOnMap === true);
    console.log('mappedAudience:::', mappedAudience);
    if (mappedAudience != null) {
      const analysisLevel = this.appStateService.analysisLevel$.getValue();
      const variableId = mappedAudience.audienceName == null ? 'custom' : mappedAudience.audienceIdentifier;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'thematic-shading', action: 'activated' });
      let metricText = null;
      if (mappedAudience.audienceSourceType === 'Custom'){
        metricText = 'CUSTOM' + '~' + mappedAudience.audienceName + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
      }
      else{
         metricText = variableId + '~' + mappedAudience.audienceName.replace('~', ':') + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
         metricText = metricText + (mappedAudience.allowNationalExport ? `~IndexBase=${mappedAudience.selectedDataSet}` : '');
          
      }

      this.usageService.createCounterMetric(usageMetricName, metricText, null);

      const counterMetricsDiscover = this.impDiscoveryService.discoveryUsageMetricsCreate('map-thematic-shading-activated');
      const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate('map-thematic-shading-activated');
      this.usageService.creategaugeMetrics(counterMetricsDiscover);
      this.usageService.creategaugeMetrics(counterMetricsColorBox);
      this.usageService.createCounterMetrics(counterMetricsDiscover);
      this.usageService.createCounterMetrics(counterMetricsColorBox);
    }
    if (this.appStateService.analysisLevel$.getValue() == null || this.appStateService.analysisLevel$.getValue().length === 0) {
      this.appMessagingService.showWarningNotification('Apply Selected Audience', 'You must select an Analysis Level in order to apply the selected audience variable(s)');
      return;
    }
    this.varService.applyAudienceSelection();
  }

  public onThemeChange(event: { value: SmartMappingTheme }) : void {
    console.log(event);
    AppRendererService.currentDefaultTheme = event.value;
    this.currentTheme = event.value.toString();
  }

  onMapSelected(audience: AudienceDataDefinition) : void {
    this.varService.updateProjectVars(audience);
    this.showRenderControls = audience.showOnMap;
    this.audiences$.pipe(
      map(all => all.filter(a => a.audienceIdentifier !== audience.audienceIdentifier)),
      take(1),
    ).subscribe(unMapped => unMapped.forEach(a => a.showOnMap = false)); // with take(1), this subscription will immediately close
  }
    
  onShowGridSelected(audience: AudienceDataDefinition): void{
    this.varService.updateProjectVars(audience);
    this.audiences$.pipe(
      map(a => a.filter(a2 => a2 === audience)),
      take(1),
    ).subscribe(selected => selected[0].showOnGrid = audience.showOnGrid);
   }
  
  onExportInGeoFootprintSelected(audience:AudienceDataDefinition) :void {
    this.varService.updateProjectVars(audience);
    this.audiences$.pipe(
      map(a => a.filter(a2 => a2 === audience)),
      take(1),
    ).subscribe(selected => selected[0].exportInGeoFootprint = audience.exportInGeoFootprint);
   }
  
  onNationalSelected(audience: AudienceDataDefinition) : void {
    this.varService.updateProjectVars(audience);
    this.audiences$.pipe(
      map(all => all.filter(a => a.audienceIdentifier !== audience.audienceIdentifier)),
      take(1),
    ).subscribe(unMapped => unMapped.forEach(a => a.exportNationally = false)); // with take(1), this subscription will immediately close
  }

  onIndexBaseChange(audience: AudienceDataDefinition) : void {
    this.varService.updateProjectVars(audience);
  }

  onRemove(audience) {
   const message = 'Do you want to delete the following audience from your project? \n\r' + `${audience.audienceName}  (${audience.audienceSourceType}: ${audience.audienceSourceName})`;
   this.confirmationService.confirm({
    message: message,
    header: 'Delete Confirmation',
    icon: 'ui-icon-delete',
    accept: () => {
      this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      const metricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'audience', action: 'delete' });
      let metricText = null;
      if (audience.audienceSourceType === 'Online')
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
      
      if (audience.audienceSourceType === 'Offline')
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~Offline~${this.appStateService.analysisLevel$.getValue()}` ;    
      
      if (audience.audienceSourceType === 'Custom')
          metricText = `CUSTOM~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;        

     // console.log('test metricText::::', metricText);     

      this.usageService.createCounterMetric(metricName, metricText, null);

      this.varService.applyAudienceSelection();
    },
    reject: () => {
    }
   });


  }

  private clearSelectedFields(){
    this.varService.getAudiences().forEach(audience => {
      this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
    });
    this.varService.applyAudienceSelection();
      
  }

  public onMoveUp(audience: AudienceDataDefinition) {
    this.varService.moveAudienceUp(audience);
  }
}
