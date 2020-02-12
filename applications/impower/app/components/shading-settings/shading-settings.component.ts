import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { deleteShadingDefinition, shadingSelectors, updateShadingDefinitions, upsertShadingDefinition } from '@val/esri';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { Audience } from '../../impower-datastore/state/transient/audience/audience.model';
import { GetAllMappedVariables } from '../../impower-datastore/state/transient/transient.actions';
import { GfpShaderKeys } from '../../models/ui-enums';
import { AppRendererService } from '../../services/app-renderer.service';
import { FullAppState } from '../../state/app.interfaces';
import { removeNestedForm, resetNestedForm, updateNestedForm } from '../../state/forms/forms.actions';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { UIShadingDefinition } from './shading-ui-helpers';

@Component({
  selector: 'val-shading-settings',
  templateUrl: './shading-settings.component.html',
  styleUrls: ['./shading-settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShadingSettingsComponent implements OnInit {
  sideNavVisible = false;
  currentNewShader: Partial<UIShadingDefinition> = null;

  shadingDefinitions$: Observable<UIShadingDefinition[]>;
  audiences$: Observable<Audience[]>;
  analysisLevel$: Observable<string>;
  locationCount$: Observable<number>;
  tradeAreaCount$: Observable<number>;

  private trigger$ = new BehaviorSubject(null);
  private currentDefinitions$: BehaviorSubject<UIShadingDefinition[]> = new BehaviorSubject<UIShadingDefinition[]>([]);

  constructor(private appStateService: AppStateService,
              private appRenderService: AppRendererService,
              private impGeoDatastore: ImpGeofootprintGeoService,
              private store$: Store<FullAppState>) {}

  ngOnInit() : void {
    this.analysisLevel$ = this.appStateService.analysisLevel$;
    this.audiences$ = this.store$.select(fromAudienceSelectors.allAudiences).pipe(
      filter(audiences => audiences != null),
      map(activeAudiences => activeAudiences.filter(aud => aud.audienceSourceType !== 'Combined'))
    );
    this.shadingDefinitions$ = combineLatest([this.store$.select(shadingSelectors.allLayerDefs), this.trigger$]).pipe(
      filter(([defs]) => defs != null),
      map(([defs]) => {
        if (this.currentNewShader != null) {
          return [ ...defs.map(d => ({ ...d, isOpenInUI: false })), this.currentNewShader as any];
        }
        return defs;
      }),
      tap(defs => this.currentDefinitions$.next(defs))
    );
    this.locationCount$ = this.appStateService.clientLocationCount$;
    this.tradeAreaCount$ = this.appStateService.tradeAreaCount$;
  }

  deleteDefinition(id: string) : void {
    if (id == null) return;
    if (this.currentNewShader != null && id === this.currentNewShader.id) {
      this.currentNewShader = null;
      this.trigger$.next(null);
    } else {
      this.store$.dispatch(deleteShadingDefinition({ id }));
    }
    this.store$.dispatch(removeNestedForm({ root: 'shadingSettings', identifier: id }));
  }

  applyDefinition(definition: UIShadingDefinition, resetUiVisibilityFlags: boolean) : void {
    const geos = this.impGeoDatastore.get().filter(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive && g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive && g.isActive && g.isDeduped === 1);
    let analysisLevel = definition.usableAnalysisLevel;
    if (analysisLevel == null) {
      analysisLevel = this.appStateService.analysisLevel$.getValue();
    }
    const trimmedDef: UIShadingDefinition = { ...definition };
    this.currentNewShader = null;
    this.trigger$.next(null);
    this.store$.dispatch(removeNestedForm({ root: 'shadingSettings', identifier: trimmedDef.id }));
    this.appRenderService.updateForAnalysisLevel(trimmedDef, analysisLevel);
    switch (trimmedDef.dataKey) {
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(trimmedDef, geos);
        this.appRenderService.registerGeoOwnerWatcher();
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(trimmedDef, geos);
        this.appRenderService.registerGeoOwnerWatcher();
        break;
    }
    delete trimmedDef.isNew;
    delete trimmedDef.isEditing;
    delete trimmedDef.usableAnalysisLevel;
    // we purposefully keep the isOpenInUI flag to persist the accordion state
    this.store$.dispatch(upsertShadingDefinition({ shadingDefinition: trimmedDef }));
    if (resetUiVisibilityFlags) {
      const otherDefs = this.currentDefinitions$.value.filter(d => d.id !== trimmedDef.id);
      const updates: any = otherDefs.map(d => ({ id: d.id, changes: { isOpenInUI: false }}));
      this.store$.dispatch(updateShadingDefinitions({ shadingDefinitions: updates }));
    }
    setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel })), 1000);
  }

  addNewDefinition(formData: Partial<UIShadingDefinition>) : void {
    this.currentNewShader = formData;
    this.trigger$.next(null);
    this.editShader(formData);
  }

  editShader(formData: Partial<UIShadingDefinition>) : void {
    this.store$.dispatch(resetNestedForm({ root: 'shadingSettings', identifier: formData.id }));
    this.store$.dispatch(updateNestedForm({ root: 'shadingSettings', identifier: formData.id, formData }));
  }
}
