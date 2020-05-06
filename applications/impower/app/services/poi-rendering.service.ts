import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { getUuid, groupByExtended, mapArrayToEntity } from '@val/common';
import { EsriDomainFactoryService, EsriLayerService, EsriPoiService, EsriUtils, PoiConfiguration, PoiConfigurationTypes } from '@val/esri';
import { filter, take, withLatestFrom } from 'rxjs/operators';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { createSiteGraphic } from '../state/rendering/location.transform';
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
              private store$: Store<FullAppState>) {
    this.appStateService.applicationIsReady$.pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.setupProjectPrefsWatcher();
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

  /**
   * Creates or updates a point feature layer for Client Sites
   * @param sites - The list of Client Sites
   * @param renderingSetups - the PoiConfiguration setup for this Poi Visualization
   */
  renderSites(sites: ImpGeofootprintLocation[], renderingSetups: PoiConfiguration[]) : void {
    const updatedSetups: PoiConfiguration[] = [];
    const sitesByTypeCode = groupByExtended(sites, s => s.clientLocationTypeCode);
    renderingSetups.forEach(renderingSetup => {
      const currentSites = sitesByTypeCode.get(renderingSetup.dataKey) || [];
      if (renderingSetup.featureLayerId != null) {
        const existingLayer = this.layerService.getLayerByUniqueId(renderingSetup.featureLayerId);
        if (EsriUtils.layerIsFeature(existingLayer)) {
          existingLayer.queryFeatures().then(result => {
            const newPoints = currentSites.map((s, i) => createSiteGraphic(s, i));
            const edits = this.prepareLayerEdits(result.features, newPoints);
            if (edits.hasOwnProperty('addFeatures') || edits.hasOwnProperty('deleteFeatures') || edits.hasOwnProperty('updateFeatures')) {
              existingLayer.applyEdits(edits);
            }
            existingLayer.legendEnabled = newPoints.length > 0;
          });
        }
      } else if (currentSites.length > 0) {
        const newPoints = currentSites.map((s, i) => createSiteGraphic(s, i));
        const existingGroup = this.layerService.createClientGroup(renderingSetup.groupName, true);
        const newFeatureLayer = this.domainFactory.createFeatureLayer(newPoints, 'objectId');
        newFeatureLayer.visible = false;
        existingGroup.add(newFeatureLayer);
        updatedSetups.push({...renderingSetup, featureLayerId: newFeatureLayer.id});
      }
    });
    if (updatedSetups.length > 0) {
      this.esriPoiService.updatePoiConfig(updatedSetups);
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
      layerName: 'Project Sites',
      minScale: 0,
      opacity: 1,
      visible: true,
      showLabels: true,
      labelDefinition: { color: [0, 0, 255, 1], featureAttribute: 'locationNumber', isBold: true, size: 12, haloColor: [255, 255, 255, 1], customExpression: null },
      symbolDefinition: { color: [0, 0, 255, 1], markerType: 'path', legendName: 'Client Locations', outlineColor: [255, 255, 255, 1] }
    }, {
      id: getUuid(),
      poiType: PoiConfigurationTypes.Simple,
      dataKey: ImpClientLocationTypeCodes.Competitor,
      groupName: 'Competitors',
      sortOrder: 1,
      layerName: 'Project Competitors',
      minScale: 0,
      opacity: 1,
      visible: true,
      showLabels: true,
      labelDefinition: { color: [255, 0, 0, 1], featureAttribute: 'locationNumber', isBold: true, size: 12, haloColor: [255, 255, 255, 1], customExpression: null },
      symbolDefinition: { color: [255, 0, 0, 1], markerType: 'path', legendName: 'Competitor Locations', outlineColor: [255, 255, 255, 1] }
    }];
  }
}
