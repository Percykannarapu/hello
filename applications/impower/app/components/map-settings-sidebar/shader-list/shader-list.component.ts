import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { duplicateShadingDefinition, EsriShadingService, ShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable, Subject } from 'rxjs';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { GetAllMappedVariables } from '../../../impower-datastore/state/transient/transient.actions';
import { GfpShaderKeys } from '../../../models/ui-enums';
import { AppLocationService } from '../../../services/app-location.service';
import { AppRendererService } from '../../../services/app-renderer.service';
import { TargetAudienceTdaService } from '../../../services/target-audience-tda.service';
import { FullAppState } from '../../../state/app.interfaces';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { ImpGeofootprintGeo } from '../../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintTradeArea } from '../../../val-modules/targeting/models/ImpGeofootprintTradeArea';

@Component({
  selector: 'val-shader-list',
  templateUrl: './shader-list.component.html',
  styleUrls: ['./shader-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
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
              private tdaService: TargetAudienceTdaService,
              private store$: Store<FullAppState>,
              private logger: LoggingService) { }

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
    const tdaAudience = this.tdaService.getRawTDAAudienceData(dataKey);
    if (tdaAudience != null) this.tdaService.addAudience(tdaAudience, false);
    const newShader = this.appRenderService.createNewShader(dataKey, layerName) as ShadingDefinition;
    newShader.sortOrder = Math.max(...this.shadingDefinitions.map(s => s.sortOrder), this.shadingDefinitions.length) + 1;
    this.esriShaderService.addShader(newShader);
    this.currentOpenId = newShader.id;
  }

  openDefinition(def: ShadingDefinition) {
    this.currentOpenId = def.id;
  }

  applyDefinition(definition: ShadingDefinition) : void {
    this.appRenderService.updateForAnalysisLevel(definition, this.currentAnalysisLevel);
    switch (definition.dataKey) {
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(definition, this.geos);
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(definition, this.geos, this.tradeAreas);
        break;
    }
    const newDef: ShadingDefinition = duplicateShadingDefinition(definition);
    this.logger.debug.log('Applying Definition changes. New values:', newDef);
    this.esriShaderService.upsertShader(newDef);
    setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel: this.currentAnalysisLevel })), 1000);
  }
}
