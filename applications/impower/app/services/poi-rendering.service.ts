import { Inject, Injectable } from '@angular/core';
import Point from '@arcgis/core/geometry/Point';
import { Store } from '@ngrx/store';
import {
  getUuid,
  groupByExtended,
  groupToEntity,
  isConvertibleToNumber,
  mapArrayToEntity,
  mapByExtended,
  removeNonAlphaNumerics,
  toUniversalCoordinates
} from '@val/common';
import {
  ColorPalette,
  duplicatePoiConfiguration,
  EsriAppSettings,
  EsriAppSettingsToken,
  EsriDomainFactory,
  EsriLayerService,
  EsriPoiService,
  generateUniqueMarkerValues,
  getColorPalette,
  isFeatureLayer,
  PoiConfiguration,
  PoiConfigurationTypes,
  RadiiTradeAreaDrawDefinition,
  SimplePoiConfiguration
} from '@val/esri';
import { BatchMapQueryParams, getTypedBatchQueryParams } from 'app/state/shared/router.interfaces';
import { ImpGeofootprintTradeArea } from 'app/val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpDomainFactoryService } from 'app/val-modules/targeting/services/imp-domain-factory.service';
import { ImpGeofootprintLocationService } from 'app/val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { filter, take, withLatestFrom } from 'rxjs/operators';
import { LoggingService } from '../../../../modules/esri/src/services/logging.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { extractUniqueAttributeValues } from '../common/model.transforms';
import { FullAppState } from '../state/app.interfaces';
import { getBatchMode } from '../state/batch-map/batch-map.selectors';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
import { createSiteGraphic, defaultLocationPopupFields } from '../state/rendering/location.transform';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { AppProjectPrefService } from './app-project-pref.service';
import { AppStateService } from './app-state.service';


@Injectable({
  providedIn: 'root'
})
export class PoiRenderingService {

  private batchMapParams: BatchMapQueryParams;

  constructor(private appStateService: AppStateService,
              private layerService: EsriLayerService,
              private appPrefService: AppProjectPrefService,
              private esriPoiService: EsriPoiService,
              private config: AppConfig,
              private logger: LoggingService,
              private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private impDomainFactory: ImpDomainFactoryService,
              private impLocationService: ImpGeofootprintLocationService,
              @Inject(EsriAppSettingsToken) private esriSettings: EsriAppSettings,
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
      withLatestFrom(this.esriPoiService.allPoiConfigurations$, this.store$.select(getTypedBatchQueryParams)),
      // filter(([, , isBatchMode]) => isBatchMode)
    ).subscribe(([visiblePois, allConfigs, batchMapParams]) => {
      this.batchMapParams = batchMapParams;
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
    if (this.config.isBatchMode){
      renderingSetups =  this.updateRadiiDefination(sites, renderingSetups);
      this.esriPoiService.upsertPoiConfig(renderingSetups);
    }

    this.renderPois(sitesByTypeCode, renderingSetups);
  }

  private renderPois(poisByTypeCode: Record<string, ImpGeofootprintLocation[]>, renderingSetups: PoiConfiguration[]) : void {
    const updatedSetups: PoiConfiguration[] = [];
    renderingSetups.forEach(renderingSetup => {
      const newLocations = [...(poisByTypeCode[renderingSetup.dataKey] || [])];
      const newPoints = newLocations.map((l, i) => createSiteGraphic(l, i));
      if (renderingSetup.featureLayerId != null) {
        const existingLayer = this.layerService.getLayerByUniqueId(renderingSetup.featureLayerId);
        if (isFeatureLayer(existingLayer)) {
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
              existingLayer.applyEdits(edits).catch(console.error);
              if (renderingSetup.visibleRadius && !this.config.isBatchMode){
                const locType: ImpClientLocationTypeCodes = renderingSetup.dataKey === 'Site' ? ImpClientLocationTypeCodes.Site : ImpClientLocationTypeCodes.Competitor;
                const tas  = this.applyRadiusTradeArea (renderingSetup['tradeAreas'], locType);
                this.renderRadii(tas, ImpClientLocationTypeCodes.Site, this.esriSettings.defaultSpatialRef, renderingSetup);
                const newPoi = duplicatePoiConfiguration(renderingSetup);
                this.esriPoiService.upsertPoiConfig(newPoi);
              }
            }
            existingLayer.legendEnabled = newPoints.length > 0;
          });
        }
      } else if (newPoints.length > 0) {
        const existingGroup = this.layerService.createClientGroup(renderingSetup.groupName, true);
        const fieldLookup = mapByExtended(defaultLocationPopupFields, item => item.fieldName, item => ({ label: item.label, visible: item.visible }));
        const newFeatureLayer = EsriDomainFactory.createFeatureLayer(newPoints, 'objectId', fieldLookup);
        newFeatureLayer.visible = false;
        existingGroup.add(newFeatureLayer);
        this.esriPoiService.setPopupFields(defaultLocationPopupFields.filter(f => f.visible !== false).map(f => f.fieldName));
        const newSetup = duplicatePoiConfiguration(renderingSetup);
        newSetup.featureLayerId = newFeatureLayer.id;
        updatedSetups.push(newSetup);
      }
    });
    if (updatedSetups.length > 0 ) {
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
        const existingFeatures = new Set<string>(currentPois.map(poi => poi.attributes[removeNonAlphaNumerics(config.featureAttribute)]));
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
      visibleRadius: false,
      radiiTradeAreaDefinition: [],
      radiiColor: [0, 0, 255, 1],
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
      visibleRadius: false,
      radiiTradeAreaDefinition: [],
      radiiColor: [255, 0, 0, 1],
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

  private toPoint(ta: ImpGeofootprintTradeArea, wkid: number) : __esri.Point {
    const coordinates = toUniversalCoordinates(ta.impGeofootprintLocation);
    return new Point({ spatialReference: { wkid }, ...coordinates });
  }


  renderRadii (tradeAreas: ImpGeofootprintTradeArea[], siteType: SuccessfulLocationTypeCodes, wkid: number, definition: PoiConfiguration){
    const result: RadiiTradeAreaDrawDefinition[] = [];
    //const maxTaNum = Math.max(...tradeAreas.map(ta => ta.taNumber));
    const layerGroups = groupByExtended(tradeAreas, ta => ta.taName);
    layerGroups.forEach((layerTradeAreas, layerName) => {
      const radiiDef = {groupName: `${String(siteType)} Visual Radii`, layerName: `${String(siteType)} - ${layerName}`, color: definition.radiiColor, merge: true};
      const currentResult = new RadiiTradeAreaDrawDefinition(radiiDef);
      if (layerTradeAreas.length < 10000) {
        if (layerTradeAreas.length > 7000) {
          currentResult.merge = false;
        }
        layerTradeAreas.forEach(ta => {
          if (isConvertibleToNumber(ta.taRadius)) {
            const currentPoint = this.toPoint(ta, wkid);
            currentResult.buffer.push(Number(ta.taRadius));
            currentResult.centers.push(currentPoint);
            currentResult.taNumber = ta.taNumber;
            currentResult.bufferedPoints.push({
              buffer: Number(ta.taRadius),
              xcoord: ta.impGeofootprintLocation.xcoord,
              ycoord: ta.impGeofootprintLocation.ycoord,
              point: currentPoint
            });
          }
        });
        result.push(currentResult);
      }
    });

    definition.radiiTradeAreaDefinition = result;
    //return definition;
  }

  public applyRadiusTradeArea(tradeAreas: { tradeAreaNumber: number, isActive: boolean, radius: number }[],
                              siteType: SuccessfulLocationTypeCodes, locs?: ImpGeofootprintLocation[])  {
    const currentLocations = locs != null && locs.length > 0 ? locs : this.getLocations(siteType);
    //const tradeAreaFilter = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Radii]);
    return this.applyRadiiTradeAreasToLocations(tradeAreas, currentLocations);
  }

  public createRadiusTradeAreasForLocations(tradeAreas: { tradeAreaNumber: number, isActive: boolean, radius: number }[], locations: ImpGeofootprintLocation[], attachToHierarchy: boolean = false) : ImpGeofootprintTradeArea[] {
    const newTradeAreas: ImpGeofootprintTradeArea[] = [];
    if (tradeAreas != null && tradeAreas.length > 0) {
      locations.forEach(location => {
        tradeAreas.forEach(ta => {
          newTradeAreas.push(this.impDomainFactory.createTradeArea(location, TradeAreaTypeCodes.Radii, ta.isActive, ta.tradeAreaNumber, ta.radius, attachToHierarchy));
        });
      });
    }
    return newTradeAreas;
  }

  public applyRadiiTradeAreasToLocations(tradeAreas: { tradeAreaNumber: number, isActive: boolean, radius: number }[], locations: ImpGeofootprintLocation[]) {
    const newTradeAreas: ImpGeofootprintTradeArea[] = this.createRadiusTradeAreasForLocations(tradeAreas, locations);
    return newTradeAreas;
  }
  private getLocations(siteType: SuccessfulLocationTypeCodes) : ImpGeofootprintLocation[] {
    const locs: ImpGeofootprintLocation[] = [];
    return this.impLocationService.get().filter(loc => loc.clientLocationTypeCode === siteType && loc.isActive);
  }

  updateRadiiDefination(sites: ImpGeofootprintLocation[], renderingSetups: PoiConfiguration[]){
    sites = sites.filter(loc => loc.clientLocationTypeCode === ImpClientLocationTypeCodes.Site);
    renderingSetups.forEach((def: SimplePoiConfiguration) => {
      if (def.dataKey === 'Site'){
        def.symbolDefinition.size = this.batchMapParams.symbols ? def.symbolDefinition.size : 0;
        def.showLabels = this.batchMapParams.labels;
        if (this.batchMapParams.hideNeighboringSites){
          const tas = this.applyRadiusTradeArea(def['tradeAreas'], ImpClientLocationTypeCodes.Site, sites);
          this.renderRadii(tas, ImpClientLocationTypeCodes.Site, this.esriSettings.defaultSpatialRef, def);
        }

        const newDef: PoiConfiguration = duplicatePoiConfiguration(def);
      }
    });
    return renderingSetups;
  }
}
