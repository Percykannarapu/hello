import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { AppStateService } from 'app/services/app-state.service';
import { SelectItem } from 'primeng/api';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { Observable, BehaviorSubject } from 'rxjs';
import { LocalAppState, FullAppState } from '../../state/app.interfaces';
import { Store, select } from '@ngrx/store';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { SelectMappingAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { AppRendererService } from 'app/services/app-renderer.service';
import { ColorPalette, selectors } from '@val/esri';
import { filter, take } from 'rxjs/operators';
import { AudienceDataDefinition } from 'app/models/audience-data.model';
import { AnyFn } from '@ngrx/store/src/selector';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';

@Component({
  selector: 'val-shading-settings',
  templateUrl: './shading-settings.component.html',
  styleUrls: ['./shading-settings.component.scss']
})
export class ShadingSettingsComponent implements OnInit, OnChanges {
  sideNavVisible = false; 
  checkedAudienceList: SelectItem[] = [];
  audiences$: Observable<Audience[]>;
  showRenderControls: boolean = false;

  allThemes: SelectItem[] = [];

  shadedVaiableonMap: SelectItem[] = [];
  

  @Input() displayData: AnyFn;

  @Input() oldData: any;

  shadeSettingsForm: FormGroup;


  constructor(private appStateService: AppStateService,
    private varService: TargetAudienceService,
    private store$: Store<LocalAppState>,
    private fullState$: Store<FullAppState>,
    private appProjectPrefService: AppProjectPrefService,
    private fb: FormBuilder) {
    
    const allThemes = ColorPalette;
    const keys = Object.keys(allThemes);
    for (const key of keys) {
      this.allThemes.push({
        label: allThemes[key],
        value: allThemes[key]
      });
    }
    this.allThemes.sort((a, b) => a.label.localeCompare(b.label));
    //this.currentTheme = AppRendererService.currentDefaultTheme;

    this.shadedVaiableonMap.push({label: 'Selected Geos only', value: 'Selected Geos only'});
    this.shadedVaiableonMap.push({label: 'Whole Map', value: 'Whole Map'});
   }

   ngOnChanges(change: SimpleChanges) {
    if  (this.displayData) {
      this.shadeSettingsForm.reset();
      this.shadeSettingsForm.patchValue(this.displayData);
    }
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

    this.shadeSettingsForm = this.fb.group({
      audience: ['', Validators.required],
      variable: ['Selected Geos only', Validators.required],
      currentTheme: [AppRendererService.currentDefaultTheme, Validators.required],
    });
    this.appStateService.clearUI$.subscribe(() => this.shadeSettingsForm.reset());
    
    this.fullState$.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => this.appStateService.audienceSideBar$.subscribe(flag => this.sideNavVisible = flag));
  }

  private onLoadProject() {
    let showRender = false;
   /* this.varService.allAudiencesBS$.getValue().forEach(audience => {
      if (audience.showOnMap) {
        showRender = true;
        this.shadeSettingsForm.controls['audience'].setValue(audience);
      }
      this.shadeSettingsForm.controls['currentTheme'].setValue(this.appProjectPrefService.getPref('Theme').val);
      this.shadeSettingsForm.controls['variable'].setValue(this.appProjectPrefService.getPref('Thematic-Extent').val);
    });*/
    const allAudiences  = this.varService.allAudiencesBS$.getValue();
    const activeAudiences = allAudiences.filter(audience => audience.showOnMap);
    if (activeAudiences.length > 0){
        showRender = true;
        this.shadeSettingsForm.controls['audience'].setValue(activeAudiences[0]);
        this.shadeSettingsForm.controls['currentTheme'].setValue(this.appProjectPrefService.getPref('Theme').val);
        this.shadeSettingsForm.controls['variable'].setValue(this.appProjectPrefService.getPref('Thematic-Extent').val);
    }
    else if (allAudiences.length > 0){
      const audienceName = this.appProjectPrefService.getPref('audience').val;
      const inActiveAudiences = this.varService.allAudiencesBS$.getValue().filter(aud => `${aud.audienceSourceName}: ${aud.audienceName}` === audienceName);
      this.shadeSettingsForm.controls['audience'].setValue(inActiveAudiences[0]);
      this.shadeSettingsForm.controls['currentTheme'].setValue(this.appProjectPrefService.getPref('Theme').val);
      this.shadeSettingsForm.controls['variable'].setValue(this.appProjectPrefService.getPref('Thematic-Extent').val);
    }
    this.showRenderControls = showRender;
  }

  cancelDialog() {
    this.shadeSettingsForm.reset();
  }

  clearShading(event: any) {
    this.shadeSettingsForm.controls['audience'].value.showOnMap = false;
    const aud = this.shadeSettingsForm.controls['audience'].value;
    this.appProjectPrefService.createPref('map-settings', 'audience', `${aud.audienceSourceName}: ${aud.audienceName}`, 'string');
    /*this.shadeSettingsForm.reset();
    this.shadeSettingsForm.controls['variable'].setValue('Selected Geos only');
    this.shadeSettingsForm.controls['currentTheme'].setValue(AppRendererService.currentDefaultTheme);*/
    
    this.applyAudience(this.shadeSettingsForm.controls['audience'].value);

  }

  public onThemeChange(event: { value: ColorPalette }) : void {
    AppRendererService.currentDefaultTheme = event.value;
    //this.currentTheme = event.value;
  }

  onSubmit(data: any){
    data.audience.showOnMap = true;
    this.applyAudience(data.audience);
  }

  applyAudience(aud: Audience){
    
    this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: aud.audienceIdentifier, isActive: aud.showOnMap }));
    // Sync all project vars with audiences because multiple audiences are modified with SelectMappingAudience
    this.varService.syncProjectVars();
    this.showRenderControls = aud.showOnMap;
    this.sideNavVisible = false;

    this.appProjectPrefService.createPref('map-settings', 'Thematic-Extent', this.shadeSettingsForm.controls['variable'].value, 'string');
    this.appProjectPrefService.createPref('map-settings', 'Theme', this.shadeSettingsForm.controls['currentTheme'].value, 'string');

  }
}
