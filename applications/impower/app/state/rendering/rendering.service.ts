import { Inject, Injectable } from '@angular/core';
import { geodesicBuffer, union } from '@arcgis/core/geometry/geometryEngineAsync';
import Graphic from '@arcgis/core/Graphic';
import { filterArray } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriDomainFactory, EsriLayerService, EsriMapService, EsriQuadTree } from '@val/esri';
import { from, merge, Observable, of } from 'rxjs';
import { map, reduce, switchMap, tap } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { LoggingService } from '../../val-modules/common/services/logging.service';
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
              private logger: LoggingService,
              private config: AppConfig,
              @Inject(EsriAppSettingsToken) private esriAppSettings: EsriAppSettings) { }

  private static createValueMap(values: number[], merged: boolean) : ValueMap {
    const result = {
      merged
    };
    values.filter(v => v > 0).forEach(v => {
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
    this.renderedDefinitionMap.clear();
    this.logger.debug.log('Removing', layersToRemove.length, 'layers');
    layersToRemove.forEach(l => {
      const layer = this.esriLayerService.getLayer(l.title);
      this.esriLayerService.removeLayer(layer);
    });
  }

  renderTradeAreas(defs: TradeAreaDrawDefinition[]) : Observable<__esri.FeatureLayer[]> {
    this.logger.debug.log('definitions for trade areas', defs);
    const result: Observable<__esri.FeatureLayer>[] = [];
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
      const outline = EsriDomainFactory.createSimpleLineSymbol(d.color, 2);
      const symbol = EsriDomainFactory.createSimpleFillSymbol([0, 0, 0, 0], outline);
      const renderer = EsriDomainFactory.createSimpleRenderer(symbol);
      const validBufferedPoints = d.bufferedPoints.filter(p => p.buffer > 0);
      if (validBufferedPoints.length > 0) {
        const currentValueMap = RenderingService.createValueMap(validBufferedPoints.map(b => b.buffer), d.merge);
        if (this.definitionNeedsRendered(currentValueMap, d.layerName) || this.config.isBatchMode) {
          const pointTree = new EsriQuadTree(validBufferedPoints);
          const chunks = pointTree.partition(100);
          this.logger.info.log(`Generating radius graphics for ${chunks.length} chunks`);
          const circleChunks: Observable<__esri.Polygon[]>[] = chunks.map(chunk => {
            return from(geodesicBuffer(chunk.map(c => c.point), chunk.map(c => c.buffer), 'miles', d.merge)).pipe(
              map(geoBuffer => Array.isArray(geoBuffer) ? geoBuffer : [geoBuffer]),
              filterArray(poly => poly != null)
            );
          });

          let currentRadiusLayer$: Observable<any> = merge(...circleChunks).pipe(
            reduce((acc, curr) => [...acc, ...curr], []),
          );

          if (d.merge) {
            currentRadiusLayer$ = currentRadiusLayer$.pipe(
              tap(polys => this.logger.debug.log(`Radius rings generated. ${polys.length} chunks being unioned.`)),
              switchMap(polys => from(union(polys))),
              map(geoBuffer => [geoBuffer]),
            );
          }
          let oid = 0;
          currentRadiusLayer$ = currentRadiusLayer$.pipe(
            map(geometry => geometry.map(g => new Graphic({ geometry: g, attributes: { oid: oid++ } }))),
            tap(() => this.logger.debug.log('Creating Radius Layer')),
            tap(() => {
              const currentLayer = this.esriLayerService.getLayer(d.layerName);
              this.esriLayerService.removeLayer(currentLayer);
            }),
            map(graphics => this.esriLayerService.createClientLayer(d.groupName, d.layerName, graphics, 'oid', renderer, null, null))
          );
          result.push(currentRadiusLayer$);
        }
      }
    });

    if (result.length > 0) {
      return merge(...result).pipe(
        reduce((acc, curr) => [...acc, curr], [] as __esri.FeatureLayer[]),
        tap(layers => this.logger.debug.log('Generated Radius Layers', layers))
      );
    } else {
      return of([]);
    }
  }
}
