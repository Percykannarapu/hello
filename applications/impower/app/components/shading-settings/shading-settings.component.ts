import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ColorPalette, EsriApi, EsriMapService } from '@val/esri';
import { SelectMappingAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AudienceDataDefinition } from 'app/models/audience-data.model';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';
import { AppRendererService } from 'app/services/app-renderer.service';
import { AppStateService } from 'app/services/app-state.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { ClearMapVars } from '../../impower-datastore/state/transient/map-vars/map-vars.actions';
import { LocalAppState } from '../../state/app.interfaces';
import { SetLegacyRenderingEnable, SetPalette } from '../../state/rendering/rendering.actions';
import { getCurrentColorPalette } from '../../state/rendering/rendering.selectors';

@Component({
  selector: 'val-shading-settings',
  templateUrl: './shading-settings.component.html',
  styleUrls: ['./shading-settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShadingSettingsComponent implements OnInit {
  private static readonly defaultPalette = ColorPalette.EsriPurple;
  // private static readonly defaultExtent = 'Whole Map';

  sideNavVisible = false;
  allAudiences$: Observable<SelectItem[]>;
  allThemes: SelectItem[] = [];
  shadedVariableOnMap: SelectItem[] = [];
  shadeSettingsForm: FormGroup;

  constructor(private appStateService: AppStateService,
              private rendererService: AppRendererService,
              private varService: TargetAudienceService,
              private store$: Store<LocalAppState>,
              private appProjectPrefService: AppProjectPrefService,
              private mapService: EsriMapService,
              private fb: FormBuilder) {

    const allThemes = ColorPalette;
    const keys = Object.keys(allThemes);
    for (const key of keys) {
      this.allThemes.push({
        label: allThemes[key],
        value: allThemes[key]
      });
    }
    this.shadedVariableOnMap.push({label: 'Whole Map', value: 'Whole Map'});
    this.shadedVariableOnMap.push({label: 'Selected Geos only', value: 'Selected Geos only'});
  }

  ngOnInit() : void {
    this.allAudiences$ = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      map(activeAudiences => activeAudiences.filter(aud => aud.audienceSourceType !== 'Combined')),
      map(audiences => audiences.map(aud => ({label: `${aud.audienceSourceName}: ${aud.audienceName}`, value: aud.audienceIdentifier}))),
      tap(() => this.shadeSettingsForm.updateValueAndValidity())
    );
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      withLatestFrom(this.varService.allAudiencesBS$, this.store$.select(getCurrentColorPalette))
    ).subscribe(([, audiences, palette]) => this.onLoadProject(audiences, palette) );

    this.shadeSettingsForm = this.fb.group({
      audience: [null, Validators.required],
      //audience: new FormControl('', {asyncValidators: this.validateAudience()}),
      // variable: [ShadingSettingsComponent.defaultExtent, Validators.required],
      currentTheme: [ShadingSettingsComponent.defaultPalette, Validators.required],
    });
    this.appStateService.clearUI$.subscribe(() => this.resetFormToDefaults());

    this.varService.deletedAudiences$.subscribe(result => this.resetFormOnDeleteAudience(result));

  }

  private onLoadProject(allAudiences: Audience[], palette: ColorPalette) {
    if (this.appProjectPrefService.getPref('basemap') != null && this.appProjectPrefService.getPref('basemap').val != null){
      const savedBaseMap = JSON.parse(this.appProjectPrefService.getPref('basemap').val);
      this.mapService.widgetMap.get('esri.widgets.BasemapGallery').set('activeBasemap',  EsriApi.BaseMap.fromJSON(savedBaseMap));
    }
    else{
      const value: any = this.mapService.widgetMap.get('esri.widgets.BasemapGallery').get('source');
      const basMapList: any[] = value.basemaps.items;
      const baseMap: __esri.Basemap = basMapList.filter(bmap => bmap.id === 'streets-vector')[0];
      this.mapService.widgetMap.get('esri.widgets.BasemapGallery').set('activeBasemap', baseMap);
      this.appProjectPrefService.createPref('legend-settings', 'basemap', JSON.stringify(baseMap.toJSON()), 'string');
    }
    const activeAudience = allAudiences.filter(a => a.showOnMap)[0] || null;
    // const extentPref = this.appProjectPrefService.getPref('Thematic-Extent');
    // const extentSetting = extentPref == null ? ShadingSettingsComponent.defaultExtent : extentPref.val;

    this.shadeSettingsForm.controls['audience'].setValue(activeAudience == null ? null : activeAudience.audienceIdentifier, { emitEvent: false });
    this.shadeSettingsForm.controls['currentTheme'].setValue(palette, { emitEvent: false });
    // this.shadeSettingsForm.controls['variable'].setValue(extentSetting, { emitEvent: false });
    this.shadeSettingsForm.markAsPristine();
  }

  clearShading() {
    this.applyAudience(false);
    this.resetFormToDefaults();
  }

  onSubmit() {
    if (this.varService.allAudiencesBS$.value.length > 0)
    this.applyAudience(true);
  }

  applyAudience(showOnMap: boolean) : void {
    //const aud = this.shadeSettingsForm.controls['audience'].value as Audience;
    const aud = this.varService.allAudiencesBS$.value.filter(audience => this.shadeSettingsForm.controls['audience'].value === audience.audienceIdentifier)[0];
    aud.showOnMap = showOnMap;
    const palette: ColorPalette = this.shadeSettingsForm.controls['currentTheme'].value;
    // this.rendererService.audienceShading(aud);
    this.store$.dispatch(new ClearMapVars());
    this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: aud.audienceIdentifier, isActive: aud.showOnMap }));
    this.store$.dispatch(new SetPalette({ palette }));
    this.store$.dispatch(new SetLegacyRenderingEnable({ isEnabled: showOnMap }));
    // Sync all project vars with audiences because multiple audiences are modified with SelectMappingAudience
    this.varService.syncProjectVars();

    const paletteKey = Object.keys(ColorPalette).filter(p => ColorPalette[p] === palette)[0];
    // this.appProjectPrefService.createPref('map-settings', 'Thematic-Extent', this.shadeSettingsForm.controls['variable'].value, 'string');
    this.appProjectPrefService.createPref('map-settings', 'Theme', paletteKey, 'string');
    this.appProjectPrefService.createPref('map-settings', 'audience', `${aud.audienceSourceName}: ${aud.audienceName}`, 'string');
    this.sideNavVisible = false;
  }

  private resetFormToDefaults() {
    this.shadeSettingsForm.reset({
      audience: null,
      currentTheme: ShadingSettingsComponent.defaultPalette
    }, { emitEvent: false });
    this.shadeSettingsForm.markAsPristine();
  }

  public hasErrors(controlKey: string) : boolean{

    if (this.shadeSettingsForm != null){
      const control = this.shadeSettingsForm.get(controlKey);
      return (control.dirty || control.touched) && (control.errors != null);
    }
    /*if (this.varService.allAudiencesBS$.value.filter(aud => aud.showOnMap).length > 0){
      this.shadeSettingsForm.setErrors({error: 'error'});
      return true;
    }
    else return false;*/
  }

  public resetFormOnDeleteAudience(audiences: AudienceDataDefinition[]){
    if (audiences.filter(aud => aud.audienceIdentifier === this.shadeSettingsForm.get('audience').value).length > 0){
      this.shadeSettingsForm.get('audience').setValue(null);
    }
  }
}
