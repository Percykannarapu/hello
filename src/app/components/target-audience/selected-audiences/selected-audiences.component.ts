import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { SelectItem } from 'primeng/primeng';
import { AppRendererService, SmartMappingTheme } from '../../../services/app-renderer.service';
import { UsageService } from '../../../services/usage.service';
import { ImpMetricName } from '../../../val-modules/metrics/models/ImpMetricName';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { map, take, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { MetricService } from '../../../val-modules/common/services/metric.service';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';

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
    private confirmationService: ConfirmationService) {
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
    const sub = this.varService.audiences$.pipe(
      map(audiences => audiences.length > 0)
    ).subscribe(res => this.hasAudiences = res, null, () => {
      if (sub) sub.unsubscribe();
    });
  }

  public onApplyClicked() {
    const audiences = this.varService.getAudiences();
    const mappedAudience = audiences.find(a => a.showOnMap === true);
    if (mappedAudience != null) {

      const analysisLevel = this.appStateService.analysisLevel$.getValue();
      const variableId = mappedAudience.audienceName == null ? 'custom' : mappedAudience.audienceIdentifier;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'map', target: 'thematic-shading', action: 'activated' });
      let metricText = null;
      if (mappedAudience.audienceSourceType === 'Custom'){
        metricText = 'CUSTOM' + '~' + mappedAudience.audienceName + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
      }
      else{
         metricText = variableId + '~' + mappedAudience.audienceName + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
      }

      this.usageService.createCounterMetric(usageMetricName, metricText, 1);

      // const counterMetricsDiscover = this.discoService.discoveryUsageMetricsCreate('map-thematic-shading-activated');
      // const counterMetricsColorBox = this.metricService.colorboxUsageMetricsCreate('map-thematic-shading-activated');
      // this.usageService.creategaugeMetrics(counterMetricsDiscover);
      // this.usageService.creategaugeMetrics(counterMetricsColorBox);
      // this.usageService.createCounterMetrics(counterMetricsDiscover);
      // this.usageService.createCounterMetrics(counterMetricsColorBox);
    }
    this.varService.applyAudienceSelection();
  }

  public onThemeChange(event: { value: SmartMappingTheme }) : void {
    console.log(event);
    AppRendererService.currentDefaultTheme = event.value;
    this.currentTheme = event.value.toString();
  }

  onMapSelected(audience: AudienceDataDefinition) : void {
    this.showRenderControls = audience.showOnMap;
    this.audiences$.pipe(
      map(all => all.filter(a => a.audienceIdentifier !== audience.audienceIdentifier)),
      tap(unMapped => unMapped.forEach(a => a.showOnMap = false)),
      take(1)
    ).subscribe(() => null); // with take(1), this subscription will immediately close
  }

  onNationalSelected(audience: AudienceDataDefinition) : void {
    this.showRenderControls = audience.showOnMap;
    this.audiences$.pipe(
      map(all => all.filter(a => a.audienceIdentifier !== audience.audienceIdentifier)),
      tap(unMapped => unMapped.forEach(a => a.exportNationally = false)),
      take(1)
    ).subscribe(() => null); // with take(1), this subscription will immediately close
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

      this.varService.applyAudienceSelection();
    },
    reject: () => {
    }
   });


  }
}
