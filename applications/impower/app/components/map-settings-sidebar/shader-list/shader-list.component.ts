import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { duplicateShadingDefinition, EsriShadingService, isArcadeCapableShadingDefinition, ShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { OfflineAudienceDefinition } from '../../../models/audience-categories.model';
import { createOfflineAudienceInstance } from '../../../models/audience-factories';
import { GfpShaderKeys } from '../../../models/ui-enums';
import { AppLocationService } from '../../../services/app-location.service';
import { AppRendererService } from '../../../services/app-renderer.service';
import { UnifiedAudienceDefinitionService } from '../../../services/unified-audience-definition.service';
import { UnifiedAudienceService } from '../../../services/unified-audience.service';
import { FullAppState } from '../../../state/app.interfaces';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeArea } from '../../../val-modules/targeting/models/ImpGeofootprintTradeArea';

@Component({
  selector: 'val-shader-list',
  templateUrl: './shader-list.component.html'
})
export class ShaderListComponent implements OnInit, OnDestroy {

  @Input() currentAnalysisLevel: string;
  @Input() tradeAreaCount: number;
  @Input() locationCount: number;
  @Input() audiences: Audience[];
  @Input() geos: ImpGeofootprintGeo[];
  @Input() tradeAreas: ImpGeofootprintTradeArea[];

  @Input() shadingDefinitions: ShadingDefinition[];

  currentOpenId: string;

  shadingTypes = GfpShaderKeys;
  siteLabels$: Observable<SelectItem[]>;

  private destroyed$ = new Subject<void>();

  constructor(private locationService: AppLocationService,
              private appRenderService: AppRendererService,
              private esriShaderService: EsriShadingService,
              private logger: LoggingService,
              private store$: Store<FullAppState>,
              private definitionService: UnifiedAudienceDefinitionService,
              private audienceService: UnifiedAudienceService) { }

  ngOnInit() : void {
    this.siteLabels$ = this.locationService.siteLabelOptions$;
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  duplicateDefinition(def: ShadingDefinition) : ShadingDefinition {
    return duplicateShadingDefinition(def);
  }

  deleteDefinition(event: MouseEvent, definition: ShadingDefinition) : void {
    if (definition.id == null) return;
    this.esriShaderService.deleteShader(definition);
    if (event != null) event.stopPropagation();
  }

  toggleVisibility(event: MouseEvent, definition: ShadingDefinition) : void {
    if (definition.id == null) return;
    this.esriShaderService.updateShader({ id: definition.id, changes: { visible: !definition.visible }});
    if (event != null) event.stopPropagation();
  }

  addNewShader({ dataKey, layerName }: { dataKey: string, layerName?: string }) {
    this.definitionService.getRawTdaDefinition(dataKey).pipe(
      filter(data => data != null),
      map(data => new OfflineAudienceDefinition(data)),
      map(aud => createOfflineAudienceInstance(aud.displayName, aud.identifier, aud.fieldconte, false))
    ).subscribe(audience => this.audienceService.addAudience(audience));
    const newShader = this.appRenderService.createNewShader(dataKey, layerName) as ShadingDefinition;
    newShader.sortOrder = Math.max(...this.shadingDefinitions.map(s => s.sortOrder), this.shadingDefinitions.length) + 1;
    this.esriShaderService.addShader(newShader);
    this.currentOpenId = newShader.id;
  }

  openDefinition(def: ShadingDefinition) {
    this.currentOpenId = def.id;
  }

  applyDefinition(definition: ShadingDefinition) : void {
    const newDef: ShadingDefinition = duplicateShadingDefinition(definition);
    this.appRenderService.updateForAnalysisLevel(newDef, this.currentAnalysisLevel);
    switch (newDef.dataKey) {
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(newDef, this.geos, new Set<string>(this.geos.map(g => g.geocode)));
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(newDef, this.geos, this.tradeAreas, new Set<string>(this.geos.map(g => g.geocode)));
        break;
    }
    if (isArcadeCapableShadingDefinition(newDef)) {
      newDef.arcadeExpression = null;
    }
    this.logger.debug.log('Applying Definition changes. New values:', newDef);
    this.esriShaderService.upsertShader(newDef);
  }

  onCustomAudienceSelected(selected: boolean, definition: ShadingDefinition) : void {
    definition.isCustomAudienceShader = selected;
  }
}
