import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { SelectItem } from 'primeng/primeng';
import { AppRendererService } from '../../../services/app-renderer.service';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { map, take, filter } from 'rxjs/operators';
import { Observable, BehaviorSubject } from 'rxjs';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { WarningNotification } from '@val/messaging';
import { CreateAudienceUsageMetric, CreateMapUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { CreateGaugeMetric } from '../../../state/usage/usage.actions';
import { ColorPalette } from '@val/esri';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { MoveAudienceUp, MoveAudienceDn, SelectMappingAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { AppLoggingService } from 'app/services/app-logging.service';

@Component({
  selector: 'val-selected-audiences',
  templateUrl: './selected-audiences.component.html',
  styleUrls: ['./selected-audiences.component.css']
})
export class SelectedAudiencesComponent implements OnInit {
  audiences$: Observable<Audience[]>;
  showRenderControls: boolean = false;
  hasAudiences: boolean = false;
  allThemes: SelectItem[] = [];
  currentTheme: string;
  public showDialog: boolean = false;
  public audienceUnselect: Audience;

  private nationalAudiencesBS$ = new BehaviorSubject<Audience[]>([]);

  constructor(private varService: TargetAudienceService,
              private appStateService: AppStateService,
              private confirmationService: ConfirmationService,
              private logger: AppLoggingService,
              private store$: Store<LocalAppState>) {
    // this is how you convert an enum into a list of drop-down values
    const allThemes = ColorPalette;
    const keys = Object.keys(allThemes);
    for (const key of keys) {
      this.allThemes.push({
        label: allThemes[key],
        value: allThemes[key]
      });
    }
    this.allThemes.sort((a, b) => a.label.localeCompare(b.label));
    this.currentTheme = AppRendererService.currentDefaultTheme;
    this.store$.select(fromAudienceSelectors.getAudiencesNationalExtract).subscribe(this.nationalAudiencesBS$);
  }

  public ngOnInit() : void {
    // Setup an observable to watch the store for audiences
    this.audiences$ = this.store$.select(fromAudienceSelectors.allAudiences);

    const storeSub = this.store$.select(fromAudienceSelectors.allAudiences)
      .pipe(map(audiences => audiences.length > 0))
      .subscribe(res => this.hasAudiences = res, null, () => {
        if (storeSub) storeSub.unsubscribe();
      });

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready)
    ).subscribe(() => {
      this.onLoadProject();
    });
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
    this.logger.debug.log('mappedAudience:::', mappedAudience);
    if (mappedAudience != null) {
      const analysisLevel = this.appStateService.analysisLevel$.getValue();
      const variableId = mappedAudience.audienceName == null ? 'custom' : mappedAudience.audienceIdentifier;
      let metricText = null;
      if (mappedAudience.audienceSourceType === 'Custom') {
        metricText = 'CUSTOM' + '~' + mappedAudience.audienceName + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
      } else {
         metricText = variableId + '~' + mappedAudience.audienceName.replace('~', ':') + '~' + mappedAudience.audienceSourceName + '~' + analysisLevel + '~' + 'Theme=' + this.currentTheme;
         metricText = metricText + (mappedAudience.allowNationalExport ? `~IndexBase=${mappedAudience.selectedDataSet}` : '');
      }
      this.store$.dispatch(new CreateMapUsageMetric('thematic-shading', 'activated', metricText));
      this.store$.dispatch(new CreateGaugeMetric({ gaugeAction: 'map-thematic-shading-activated'}));
    }
    if (this.appStateService.analysisLevel$.getValue() == null || this.appStateService.analysisLevel$.getValue().length === 0) {
      this.store$.dispatch(new WarningNotification({ message: 'You must select an Analysis Level in order to apply the selected audience variable(s)', notificationTitle: 'Apply Selected Audience' }));
      return;
    }
    this.varService.applyAudienceSelection();
  }

  public onThemeChange(event: { value: ColorPalette }) : void {
    AppRendererService.currentDefaultTheme = event.value;
  }

  public closeDialog(){
    this.audiences$.pipe(
         map(all => all.filter(a => a.audienceIdentifier === this.audienceUnselect.audienceIdentifier)),
         take(1),
     ).subscribe(unMapped => unMapped.forEach(a => {
      a.exportNationally = false;
      this.varService.updateProjectVars(a);
         }));

    this.showDialog = false;
  }

  onMapSelected(audience: Audience) : void {
    this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: audience.audienceIdentifier, isActive: audience.showOnMap }));
    // Sync all project vars with audiences because multiple audiences are modified with SelectMappingAudience
    this.varService.syncProjectVars();
    this.showRenderControls = audience.showOnMap;
    //this.varService.updateProjectVars(audience, false);
    // this.audiences$.pipe(
    //   map(all => all.filter(a => a.audienceIdentifier !== audience.audienceIdentifier)),
    //   take(1),
    // ).subscribe(unMapped => unMapped.forEach(a => a.showOnMap = false)); // with take(1), this subscription will immediately close
  }

  onShowGridSelected(audience: Audience) : void {
    this.varService.updateProjectVars(audience);
    this.audiences$.pipe(
      map(a => a.filter(a2 => a2.audienceIdentifier === audience.audienceIdentifier)),
      take(1),
    ).subscribe(selected => selected[0].showOnGrid = audience.showOnGrid);
  }

  onExportInGeoFootprintSelected(audience: Audience) : void {
    this.varService.updateProjectVars(audience);
    this.audiences$.pipe(
      map(a => a.filter(a2 => a2.audienceIdentifier === audience.audienceIdentifier)),
      take(1),
    ).subscribe(selected => selected[0].exportInGeoFootprint = audience.exportInGeoFootprint);
   }

  onNationalSelected(audience: Audience) : void {
    //const audiences = Array.from(this.varService.audienceMap.values()).filter(a => a.exportNationally === true);
    this.varService.updateProjectVars(audience);

    if (this.nationalAudiencesBS$.value.length > 5) {
      this.audienceUnselect = audience;
      this.showDialog = true;
    }
  }

  onIndexBaseChange(audience: Audience) : void {
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
      this.store$.dispatch(new RemoveVar({varPk: audience.audienceIdentifier}));

      let metricText = null;
      switch (audience.audienceSourceType) {
        case 'Custom':
          metricText = `CUSTOM~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}`;
          break;
        case 'Offline':
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~Offline~${this.appStateService.analysisLevel$.getValue()}` ;
          break;
        case 'Online':
          metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
          break;
      }
      this.store$.dispatch(new CreateAudienceUsageMetric('audience', 'delete', metricText));
      this.varService.applyAudienceSelection();
    },
    reject: () => {}
   });
  }

  private clearSelectedFields(){
    this.varService.getAudiences().forEach(audience => {
      this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
      this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
    });
    this.varService.applyAudienceSelection();
  }

  public onMoveUp(audience: Audience) {
    this.store$.dispatch(new MoveAudienceUp({ audienceIdentifier: audience.audienceIdentifier }));
    this.varService.syncProjectVars();
  }

  public onMoveDn(audience: Audience) {
    this.store$.dispatch(new MoveAudienceDn({ audienceIdentifier: audience.audienceIdentifier }));
    this.varService.syncProjectVars();
  }
}
