import { Inject, Injectable } from '@angular/core';
import { mapArrayToEntity } from '@val/common';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriDomainFactoryService, EsriLayerService, EsriMapService } from '@val/esri';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { defaultLocationPopupFields, LocationDrawDefinition } from './location.transform';
import { TradeAreaDrawDefinition } from './trade-area.transform';

@Injectable({
  providedIn: 'root'
})
export class RenderingService {

  constructor(private esriLayerService: EsriLayerService,
              private esriMapService: EsriMapService,
              private esriFactory: EsriDomainFactoryService,
              private logger: LoggingService,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings) { }

  clearTradeAreas() : void {
    const layersToRemove = this.esriMapService.mapView.map.allLayers.toArray()
      .filter(l => l.title !== null && (l.title.toLowerCase().includes('audience') || l.title.toLowerCase().includes('radius')));
    this.logger.debug.log('Removing', layersToRemove.length, 'layers');
    layersToRemove.forEach(l => this.esriLayerService.removeLayer(l.title));
  }

  clearLocations(type: SuccessfulLocationTypeCodes) : void {
    this.esriLayerService.clearClientLayers(`${type}s`);
  }

  renderTradeAreas(defs: TradeAreaDrawDefinition[]) : void {
    this.logger.debug.log('definitions for trade areas', defs);
    defs.forEach(d => {
      const symbol = new EsriApi.SimpleFillSymbol({
        style: 'solid',
        color: [0, 0, 0, 0],
        outline: {
          style: 'solid',
          color: d.color,
          width: 2
        }
      });
      const geoBuffer = EsriApi.geometryEngine.geodesicBuffer(d.centers, d.buffer, 'miles', d.merge);
      const geometry = Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer];
      const graphics = geometry.map(g => {
        return new EsriApi.Graphic({
          geometry: g,
          symbol: symbol
        });
      });
      this.esriLayerService.createGraphicsLayer(d.groupName, d.layerName, graphics);
    });
  }

  renderLocations(defs: LocationDrawDefinition[]) : void {
    this.logger.debug.log('definitions for locations', defs);
    defs.forEach(d => {
      const currentLayer = this.esriLayerService.getFeatureLayer(d.layerName);
      if (currentLayer != null) {
        this.updateSiteLayer(currentLayer, d);
      } else {
        this.createNewSiteLayer(d);
      }
    });
  }

  private createNewSiteLayer(definition: LocationDrawDefinition) {
    const legendName = definition.siteType == ImpClientLocationTypeCodes.Site ? 'Client Locations' : 'Competitor Locations';
    const siteRenderer =  new EsriApi.SimpleRenderer({
      label: legendName,
      symbol: new EsriApi.SimpleMarkerSymbol({
        style: 'path',
        path: definition.symbolPath,
        size: 12,
        color: definition.color,
        outline: new EsriApi.SimpleLineSymbol({
          color: [255, 255, 255, 0.75],
          width: 1
        })
      })
    });
    const popupTemplate = new EsriApi.PopupTemplate({
      title: definition.popupTitleExpression,
      content: [{ type: 'fields' }],
      fieldInfos: defaultLocationPopupFields
    });
    const labelColor = new EsriApi.Color(definition.color);
    const labelClass: __esri.LabelClass = this.esriFactory.createLabelClass(labelColor, definition.labelExpression);
    this.esriLayerService.createClientLayer(definition.groupName, definition.layerName, definition.sites, 'parentId', siteRenderer, popupTemplate, [labelClass], true);
  }

  private updateSiteLayer(currentLayer: __esri.FeatureLayer, definition: LocationDrawDefinition) {
    currentLayer.queryFeatures().then(result => {
      const currentGraphics: __esri.Graphic[] = result.features;
      const oidDictionary = mapArrayToEntity(currentGraphics, g => g.attributes['locationNumber'], g => g.attributes['parentId']);
      const currentGraphicIds = new Set<string>(currentGraphics.map(g => g.attributes['locationNumber'].toString()));
      const currentSiteIds = new Set<string>(definition.sites.map(g => g.attributes['locationNumber'].toString()));
      const adds = definition.sites.filter(g => !currentGraphicIds.has(g.attributes['locationNumber'].toString()));
      const deletes = currentGraphics.filter(g => !currentSiteIds.has(g.attributes['locationNumber']));
      const updates = definition.sites.filter(g => currentGraphicIds.has(g.attributes['locationNumber'].toString()));
      updates.forEach(g => g.attributes['parentId'] = oidDictionary[g.attributes['locationNumber']]);
      const edits: __esri.FeatureLayerApplyEditsEdits = {};
      if (adds.length > 0) edits.addFeatures = adds;
      if (deletes.length > 0) edits.deleteFeatures = deletes;
      if (updates.length > 0) edits.updateFeatures = updates;
      if (edits.hasOwnProperty('addFeatures') || edits.hasOwnProperty('deleteFeatures') || edits.hasOwnProperty('updateFeatures')) {
        currentLayer.applyEdits(edits);
      }
    });
  }
}
