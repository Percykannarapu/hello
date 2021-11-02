import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isString } from '@val/common';
import { duplicateShadingDefinition, EsriShadingService, isArcadeCapableShadingDefinition, ShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { FieldContentTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { createOfflineAudienceInstance } from '../../../common/models/audience-factories';
import { GfpShaderKeys } from '../../../common/models/ui-enums';
import { AppLocationService } from '../../../services/app-location.service';
import { AppRendererService } from '../../../services/app-renderer.service';
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

  addNewShader({ dataKey, layerName }: { dataKey: string | { displayName: string, identifier: string, fieldconte: FieldContentTypeCodes }, layerName?: string }) {
    let shaderKey: string;
    if (!isString(dataKey)) {
      shaderKey = dataKey.identifier;
      const audience = createOfflineAudienceInstance(dataKey.displayName, dataKey.identifier, dataKey.fieldconte, false);
      this.audienceService.addAudience(audience);
    } else {
      shaderKey = dataKey;
    }
    const newShader = this.appRenderService.createNewShader(shaderKey, layerName) as ShadingDefinition;
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
    const dedupedGeos = this.geos.filter(g => g.isDeduped === 1);
    switch (newDef.dataKey) {
      case GfpShaderKeys.Selection:
        // do nothing
        break;
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(newDef, dedupedGeos, new Set<string>(dedupedGeos.map(g => g.geocode)));
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(newDef, dedupedGeos, this.tradeAreas, new Set<string>(dedupedGeos.map(g => g.geocode)));
        break;
      case GfpShaderKeys.PcrIndicator:
        // create pcr-indicator arcadeExpression
        this.appRenderService.updateForPcrIndicator(newDef, dedupedGeos, new Set<string>(dedupedGeos.map(g => g.geocode)));       
        break;
      default:
        // a variable shader has been selected
        newDef.shaderNeedsDataFetched = true;
    }
    if (isArcadeCapableShadingDefinition(newDef) && newDef.dataKey != GfpShaderKeys.PcrIndicator) {
      newDef.arcadeExpression = null;
    }
    this.logger.debug.log('Applying Definition changes. New values:', newDef);
    this.esriShaderService.upsertShader(newDef);
  }

  onCustomAudienceSelected(selected: boolean, definition: ShadingDefinition) : void {
    definition.isCustomAudienceShader = selected;
  }
}
