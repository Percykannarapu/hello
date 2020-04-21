import { Inject, Injectable } from '@angular/core';
import { chunkArray, retryOnTimeout } from '@val/common';
import { Multipoint, Point } from 'esri/geometry';
import Query from 'esri/tasks/support/Query';
import { EMPTY, from, merge, Observable, of } from 'rxjs';
import { expand, filter, map, switchMap, take } from 'rxjs/operators';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { EsriUtils } from '../core/esri-utils';
import { EsriLayerService } from './esri-layer.service';
import { EsriMapService } from './esri-map.service';

type txCallback<T> = (graphic: __esri.Graphic) => T;
type compositeData = string[] | number[] | __esri.PointProperties[];
type pointInputs = __esri.PointProperties | __esri.PointProperties[];
const SIMULTANEOUS_STREAMS = 3;

@Injectable()
export class EsriQueryService {

  private static config: EsriAppSettings;

  constructor(@Inject(EsriAppSettingsToken) config: EsriAppSettings,
              private layerService: EsriLayerService,
              private mapService: EsriMapService) {
    EsriQueryService.config = config;
  }

  private static dataIsString(d: compositeData) : d is string[] {
    return d != null && typeof d[0] === 'string';
  }

  private static dataIsNumber(d: compositeData) : d is number[] {
    return d != null && typeof d[0] === 'number';
  }

  private static calculateChunkSize(dataLength: number, returnGeometry: boolean, bufferInMiles: number = 0) : number {
    if (!returnGeometry) return Math.min(dataLength, this.config.maxPointsPerQuery);
    if (bufferInMiles === 0) return this.config.maxPointsPerAttributeQuery;
    return this.config.maxPointsPerBufferQuery;
  }

  private static createQuery(returnGeometry: boolean, outFields: string[], data: __esri.PointProperties[], bufferInMiles: number) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[], queryField: string) : __esri.Query;
  private static createQuery(returnGeometry: boolean, outFields: string[], data: string[] | number[] | __esri.PointProperties[], queryField: string | number) : __esri.Query {
    const result = new Query({
      returnGeometry: returnGeometry,
      orderByFields: ['geocode']
    });
    if (typeof queryField === 'number' && queryField > 0) {
      result.distance = queryField;
      result.units = 'miles';
    }
    if (queryField === 'dma_code') {
      result.orderByFields = [];
    }
    if (outFields != null) {
      result.outFields = outFields;
    }
    if (this.dataIsNumber(data)) {
      const condition = data.length === 1 ? `= ${data[0]}` : `IN (${data.join(',')})`;
      result.where = `${queryField} ${condition}`;
    } else if (this.dataIsString(data)) {
      const condition = data.length === 1 ? `= '${data[0]}'` : `IN ('${data.join(`','`)}')`;
      result.where = `${queryField} ${condition}`;
    } else if (data.length === 1) {
      result.geometry = new Point(data[0]);
    } else {
      const multiPointData: number[][] = data.map(p => [Number(p.x), Number(p.y)]);
      result.geometry = new Multipoint({
        points: multiPointData,
        spatialReference: { wkid: this.config.defaultSpatialRef }
      });
    }
    return result;
  }

  private static getNextQuery(featureSet: __esri.FeatureSet, query: __esri.Query) : { result: __esri.FeatureSet, next: __esri.Query } {
    const result = {
      result: featureSet,
      next: null
    };
    if (featureSet.exceededTransferLimit) {
      const nextQuery = EsriUtils.clone(query);
      nextQuery.num = featureSet.features.length;
      nextQuery.start = (query.start || 0) + featureSet.features.length;
      result.next = nextQuery;
    }
    return result;
  }

  private static transformFeatureSet<T>(featureSet: __esri.FeatureSet, transform: txCallback<T>) : T[] {
    if (featureSet == null || featureSet.features == null || featureSet.features.length === 0) return [];
    return featureSet.features.map(f => transform(f));
  }

  public executeQuery(layerId: string, query: __esri.Query, returnGeometry = false, outFields = null) : Observable<__esri.FeatureSet> {
    if (returnGeometry) query.returnGeometry = true;
    if (outFields != null) query.outFields = outFields;
    return this.paginateEsriQuery(layerId, query);
  }

  public executeObjectIdQuery(layerId: string, query: __esri.Query) : Observable<number[]> {
    return from(EsriUtils.esriPromiseToEs6(this.mapService.mapView.when())).pipe(
      map(() => this.layerService.getPortalLayerById(layerId)),
      switchMap(layer => layer == null ? EMPTY : EsriUtils.esriPromiseToEs6<__esri.FeatureLayer>(layer.when())),
      switchMap(layer => EsriUtils.esriPromiseToEs6(layer.queryObjectIds(query)))
    );
  }

  private executeFeatureQuery(layerId: string, query: __esri.Query) : Observable<__esri.FeatureSet> {
    return from(EsriUtils.esriPromiseToEs6(this.mapService.mapView.when())).pipe(
      map(() => this.layerService.getPortalLayerById(layerId)),
      switchMap(layer => layer == null ? EMPTY : EsriUtils.esriPromiseToEs6<__esri.FeatureLayer>(layer.when())),
      switchMap(layer => EsriUtils.esriPromiseToEs6(layer.queryFeatures(query)))
    );
  }

  private paginateEsriQuery(layerId: string, query: __esri.Query) : Observable<__esri.FeatureSet> {
    const recursiveQuery$ = (id: string, q: __esri.Query) =>
      this.executeFeatureQuery(id, q).pipe(map(r => EsriQueryService.getNextQuery(r, q)));

    return recursiveQuery$(layerId, query).pipe(
      retryOnTimeout(5),
      expand(({result, next}) => next ? recursiveQuery$(layerId, next) : EMPTY),
      map(({ result }) => result)
    );
  }

  private query<T>(layerId: string, queries: __esri.Query[], transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const observables: Observable<__esri.FeatureSet>[] = [];
    for (const query of queries) {
      observables.push(this.executeQuery(layerId, query));
    }
    const result$: Observable<__esri.FeatureSet> = merge(...observables, SIMULTANEOUS_STREAMS);
    if (transform == null) {
      return result$.pipe(map(fs => fs.features));
    } else {
      return result$.pipe(map(fs => EsriQueryService.transformFeatureSet(fs, transform)));
    }
  }

  public queryPoint(layerId: string, points: pointInputs, returnGeometry?: boolean , outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPoint<T>(layerId: string, points: pointInputs, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPoint<T>(layerId: string, points: pointInputs, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    return this.queryPointWithBuffer(layerId, points, 0, returnGeometry, outFields, transform);
  }

  public queryPointWithBuffer(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryPointWithBuffer<T>(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryPointWithBuffer<T>(layerId: string, points: pointInputs, bufferInMiles: number, returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const pointArray = Array.isArray(points) ? points : [points];
    const chunkSize = EsriQueryService.calculateChunkSize(pointArray.length, returnGeometry, bufferInMiles);
    const dataStreams: __esri.PointProperties[][] = chunkArray(pointArray, chunkSize);
    const queries: __esri.Query[] = dataStreams.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, bufferInMiles));
    return this.query(layerId, queries, transform);
  }

  public queryAttributeIn(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry?: boolean, outFields?: string[]) : Observable<__esri.Graphic[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry: boolean, outFields: string[], transform: txCallback<T>) : Observable<T[]>;
  public queryAttributeIn<T>(layerId: string, queryField: string, queryData: string[] | number[], returnGeometry: boolean = false, outFields: string[] = null, transform: txCallback<T> = null) : Observable<T[]> | Observable<__esri.Graphic[]> {
    const chunkSize = EsriQueryService.calculateChunkSize(queryData.length, returnGeometry);
    const dataStreams = chunkArray<string, number>(queryData, chunkSize);
    const queries: __esri.Query[] = dataStreams.map(data => EsriQueryService.createQuery(returnGeometry, outFields, data, queryField));
    return this.query(layerId, queries, transform);
  }

  public queryExtent(layerId: string, extent?: __esri.Extent) : Observable<__esri.Graphic[]> {
    const query = new Query({
      geometry: extent == null ? this.mapService.mapView.extent : extent,
      returnGeometry: false,
      outFields: ['geocode', 'pob']
    });
    return this.query(layerId, [query]);
  }

  public queryPortalLayerView(layerId: string) : Observable<__esri.Graphic[]> {
    if (layerId == null || layerId.length === 0) return of([]);
    const layer = this.layerService.getPortalLayerById(layerId);
    return this.queryLayerView([layer], null);
  }

  public queryLayerView(layers: __esri.FeatureLayer[], extent: __esri.Extent, returnGeometry: boolean = false) : Observable<__esri.Graphic[]> {
    const observableResult: Observable<__esri.Graphic[]>[] = [];
    for (const currentLayer of layers) {
      const layerResult = new Observable<__esri.Graphic[]>(observer => {
        this.mapService.mapView.whenLayerView(currentLayer).then((layerView: __esri.FeatureLayerView) => {
          const query = extent == null ? undefined : new Query({
            geometry: extent,
            returnGeometry: returnGeometry,
          });
          if (layerView.updating) {
            setTimeout(() => {
              EsriUtils.setupWatch(layerView, 'updating').pipe(
                filter(u => !u.newValue),
                take(1)
              ).subscribe(() => {
                layerView.queryFeatures(query).then(results => {
                  observer.next(results.features);
                  observer.complete();
                });
              });
            }, 0);
          } else {
            layerView.queryFeatures(query).then(results => {
              observer.next(results.features);
              observer.complete();
            });
          }
        });
      });
      observableResult.push(layerResult);
    }
    return merge(...observableResult);
  }
}
