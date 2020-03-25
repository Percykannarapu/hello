import { Inject, Injectable } from '@angular/core';
import { filterArray, mapArrayToEntity } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriDomainFactoryService, EsriLayerService, EsriMapService, EsriUtils } from '@val/esri';
import Color from 'esri/Color';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';
import Graphic from 'esri/Graphic';
import PopupTemplate from 'esri/PopupTemplate';
import { SimpleRenderer } from 'esri/renderers';
import { SimpleFillSymbol, SimpleLineSymbol, SimpleMarkerSymbol } from 'esri/symbols';
import { from, merge, Observable, of } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';
import { QuadTree } from '../../models/quad-tree';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { defaultLocationPopupFields, LocationDrawDefinition } from './location.transform';
import { TradeAreaDrawDefinition } from './trade-area.transform';

interface ValueMap {
  [key: number] : number;
}

@Injectable({
  providedIn: 'root'
})
export class RenderingService {

  private renderedDefinitionMap = new Map<string, ValueMap>();

  constructor(private esriLayerService: EsriLayerService,
              private esriMapService: EsriMapService,
              private esriFactory: EsriDomainFactoryService,
              private logger: LoggingService,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings) { }

  private static createValueMap(values: number[]) : ValueMap {
    const result = {};
    values.forEach(v => {
      if (result[v] == undefined) {
        result[v] = 1;
      } else {
        result[v]++;
      }
    });
    return result;
  }

  private definitionNeedsRendered(newValueMap: ValueMap, newDefinitionName: string) : boolean {
    let result = false;
    if (this.renderedDefinitionMap.has(newDefinitionName)) {
      const renderedValueMap = this.renderedDefinitionMap.get(newDefinitionName);
      if (Object.keys(renderedValueMap).length === Object.keys(newValueMap).length) {
        Object.keys(renderedValueMap).forEach(rk => {
          result = result || (renderedValueMap[rk] !== newValueMap[rk]);
        });
      } else {
        result = true;
      }
    } else {
      result = true;
    }
    if (result) {
      this.renderedDefinitionMap.set(newDefinitionName, newValueMap);
    }
    return result;
  }

  clearTradeAreas() : void {
    const layersToRemove = this.esriMapService.mapView.map.allLayers.toArray()
      .filter(l => l.title !== null && (l.title.toLowerCase().includes('audience') || l.title.toLowerCase().includes('radius')));
    this.logger.debug.log('Removing', layersToRemove.length, 'layers');
    layersToRemove.forEach(l => {
      const layer = this.esriLayerService.getLayer(l.title);
      this.esriLayerService.removeLayer(layer);
    });
  }

  clearLocations(type: SuccessfulLocationTypeCodes) : void {
    this.esriLayerService.clearClientLayers(`${type}s`);
  }

  renderTradeAreas(defs: TradeAreaDrawDefinition[]) : Observable<__esri.GraphicsLayer[]> {
    this.logger.debug.log('definitions for trade areas', defs);
    const result: Observable<__esri.GraphicsLayer>[] = [];
    const requestedLayerNames = new Set<string>(defs.map(d => d.layerName));
    const existingLayers = Array.from(this.renderedDefinitionMap.keys());
    existingLayers.forEach(l => {
      if (!requestedLayerNames.has(l)) {
        const layer = this.esriLayerService.getLayer(l);
        this.esriLayerService.removeLayer(layer);
        this.renderedDefinitionMap.delete(l);
      }
    });
    defs.forEach(d => {
      const symbol = new SimpleFillSymbol({
        style: 'solid',
        color: [0, 0, 0, 0],
        outline: {
          style: 'solid',
          color: d.color,
          width: 2
        }
      });
      const currentValueMap = RenderingService.createValueMap(d.bufferedPoints.map(b => b.buffer));
      if (this.definitionNeedsRendered(currentValueMap, d.layerName)) {
        const pointTree = new QuadTree(d.bufferedPoints);
        const chunks = pointTree.partition(100);
        this.logger.info.log(`Generating radius graphics for ${chunks.length} chunks`);
        const circleChunks: Observable<__esri.Polygon[]>[] = chunks.map(chunk => {
          return from(EsriUtils.esriPromiseToEs6(geometryEngineAsync.geodesicBuffer(chunk.map(c => c.point), chunk.map(c => c.buffer), 'miles', d.merge))).pipe(
            map(geoBuffer => Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer]),
            filterArray(poly => poly != null)
          );
        });

        if (d.merge) {
          result.push(merge(...circleChunks).pipe(
            reduce((acc, curr) => [...acc, ...curr], []),
            tap(polys => this.logger.debug.log(`Radius rings generated. ${polys.length} chunks being unioned.`)),
            switchMap(polys => from(EsriUtils.esriPromiseToEs6(geometryEngineAsync.union(polys)))),
            map(geoBuffer => [geoBuffer]),
            map(geometry => geometry.map(g => new Graphic({ geometry: g, symbol: symbol }))),
            tap(() => this.logger.debug.log('Creating Radius Layer')),
            tap(() => {
              const currentLayer = this.esriLayerService.getLayer(d.layerName);
              this.esriLayerService.removeLayer(currentLayer);
            }),
            map(graphics => this.esriLayerService.createGraphicsLayer(d.groupName, d.layerName, graphics))
          ));
        } else {
          result.push(merge(...circleChunks).pipe(
            reduce((acc, curr) => [...acc, ...curr], []),
            map(geometry => geometry.map(g => new Graphic({ geometry: g, symbol: symbol }))),
            tap(() => this.logger.debug.log('Creating Radius Layer')),
            tap(() => {
              const currentLayer = this.esriLayerService.getLayer(d.layerName);
              this.esriLayerService.removeLayer(currentLayer);
            }),
            map(graphics => this.esriLayerService.createGraphicsLayer(d.groupName, d.layerName, graphics))
          ));
        }
      }
    });

    if (result.length > 0) {
      return merge(...result).pipe(
        reduce((acc, curr) => [...acc, curr], [])
      );
    } else {
      return of([]);
    }
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
    const legendName = definition.siteType === ImpClientLocationTypeCodes.Site ? 'Client Locations' : 'Competitor Locations';
    const siteRenderer =  new SimpleRenderer({
      label: legendName,
      symbol: new SimpleMarkerSymbol({
        style: 'path',
        path: definition.symbolPath,
        size: 12,
        color: definition.color,
        outline: new SimpleLineSymbol({
          color: [255, 255, 255, 0.75],
          width: 1
        })
      })
    });
    const popupTemplate = new PopupTemplate({
      title: definition.popupTitleExpression,
      content: [{ type: 'fields' }],
      fieldInfos: defaultLocationPopupFields
    });
    const labelColor = new Color(definition.color);
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
