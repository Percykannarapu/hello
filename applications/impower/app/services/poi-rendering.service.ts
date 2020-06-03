import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { getUuid, groupToEntity, mapArrayToEntity, mapByExtended } from '@val/common';
import {
  ColorPalette,
  duplicatePoiConfiguration,
  EsriDomainFactoryService,
  EsriLayerService,
  EsriPoiService,
  EsriUtils,
  generateUniqueMarkerValues,
  getColorPalette,
  PoiConfiguration,
  PoiConfigurationTypes
} from '@val/esri';
import { filter, take, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { extractUniqueAttributeValues } from '../common/model.transforms';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { createSiteGraphic, defaultLocationPopupFields } from '../state/rendering/location.transform';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpClientLocationTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class PoiRenderingService {

  constructor(private appStateService: AppStateService,
              private layerService: EsriLayerService,
              private domainFactory: EsriDomainFactoryService,
              private appPrefService: AppProjectPrefService,
              private esriPoiService: EsriPoiService,
              private config: AppConfig,
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.setupProjectPrefsWatcher();
      this.setupVisibilityWatcher();
    });
  }

  private setupProjectPrefsWatcher() : void {
    this.esriPoiService.allPoiConfigurations$.pipe(
      withLatestFrom(this.store$.select(projectIsReady), this.store$.select(getBatchMode)),
      filter(([, ready, isBatchMode]) => ready && !isBatchMode)
    ).subscribe(([poi]) => {
      const newDefs: PoiConfiguration[] = JSON.parse(JSON.stringify(poi));
      newDefs.forEach(s => {
        s.featureLayerId = undefined;
      });
      this.appPrefService.createPref('esri', 'map-poi-defs', JSON.stringify(newDefs), 'STRING', true);
    });
  }

  private setupVisibilityWatcher() : void {
    this.esriPoiService.visiblePois$.pipe(
      withLatestFrom(this.esriPoiService.allPoiConfigurations$, this.store$.select(getBatchMode)),
      // filter(([, , isBatchMode]) => isBatchMode)
    ).subscribe(([visiblePois, allConfigs]) => {
      const configsToUpdate = allConfigs.filter(c => visiblePois[c.featureLayerId] != null && visiblePois[c.featureLayerId].length > 0);
      if (configsToUpdate.length > 0) {
        this.updateConfigRenderers(visiblePois, configsToUpdate);
      }
    });
  }

  /**
   * Creates or updates a point feature layer for Client Sites
   * @param sites - The list of Client Sites
   * @param renderingSetups - the PoiConfiguration setup for this Poi Visualization
   */
  renderSites(sites: ImpGeofootprintLocation[], renderingSetups: PoiConfiguration[]) : void {
    const sitesByTypeCode: Record<string, ImpGeofootprintLocation[]> = groupToEntity(sites, s => s.clientLocationTypeCode);
    this.renderPois(sitesByTypeCode, renderingSetups);
  }

  private renderPois(poisByTypeCode: Record<string, ImpGeofootprintLocation[]>, renderingSetups: PoiConfiguration[]) : void {
    const updatedSetups: PoiConfiguration[] = [];
    renderingSetups.forEach(renderingSetup => {
      const newLocations = [...(poisByTypeCode[renderingSetup.dataKey] || [])];
      const newPoints = newLocations.map((l, i) => createSiteGraphic(l, i));
      if (renderingSetup.featureLayerId != null) {
        const existingLayer = this.layerService.getLayerByUniqueId(renderingSetup.featureLayerId);
        if (EsriUtils.layerIsFeature(existingLayer)) {
          if (renderingSetup.poiType === PoiConfigurationTypes.Unique) {
            const newSetup = duplicatePoiConfiguration(renderingSetup);
            const existingValues = new Set<string>(renderingSetup.breakDefinitions.map(b => b.value));
            const markerSetups = generateUniqueMarkerValues(extractUniqueAttributeValues(newLocations, renderingSetup.featureAttribute), getColorPalette(ColorPalette.Symbology, false));
            const newValues = new Set<string>(markerSetups.map(b => b.value));
            const newUniques = markerSetups.filter(s => !existingValues.has(s.value));
            const keepUniques = newSetup.breakDefinitions.filter(b => newValues.has(b.value));
            newSetup.breakDefinitions = [ ...keepUniques, ...newUniques ];
            newSetup.breakDefinitions.sort((a, b) => a.value.localeCompare(b.value));
            updatedSetups.push(newSetup);
          }
          existingLayer.queryFeatures().then(result => {
            const edits = this.prepareLayerEdits(result.features, newPoints);
            if (edits.hasOwnProperty('addFeatures') || edits.hasOwnProperty('deleteFeatures') || edits.hasOwnProperty('updateFeatures')) {
              existingLayer.applyEdits(edits);
            }
            existingLayer.legendEnabled = newPoints.length > 0;
          });
        }
      } else if (newPoints.length > 0) {
        const existingGroup = this.layerService.createClientGroup(renderingSetup.groupName, true);
        const fieldLookup = mapByExtended(defaultLocationPopupFields, item => item.fieldName, item => ({ label: item.label, visible: item.visible }));
        const newFeatureLayer = this.domainFactory.createFeatureLayer(newPoints, 'objectId', fieldLookup);
        newFeatureLayer.visible = false;
        existingGroup.add(newFeatureLayer);
        this.esriPoiService.setPopupFields(defaultLocationPopupFields.filter(f => f.visible !== false).map(f => f.fieldName));
        const newSetup = duplicatePoiConfiguration(renderingSetup);
        newSetup.featureLayerId = newFeatureLayer.id;
        updatedSetups.push(newSetup);
      }
    });
    if (updatedSetups.length > 0) {
      this.esriPoiService.upsertPoiConfig(updatedSetups);
    }
  }

  private prepareLayerEdits(currentGraphics: __esri.Graphic[], newGraphics: __esri.Graphic[]) : __esri.FeatureLayerApplyEditsEdits {
    const oidDictionary = mapArrayToEntity(currentGraphics, g => g.attributes['locationNumber'], g => g.attributes['objectId']);
    const currentGraphicIds = new Set<string>(currentGraphics.map(g => g.attributes['locationNumber'].toString()));
    const currentSiteIds = new Set<string>(newGraphics.map(g => g.attributes['locationNumber'].toString()));
    const adds = newGraphics.filter(g => !currentGraphicIds.has(g.attributes['locationNumber'].toString()));
    const deletes = currentGraphics.filter(g => !currentSiteIds.has(g.attributes['locationNumber']));
    const updates = newGraphics.filter(g => currentGraphicIds.has(g.attributes['locationNumber'].toString()));
    updates.forEach(g => g.attributes['objectId'] = oidDictionary[g.attributes['locationNumber']]);
    const result: __esri.FeatureLayerApplyEditsEdits = {};
    if (adds.length > 0) result.addFeatures = adds;
    if (deletes.length > 0) result.deleteFeatures = deletes;
    if (updates.length > 0) result.updateFeatures = updates;
    return result;
  }

  private updateConfigRenderers(poisByFeatureId: Record<string, __esri.Graphic[]>, renderingSetups: PoiConfiguration[]) : void {
    const updatedSetups: PoiConfiguration[] = [];
    renderingSetups.forEach(config => {
      if (config.poiType === PoiConfigurationTypes.Unique) {
        const currentPois = poisByFeatureId[config.featureLayerId];
        const existingFeatures = new Set<string>(currentPois.map(poi => poi.attributes[config.featureAttribute]));
        config.breakDefinitions.forEach(b => b.isHidden = !existingFeatures.has(b.value));
        updatedSetups.push(duplicatePoiConfiguration(config));
      }
    });
    if (updatedSetups.length > 0) {
      this.esriPoiService.upsertPoiConfig(updatedSetups);
    }
  }

  public getConfigurations(project?: ImpProject) : PoiConfiguration[] {
    let result = this.createDefaultConfigurations();
    if (project != null) {
      const newPref = this.appPrefService.getPrefVal('map-poi-defs');
      if (newPref) {
        result = JSON.parse(newPref);
      } else {
        this.appPrefService.createPref('esri', 'map-poi-defs', JSON.stringify(result));
      }
    }
    return result;
  }

  private createDefaultConfigurations() : PoiConfiguration[] {
    return [{
      id: getUuid(),
      poiType: PoiConfigurationTypes.Simple,
      dataKey: ImpClientLocationTypeCodes.Site,
      groupName: 'Sites',
      sortOrder: 0,
      layerName: 'Client Locations',
      minScale: 0,
      opacity: 1,
      visible: true,
      showLabels: true,
      labelDefinition: {
        color: [0, 0, 255, 1],
        haloColor: [255, 255, 255, 1],
        usesStaticColor: false,
        family: 'Noto Sans',
        size: 12,
        isBold: true,
        isItalic: false,
        featureAttribute: 'locationNumber',
        customExpression: null,
      },
      symbolDefinition: { color: [0, 0, 255, 1], markerType: 'path', legendName: 'Client Locations', outlineColor: [255, 255, 255, 1], size: 10 }
    }, {
      id: getUuid(),
      poiType: PoiConfigurationTypes.Simple,
      dataKey: ImpClientLocationTypeCodes.Competitor,
      groupName: 'Competitors',
      sortOrder: 1,
      layerName: 'Competitors',
      minScale: 0,
      opacity: 1,
      visible: true,
      showLabels: true,
      labelDefinition: {
        color: [255, 0, 0, 1],
        haloColor: [255, 255, 255, 1],
        usesStaticColor: false,
        family: 'Noto Sans',
        size: 12,
        isBold: true,
        isItalic: false,
        featureAttribute: 'locationNumber',
        customExpression: null,
      },
      symbolDefinition: { color: [255, 0, 0, 1], markerType: 'path', legendName: 'Competitors', outlineColor: [255, 255, 255, 1], size: 10 }
    }];
  }
}
