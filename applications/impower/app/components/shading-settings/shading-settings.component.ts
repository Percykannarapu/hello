import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { deleteShadingDefinition, shadingSelectors, upsertShadingDefinition } from '@val/esri';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Audience } from '../../impower-datastore/state/transient/audience/audience.model';
import { GetAllMappedVariables } from '../../impower-datastore/state/transient/transient.actions';
import { GfpShaderKeys } from '../../models/ui-enums';
import { AppRendererService } from '../../services/app-renderer.service';
import { FullAppState } from '../../state/app.interfaces';
import { resetNamedForm, updateNamedForm } from '../../state/forms/forms.actions';
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
          return [ ...defs, this.currentNewShader as any];
        }
        return defs;
      })
    );
    this.locationCount$ = this.appStateService.clientLocationCount$;
    this.tradeAreaCount$ = this.appStateService.tradeAreaCount$;
  }

  deleteDefinition(id: string) : void {
    if (id == null) return;
    if (this.currentNewShader != null && id === this.currentNewShader.id) {
      this.addNewDefinition(null);
    } else {
      this.store$.dispatch(deleteShadingDefinition({ id }));
    }
  }

  applyDefinition(definition: UIShadingDefinition) : void {
    const geos = this.impGeoDatastore.get().filter(g => g.impGeofootprintLocation && g.impGeofootprintLocation.isActive && g.impGeofootprintTradeArea && g.impGeofootprintTradeArea.isActive && g.isActive);
    let analysisLevel = definition.usableAnalysisLevel;
    if (analysisLevel == null) {
      analysisLevel = this.appStateService.analysisLevel$.getValue();
    }
    this.currentNewShader = null;
    this.appRenderService.updateForAnalysisLevel(definition, analysisLevel);
    switch (definition.dataKey) {
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(definition, geos);
        this.appRenderService.registerOwnerSiteWatcher();
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(definition, geos);
        this.appRenderService.registerOwnerTAWatcher();
        break;
    }
    const trimmedDef = { ...definition };
    delete trimmedDef.isNew;
    delete trimmedDef.isEditing;
    delete trimmedDef.usableAnalysisLevel;
    this.store$.dispatch(upsertShadingDefinition({ shadingDefinition: trimmedDef }));
    setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel })), 1000);
  }

  addNewDefinition(formData: Partial<UIShadingDefinition>) : void {
    this.currentNewShader = formData;
    this.trigger$.next(null);
    this.editShader(formData);
  }

  editShader(formData: Partial<UIShadingDefinition>) : void {
    this.store$.dispatch(resetNamedForm({ path: 'shadingSettings' }));
    if (formData != null) {
      this.store$.dispatch(updateNamedForm({ path: 'shadingSettings', formData }));
    }
  }
}
