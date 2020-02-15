import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { addShadingDefinition, deleteShadingDefinition, ShadingDefinition, updateShadingDefinition, upsertShadingDefinition } from '@val/esri';
import { SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { GetAllMappedVariables } from '../../../impower-datastore/state/transient/transient.actions';
import { GfpShaderKeys } from '../../../models/ui-enums';
import { AppLocationService } from '../../../services/app-location.service';
import { AppRendererService } from '../../../services/app-renderer.service';
import { FullAppState } from '../../../state/app.interfaces';
import { ImpGeofootprintGeo } from '../../../val-modules/targeting/models/ImpGeofootprintGeo';

@Component({
  selector: 'val-shader-list',
  templateUrl: './shader-list.component.html',
  styleUrls: ['./shader-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShaderListComponent implements OnInit {

  @Input() currentAnalysisLevel: string;
  @Input() tradeAreaCount: number;
  @Input() locationCount: number;
  @Input() audiences: Audience[];
  @Input() geos: ImpGeofootprintGeo[];

  @Input() shadingDefinitions: ShadingDefinition[];

  currentOpenId: string;

  shadingTypes = GfpShaderKeys;
  siteLabels$: Observable<SelectItem[]>;

  constructor(private locationService: AppLocationService,
              private appRenderService: AppRendererService,
              private store$: Store<FullAppState>) { }

  ngOnInit() : void {
    this.siteLabels$ = this.locationService.siteLabelOptions$;
  }

  deleteDefinition(event: MouseEvent, definition: ShadingDefinition) : void {
    if (definition.id == null) return;
    this.store$.dispatch(deleteShadingDefinition({ id: definition.id }));
    if (event != null) event.stopPropagation();
  }

  toggleVisibility(event: MouseEvent, definition: ShadingDefinition) : void {
    if (definition.id == null) return;
    this.store$.dispatch(updateShadingDefinition({ shadingDefinition: { id: definition.id, changes: { visible: !definition.visible }}}));
    if (event != null) event.stopPropagation();
  }

  addNewShader(newShader: ShadingDefinition) {
    newShader.sortOrder = Math.max(...this.shadingDefinitions.map(s => s.sortOrder), this.shadingDefinitions.length) + 1;
    this.store$.dispatch(addShadingDefinition({ shadingDefinition: newShader }));
    this.currentOpenId = newShader.id;
  }

  openDefinition(def: ShadingDefinition) {
    this.currentOpenId = def.id;
  }

  applyDefinition(definition: ShadingDefinition) : void {
    const newDef: ShadingDefinition = { ...definition };
    this.appRenderService.updateForAnalysisLevel(newDef, this.currentAnalysisLevel);
    switch (newDef.dataKey) {
      case GfpShaderKeys.OwnerSite:
        this.appRenderService.updateForOwnerSite(newDef, this.geos);
        this.appRenderService.registerGeoOwnerWatcher();
        break;
      case GfpShaderKeys.OwnerTA:
        this.appRenderService.updateForOwnerTA(newDef, this.geos);
        this.appRenderService.registerGeoOwnerWatcher();
        break;
    }
    this.store$.dispatch(upsertShadingDefinition({ shadingDefinition: newDef }));
    setTimeout(() => this.store$.dispatch(new GetAllMappedVariables({ analysisLevel: this.currentAnalysisLevel })), 1000);
  }
}
