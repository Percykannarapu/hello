import {Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Store} from '@ngrx/store';
import {AnyFn} from '@ngrx/store/src/selector';
import {ColorPalette, ClearRenderingData, EsriMapService, EsriUtils, EsriApi} from '@val/esri';
import {SelectMappingAudience} from 'app/impower-datastore/state/transient/audience/audience.actions';
import {Audience} from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import {AppProjectPrefService} from 'app/services/app-project-pref.service';
import {AppRendererService} from 'app/services/app-renderer.service';
import {AppStateService} from 'app/services/app-state.service';
import {TargetAudienceService} from 'app/services/target-audience.service';
import {SelectItem} from 'primeng/api';
import {Observable} from 'rxjs';
import {filter, withLatestFrom} from 'rxjs/operators';
import {ClearMapVars} from '../../impower-datastore/state/transient/map-vars/map-vars.actions';
import {LocalAppState} from '../../state/app.interfaces';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { mapBy } from '@val/common';

@Component({
  selector: 'val-shading-settings',
  templateUrl: './shading-settings.component.html',
  styleUrls: ['./shading-settings.component.scss'],
  encapsulation: ViewEncapsulation.None
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
      const audinecesNames = mapBy(this.checkedAudienceList, 'label');
      audiences.forEach(aud => {
        if (!audinecesNames.has(`${aud.audienceSourceName}: ${aud.audienceName}`)){
          this.checkedAudienceList.push({label: `${aud.audienceSourceName}: ${aud.audienceName}`, value: aud});
        }
      });
    });

    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      withLatestFrom(this.varService.allAudiencesBS$)
    ).subscribe(([, audiences]) => this.onLoadProject(audiences) );

    this.shadeSettingsForm = this.fb.group({
      audience: ['', Validators.required],
      variable: ['Whole Map', ],
      currentTheme: [AppRendererService.currentDefaultTheme, Validators.required],
    });
    this.appStateService.clearUI$.subscribe(() => this.shadeSettingsForm.reset());
  }

  private onLoadProject(allAudiences: Audience[]) {
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

    this.store$.dispatch(new ClearRenderingData());
    let showRender = false;
    const activeAudiences = allAudiences.filter(audience => audience.showOnMap);
    if (activeAudiences.length > 0){
        showRender = true;
        const theme = this.appProjectPrefService.getPref('Theme').val;
        this.shadeSettingsForm.controls['audience'].setValue(activeAudiences[0]);
        this.shadeSettingsForm.controls['currentTheme'].setValue(ColorPalette[theme]);
        this.shadeSettingsForm.controls['variable'].setValue(this.appProjectPrefService.getPref('Thematic-Extent').val);
        AppRendererService.currentDefaultTheme = ColorPalette[theme];
        //this.applyAudience(activeAudiences[0]);
    }
    else if (allAudiences.length > 0 && this.appProjectPrefService.getPref('audience') != null){
      const audienceName = this.appProjectPrefService.getPref('audience').val;
      const theme = this.appProjectPrefService.getPref('Theme').val;
      const inActiveAudiences = this.varService.allAudiencesBS$.getValue().filter(aud => `${aud.audienceSourceName}: ${aud.audienceName}` === audienceName);
      this.shadeSettingsForm.controls['audience'].setValue(inActiveAudiences[0]);
      this.shadeSettingsForm.controls['currentTheme'].setValue(ColorPalette[theme]);
      this.shadeSettingsForm.controls['variable'].setValue(this.appProjectPrefService.getPref('Thematic-Extent').val);
      AppRendererService.currentDefaultTheme = ColorPalette[theme];
    }
    else{
      this.shadeSettingsForm.controls['currentTheme'].setValue(AppRendererService.currentDefaultTheme);
      this.shadeSettingsForm.controls['variable'].setValue('Whole Map');
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
    this.store$.dispatch(new ClearMapVars());
    this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: aud.audienceIdentifier, isActive: aud.showOnMap }));
    // Sync all project vars with audiences because multiple audiences are modified with SelectMappingAudience
    this.varService.syncProjectVars();
    this.showRenderControls = aud.showOnMap;
    this.sideNavVisible = false;

    const keys = Object.keys(ColorPalette).filter(x => ColorPalette[x] == AppRendererService.currentDefaultTheme);

    this.appProjectPrefService.createPref('map-settings', 'Thematic-Extent', this.shadeSettingsForm.controls['variable'].value, 'string');
    this.appProjectPrefService.createPref('map-settings', 'Theme', keys[0], 'string');
  }
}
