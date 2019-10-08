import { Component, OnInit } from '@angular/core';
import { AppStateService } from 'app/services/app-state.service';
import { SelectItem } from 'primeng/api';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { LocalAppState } from '../../state/app.interfaces';
import { Store } from '@ngrx/store';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { SelectMappingAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { AppRendererService } from 'app/services/app-renderer.service';
import { ColorPalette } from '@val/esri';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'val-shading-settings',
  templateUrl: './shading-settings.component.html',
  styleUrls: ['./shading-settings.component.scss']
})
export class ShadingSettingsComponent implements OnInit {
  sideNavVisible = false; 
  checkedAudienceList: SelectItem[];
  selectedAudience: Audience;
  audiences$: Observable<Audience[]>;
  showRenderControls: boolean = false;

  allThemes: SelectItem[] = [];
  currentTheme: string;

  shadedVaiableonMap: SelectItem[] = [];
  selectedVariable: string = 'Choose Thematic Extent';


  constructor(private appStateService: AppStateService,
    private varService: TargetAudienceService,
    private store$: Store<LocalAppState>) {
    this.appStateService.audienceSideBar$.subscribe(flag => this.sideNavVisible = flag);
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

    this.shadedVaiableonMap.push({label: 'Selected Geos only', value: 'Selected Geos only'});
    this.shadedVaiableonMap.push({label: 'Whole Map', value: 'Whole Map'});
   }

  ngOnInit() : void {
    this.store$.select(fromAudienceSelectors.allAudiences).subscribe(audiences => {
        this.checkedAudienceList = [];
        audiences.forEach(aud => this.checkedAudienceList.push({label: `${aud.audienceSourceName}: ${aud.audienceName}`, value: aud}));
    });

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready)
    ).subscribe(() => {
      this.onLoadProject();
    });
  }

  private onLoadProject() {
    let showRender = false;
    this.varService.allAudiencesBS$.getValue().forEach(audience => {
      if (audience.showOnMap) {
        showRender = true;
        this.selectedAudience = audience;
      }
    });
    this.showRenderControls = showRender;
  }

  onChangeAudience(){
    console.log('selected value', this.selectedAudience);
  }

  public onThemeChange(event: { value: ColorPalette }) : void {
    AppRendererService.currentDefaultTheme = event.value;
  }

  applyShading(){
    this.selectedAudience.showOnMap = true;
    this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: this.selectedAudience.audienceIdentifier, isActive: this.selectedAudience.showOnMap }));
    // Sync all project vars with audiences because multiple audiences are modified with SelectMappingAudience
    this.varService.syncProjectVars();
    this.showRenderControls = this.selectedAudience.showOnMap;
  }

}
