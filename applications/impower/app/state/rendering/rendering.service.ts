import { Inject, Injectable } from '@angular/core';
import { filterArray } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriDomainFactoryService, EsriLayerService, EsriMapService, EsriUtils } from '@val/esri';
import geometryEngineAsync from 'esri/geometry/geometryEngineAsync';
import Graphic from 'esri/Graphic';
import { SimpleFillSymbol } from 'esri/symbols';
import { from, merge, Observable, of } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { QuadTree } from '../../models/quad-tree';
import { LoggingService } from '../../val-modules/common/services/logging.service';
import { SuccessfulLocationTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { TradeAreaDrawDefinition } from './trade-area.transform';

interface ValueMap {
  merged: boolean;
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
              private config: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings) { }

  private static createValueMap(values: number[], merged: boolean) : ValueMap {
    const result = {
      merged
    };
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
      const currentValueMap = RenderingService.createValueMap(d.bufferedPoints.map(b => b.buffer), d.merge);
      if (this.definitionNeedsRendered(currentValueMap, d.layerName) || this.config.isBatchMode) {
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
}
