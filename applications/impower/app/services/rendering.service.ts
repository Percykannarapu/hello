import { Inject, Injectable } from '@angular/core';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { TradeAreaMergeTypeCodes } from '../val-modules/targeting/targeting.enums';
import { TradeAreaDrawDefinition } from '../models/trade-area-draw-definition';
import { groupByExtended, toUniversalCoordinates } from '@val/common';
import { EsriApi, EsriAppSettings, EsriAppSettingsToken, EsriLayerService, EsriMapService } from '@val/esri';
import { AppStateService } from './app-state.service';
import { LoggingService } from '../val-modules/common/services/logging.service';

const toPoint = (tradeArea: ImpGeofootprintTradeArea, spatialRef: any) : __esri.Point => {
  const coordinates = toUniversalCoordinates(tradeArea.impGeofootprintLocation);
  return new EsriApi.Point({ spatialReference: spatialRef, ...coordinates });
};

@Injectable({
  providedIn: 'root'
})
export class RenderingService {

  spatialRef = { wkid: this.esriAppSettings.defaultSpatialRef };

  constructor(private appStateService: AppStateService,
              private esriLayerService: EsriLayerService,
              private esriMapService: EsriMapService,
              private logger: LoggingService,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings) { }

  prepareRadiusTradeAreas(tradeAreas: ImpGeofootprintTradeArea[], mergeType: TradeAreaMergeTypeCodes) : TradeAreaDrawDefinition[] {
    const result: TradeAreaDrawDefinition[] = [];
    const siteGroups = groupByExtended(tradeAreas, ta => ta.impGeofootprintLocation.clientLocationTypeCode);
    siteGroups.forEach((tas, siteType) => {
      const maxTaNum = Math.max(...tas.map(ta => ta.taNumber));
      const usableTas = mergeType === TradeAreaMergeTypeCodes.MergeAll ? tas.filter(ta => ta.taNumber === maxTaNum) : tas;
      const layerGroups = groupByExtended(usableTas, ta => ta.taName);
      layerGroups.forEach((layerTradeAreas, layerName) => {
        const currentResult: TradeAreaDrawDefinition = layerTradeAreas.reduce((a, c) => {
          if (c.taRadius != null) {
            a.buffer.push(c.taRadius);
            a.centers.push(toPoint(c, { ...this.spatialRef }));
          }
          return a;
        }, {
          groupName: `${siteType}s`,
          layerName: `${siteType} - ${layerName}`,
          color: siteType === 'Site' ? [0, 0, 255, 1] : [255, 0, 0, 1],
          merge: mergeType !== TradeAreaMergeTypeCodes.NoMerge,
          buffer: [],
          centers: []
        } as TradeAreaDrawDefinition);
        result.push(currentResult);
      });
    });
    return result;
  }

  prepareAudienceTradeAreas(tradeAreas: ImpGeofootprintTradeArea[]) : TradeAreaDrawDefinition[] {
    const minRadius = this.appStateService.currentProject$.getValue().audTaMinRadiu;
    const maxRadius = this.appStateService.currentProject$.getValue().audTaMaxRadiu;
    const minLayer: TradeAreaDrawDefinition = tradeAreas.reduce((a, c) => {
      a.buffer.push(minRadius);
      a.centers.push(toPoint(c, { ...this.spatialRef }));
      return a;
    }, {
      groupName: `Sites`,
      layerName: `Site - Audience Min Radius`,
      color: [0, 0, 255, 1],
      merge: false,
      buffer: [],
      centers: []
    } as TradeAreaDrawDefinition);
    const maxLayer: TradeAreaDrawDefinition = tradeAreas.reduce((a, c) => {
      a.buffer.push(maxRadius);
      a.centers.push(toPoint(c, { ...this.spatialRef }));
      return a;
    }, {
      groupName: `Sites`,
      layerName: `Site - Audience Max Radius`,
      color: [0, 0, 255, 1],
      merge: false,
      buffer: [],
      centers: []
    } as TradeAreaDrawDefinition);

    return [minLayer, maxLayer];
  }

  clearTradeAreas() : void {
    const layersToRemove = this.esriMapService.mapView.map.allLayers.toArray()
      .filter(l => l.title.toLowerCase().includes('audience') || l.title.toLowerCase().includes('radius'));
    this.logger.debug('Removing', layersToRemove.length, 'layers');
    layersToRemove.forEach(l => this.esriLayerService.removeLayer(l.title));
  }

  renderTradeAreas(defs: TradeAreaDrawDefinition[]) : void {
    this.logger.debug('definitions for trade areas', defs);
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
}
